/* Public website configuration only. Never put API keys or private tokens here. */
window.LIVE_FOOTBALL_API_BASE = "https://live-football-api.i-boburon.workers.dev";
window.LIVE_FOOTBALL_CONFIG = {
  /* OPTIONAL: GA4 Measurement ID (format: G-XXXXXXXXXX). */
  gaMeasurementId: "",
  adsensePublisherId: "",
  /* Approved AdSense ad-unit slot IDs in display order; leave empty until approved. */
  adsenseSlots: [],
  /* Public YouTube channel URL. */
  youtubeChannelUrl: "",
  /* Necha kun oldinga o'yinlar yuklanadi (1 hafta = 6) */
  daysAhead: 6,
  /* Kechagi va undan oldingi kunlar (video arxivi uchun admin panelda 5 kun qilinadi) */
  daysBack: 1,
  /* Faqat sizga ko'rinadigan "Stream control" tugmasi manzili (sizning kompyuteringizdagi boshqaruv paneli).
     Tugma faqat saytni ?admin=1 bilan bir marta ochgan brauzerda ko'rinadi. */
  controlUrl: "http://localhost:3000/control"
};
