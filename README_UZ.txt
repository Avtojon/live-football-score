LIVE FOOTBALL — RELEASE PACKAGE

WHAT CHANGED
- Preserved the existing dark/navy design and layout.
- Main scoreboard automatically selects a relevant non-women's match by match status and competition/team prestige. A user-selected match is remembered in that browser.
- Women's matches are excluded from default panels and available in the separate Women's Football tab.
- Next Big Match only shows a future, not-started match and avoids the selected main-panel match.
- Today's sidebar list uses the visitor's local date and prioritises live, then upcoming, then finished fixtures.
- Match dates and times use English formatting and the visitor's local timezone; venue time is also shown where the venue timezone can be inferred.
- All Matches prioritises prestigious competitions; lower competitions have their own final tab. Lists use client-side filtering and 15-match pages, without extra API calls.
- Worker requests yesterday/today/tomorrow UTC fixture dates to improve local-day coverage. Shared KV cache targets about 72 current-day calls plus two adjacent-day refreshes per day, under the API-Football free quota of 100/day under normal operation.
- Consent banner provides Accept all, Reject optional, and Settings. Optional Google Analytics/AdSense scripts stay disabled until consent and real IDs are configured.
- Footer cards now link to football news, league tables, and a configurable YouTube channel.

DEPLOY WEBSITE
1. Upload index.html, about.html, and app-config.js to the existing GitHub Pages repository root. Keep the existing filenames and directory structure.
2. The Worker URL is already set in app-config.js. No API key belongs in the website files.

DEPLOY WORKER
1. In Cloudflare Worker live-football-api, replace the Worker code with worker.js from this package and deploy.
2. Keep the existing API_FOOTBALL_KEY Secret and MATCH_CACHE KV binding. Keep ALLOWED_ORIGIN set to https://avtojon.github.io.
3. Test /api/health and /api/matches after deployment.

OPTIONAL CONFIGURATION
- In app-config.js, enter the GA4 Measurement ID in gaMeasurementId only after creating the property.
- Enter the AdSense publisher ID and approved ad-unit slot IDs in adsensePublisherId and adsenseSlots only after account approval and ad-unit creation. Slots are applied to existing ad blocks in page order.
- Enter the public YouTube channel URL in youtubeChannelUrl.
- These are public identifiers, not API secrets. Never put API_FOOTBALL_KEY in app-config.js.

LIMITATIONS / QUOTA SAFETY
- Fixture scores/statuses follow the shared Worker cache. Current-day data refreshes every 20 minutes; the free API plan does not support a reliable per-minute refresh at this request budget.
- Goal-scorer names are requested only for the selected live/finished match. The Worker caches events for 20 minutes and sets a 15/day event-refresh budget, leaving headroom under the 100-request daily quota during normal use. If that small budget is exhausted, scores continue working and scorer details may be unavailable. No scorer details are fabricated.
- The API's three-day UTC window covers more local date boundaries than a single UTC date, but does not represent an unlimited calendar search.
