/* Public website configuration only. Never put API keys or private tokens here. */
/* Data now comes straight from ESPN. This Worker URL is only an optional FALLBACK (leave as is or set to ""). */
window.LIVE_FOOTBALL_API_BASE = "https://live-football-api.i-boburon.workers.dev";
window.LIVE_FOOTBALL_CONFIG = {
  /* OPTIONAL: GA4 Measurement ID (format: G-XXXXXXXXXX). */
  gaMeasurementId: "",
  adsensePublisherId: "",
  /* Approved AdSense ad-unit slot IDs in display order; leave empty until approved. */
  adsenseSlots: [],
  /* Public YouTube channel URL. */
  youtubeChannelUrl: "",
  /* How many days ahead to load (1 week = 6). Can also be changed in the Control panel. */
  daysAhead: 6,
  /* Optional link to your PC stream-control app, shown inside the Control panel.
     The Control panel itself appears only in a browser where you opened the site once with ?admin=1. */
  controlUrl: "http://localhost:3000/control"
};
