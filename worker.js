const API_BASE = "https://v3.football.api-sports.io";
const CACHE_TTL_SECONDS = 1200; // Refresh the current UTC day every 20 minutes.
const CACHE_RETENTION_SECONDS = 86400; // Retain successful daily snapshots for 24 hours.
const ADJACENT_DAY_TTL_SECONDS = 86400; // Yesterday/tomorrow snapshots avoid extra calls on every refresh.
const EVENTS_CACHE_TTL_SECONDS = 1200;
const EVENTS_DAILY_BUDGET = 15; // Leaves headroom under the free plan's 100 requests/day.

function corsHeaders(origin, env) {
  const allowed = (env.ALLOWED_ORIGIN || "*").trim();
  const permitted = allowed === "*" || origin === allowed || origin === "http://localhost:8000";
  return {
    "Access-Control-Allow-Origin": permitted ? (allowed === "*" ? "*" : origin) : "null",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Vary": "Origin"
  };
}

function json(payload, status, cors) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors }
  });
}

function utcDateString(date) { return date.toISOString().slice(0, 10); }
function shiftDate(dateString, days) {
  const d = new Date(`${dateString}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return utcDateString(d);
}

async function getDailyFixtures(date, env, isCurrentDay) {
  const cacheKey = `fixtures-day-v2-${date}`;
  let cached = null;
  try { cached = await env.MATCH_CACHE.get(cacheKey, "json"); } catch (_) {}

  const now = Date.now();
  const ttl = isCurrentDay ? CACHE_TTL_SECONDS : ADJACENT_DAY_TTL_SECONDS;
  if (cached && Array.isArray(cached.response) && cached.cachedAt && now - Date.parse(cached.cachedAt) < ttl * 1000) {
    return { payload: cached, stale: false };
  }

  const endpoint = `${API_BASE}/fixtures?date=${encodeURIComponent(date)}&timezone=UTC`;
  let upstream;
  try {
    upstream = await fetch(endpoint, {
      method: "GET",
      headers: { "x-apisports-key": env.API_FOOTBALL_KEY, "Accept": "application/json" }
    });
  } catch (_) {
    if (cached && Array.isArray(cached.response)) return { payload: cached, stale: true };
    throw new Error(`API-FOOTBALL could not be reached for ${date}.`);
  }

  const body = await upstream.json().catch(() => null);
  if (!upstream.ok || !body || !Array.isArray(body.response) || (body.errors && Object.keys(body.errors).length)) {
    const errorText = body?.errors
      ? Object.entries(body.errors).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : typeof value === "object" ? JSON.stringify(value) : value}`).join("; ")
      : (body?.message || `API-FOOTBALL returned HTTP ${upstream.status}.`);
    if (cached && Array.isArray(cached.response)) return { payload: cached, stale: true };
    throw new Error(errorText);
  }

  const payload = {
    ...body,
    generatedAt: new Date().toISOString(),
    cachedAt: new Date().toISOString(),
    window: { date, timezone: "UTC" },
    cacheTtlSeconds: ttl
  };
  try {
    await env.MATCH_CACHE.put(cacheKey, JSON.stringify(payload), { expirationTtl: CACHE_RETENTION_SECONDS });
  } catch (_) {}
  return { payload, stale: false };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "GET") return json({ message: "Only GET requests are supported." }, 405, cors);
    if (env.ALLOWED_ORIGIN && origin && origin !== env.ALLOWED_ORIGIN && origin !== "http://localhost:8000") {
      return json({ message: "Origin not allowed. Check ALLOWED_ORIGIN in Worker settings." }, 403, cors);
    }

    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        service: "LIVE FOOTBALL API proxy",
        configured: Boolean(env.API_FOOTBALL_KEY && env.MATCH_CACHE),
        cacheMinutes: CACHE_TTL_SECONDS / 60,
        eventsDailyBudget: EVENTS_DAILY_BUDGET,
        dataScope: "yesterday, today, and tomorrow (UTC); client displays local-day fixtures"
      }, 200, cors);
    }
    if (!env.API_FOOTBALL_KEY) return json({ message: "Missing API_FOOTBALL_KEY secret in Cloudflare Worker settings." }, 503, cors);
    if (!env.MATCH_CACHE) return json({ message: "Missing MATCH_CACHE KV binding in Cloudflare Worker settings." }, 503, cors);

    if (url.pathname === "/api/events") {
      const fixtureId = String(url.searchParams.get("fixture") || "").trim();
      if (!/^\d+$/.test(fixtureId)) return json({ message: "A numeric fixture ID is required: /api/events?fixture=12345." }, 400, cors);
      const eventsKey = `fixture-events-v1-${fixtureId}`;
      let cachedEvents = null;
      try { cachedEvents = await env.MATCH_CACHE.get(eventsKey, "json"); } catch (_) {}
      const nowMs = Date.now();
      if (cachedEvents && Array.isArray(cachedEvents.response) && cachedEvents.cachedAt && nowMs - Date.parse(cachedEvents.cachedAt) < EVENTS_CACHE_TTL_SECONDS * 1000) {
        return json(cachedEvents, 200, cors);
      }
      const day = utcDateString(new Date());
      const budgetKey = `fixture-events-budget-v1-${day}`;
      let budget = { count: 0 };
      try { budget = (await env.MATCH_CACHE.get(budgetKey, "json")) || budget; } catch (_) {}
      if (Number(budget.count || 0) >= EVENTS_DAILY_BUDGET) {
        if (cachedEvents && Array.isArray(cachedEvents.response)) return json({ ...cachedEvents, stale: true, limited: true, warning: "Daily event refresh budget reached; showing cached goal events." }, 200, cors);
        return json({ response: [], limited: true, message: "Goal-event refresh budget reached for today. Match scores remain available." }, 200, cors);
      }
      // Reserve a small daily event budget so scorer lookups cannot consume the fixture refresh budget.
      try { await env.MATCH_CACHE.put(budgetKey, JSON.stringify({ count: Number(budget.count || 0) + 1, updatedAt: new Date().toISOString() }), { expirationTtl: 86400 }); } catch (_) {}
      let upstream;
      try {
        upstream = await fetch(`${API_BASE}/fixtures/events?fixture=${encodeURIComponent(fixtureId)}`, { method: "GET", headers: { "x-apisports-key": env.API_FOOTBALL_KEY, "Accept": "application/json" } });
      } catch (_) {
        if (cachedEvents && Array.isArray(cachedEvents.response)) return json({ ...cachedEvents, stale: true, warning: "Event API unavailable; showing cached goal events." }, 200, cors);
        return json({ response: [], message: "Goal events are temporarily unavailable." }, 200, cors);
      }
      const eventBody = await upstream.json().catch(() => null);
      if (!upstream.ok || !eventBody || !Array.isArray(eventBody.response) || (eventBody.errors && Object.keys(eventBody.errors).length)) {
        if (cachedEvents && Array.isArray(cachedEvents.response)) return json({ ...cachedEvents, stale: true, warning: "Event refresh failed; showing cached goal events." }, 200, cors);
        return json({ response: [], message: "Goal events are temporarily unavailable." }, 200, cors);
      }
      const eventPayload = { ...eventBody, fixture: fixtureId, generatedAt: new Date().toISOString(), cachedAt: new Date().toISOString(), cacheTtlSeconds: EVENTS_CACHE_TTL_SECONDS };
      try { await env.MATCH_CACHE.put(eventsKey, JSON.stringify(eventPayload), { expirationTtl: CACHE_RETENTION_SECONDS }); } catch (_) {}
      return json(eventPayload, 200, cors);
    }

    if (url.pathname !== "/api/matches") return json({ message: "Endpoint not found. Use /api/health, /api/matches, or /api/events?fixture=ID." }, 404, cors);

    const today = utcDateString(new Date());
    const dates = [shiftDate(today, -1), today, shiftDate(today, 1)];
    const dailyResults = [];
    const warnings = [];
    // Shared KV cache means roughly 72 current-day calls plus two adjacent-day calls per day.
    // No API calls are made when the user changes a tab or page in the browser.
    for (const date of dates) {
      try {
        dailyResults.push({ date, ...(await getDailyFixtures(date, env, date === today)) });
      } catch (error) {
        warnings.push(`${date}: ${error.message || "fixture request failed"}`);
      }
    }
    if (!dailyResults.some(item => Array.isArray(item.payload?.response))) {
      return json({ message: warnings.join("; ") || "Could not load fixtures from API-FOOTBALL." }, 502, cors);
    }

    const seen = new Set();
    const response = [];
    for (const item of dailyResults) {
      for (const match of (item.payload.response || [])) {
        const id = match?.fixture?.id;
        if (id && !seen.has(id)) { seen.add(id); response.push(match); }
      }
    }
    response.sort((a, b) => new Date(a?.fixture?.date || 0) - new Date(b?.fixture?.date || 0));
    const stale = dailyResults.some(item => item.stale);
    return json({
      get: "fixtures",
      parameters: { dates: dates.join(","), timezone: "UTC" },
      errors: {},
      results: response.length,
      paging: { current: 1, total: 1 },
      response,
      generatedAt: new Date().toISOString(),
      cachedAt: new Date().toISOString(),
      window: { dates, timezone: "UTC", displayTimezone: "browser-local" },
      cacheTtlSeconds: CACHE_TTL_SECONDS,
      stale,
      ...((stale || warnings.length) ? { warning: [...(stale ? ["One or more daily snapshots could not refresh; cached results are being shown."] : []), ...warnings].join("; ") } : {})
    }, 200, cors);
  }
};
