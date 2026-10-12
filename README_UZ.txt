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


DESIGN UPDATE V1.2 (12 OCT 2026)
- Removed the visible API/cache status line from the visitor-facing scoreboard; status remains accessible to assistive technology.
- Removed duplicate match labels and internal fixture ID from the main scoreboard.
- Competition name is now above the teams; score/status and visitor-local kickoff time are centered beneath the matchup.
- Stadium local time is shown only when a venue timezone can be inferred; multi-timezone countries no longer fall back to a potentially wrong default zone.
- Match list cards now place competition above the matchup and status/time under the central score, keeping teams on one row on mobile and desktop.
- Sidebar fixtures use a centered compact layout rather than splitting teams and time into awkward columns.
- Moved All Matches to the last tab.
- Replaced the placeholder search alert with client-side search across already-loaded match data; search makes no extra API requests.
- Improved automatic featured-match priority: major live matches first, then the latest completed major match if no major match is live, then other available options. A user-selected match remains remembered in that browser.
- Kept the existing dark/navy and green visual identity.

DEPLOY
Upload the updated index.html to the root of the GitHub Pages repository. Keep app-config.js and about.html in the root. Worker code and Cloudflare secrets are unchanged in this design-only update.


V1.3 — ANIQLASHTIRISHLAR
- Asosiy scoreboarddagi uchrashuv vaqti brauzerning mahalliy vaqt mintaqasida, LIVE/VS holatining bevosita ostida “Your local time” belgisi bilan ko‘rsatiladi.
- Stadionning mahalliy vaqti faqat vaqt mintaqasi ishonchli aniqlanganda ko‘rsatiladi; aniqlanmasa yashiriladi.
- Foydalanuvchi o‘zi tanlagan uchrashuv sahifa ochiq turgan paytda scoreboardni yangilaydi, ammo F5/brauzer orqali sahifa qayta yuklanganda avtomatik tanlov qayta ishlaydi: nufuzli jonli o‘yin, aks holda eng so‘nggi nufuzli yakunlangan o‘yin, keyin boshqa jonli yoki kelayotgan o‘yin.
- Saralash va ro‘yxat chegaralari saqlanadi: asosiy ro‘yxatda 15 ta o‘yin/sahifa, yordamchi bloklarda cheklangan son.
- Cloudflare Worker, API kalitlari va backend o‘zgartirilmadi.
