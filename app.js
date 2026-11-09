(() => {
  'use strict';
  /* ================= Sozlamalar ================= */
  const CFG = window.LIVE_FOOTBALL_CONFIG || {};
  const Q = new URLSearchParams(location.search);
  const STREAM = Q.get('stream') === '1';           // stream rejimi: video, reklama, cookie banner YO'Q
  let ADMIN = false;
  try {
    if (Q.get('admin') === '1') localStorage.setItem('lf_admin', '1');
    if (Q.get('admin') === '0') localStorage.removeItem('lf_admin');
    ADMIN = localStorage.getItem('lf_admin') === '1';
  } catch (_) {}
  if (STREAM) document.body.classList.add('stream');
  /* Self-healing CSS fallback: agar style.css GitHubda 404/bo'sh bo'lsa ham dizayn buzilmaydi */
  if (!document.getElementById("lf-inline-css")) {
    const checkCss = () => {
      const bg = getComputedStyle(document.body).backgroundColor;
      if (!bg || bg === "rgba(0, 0, 0, 0)" || bg === "rgb(255, 255, 255)" || bg === "transparent") {
        const st = document.createElement("style");
        st.id = "lf-fallback-css";
        st.textContent = `:root{--bg:#030a12;--panel:#091725;--panel2:#0d1d2c;--line:#20364a;--muted:#9db0c2;--white:#f7faff;--green:#2df58a;--red:#ff3048;--blue:#159cff;--amber:#fbbf24}
*{box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
body{margin:0;background:radial-gradient(ellipse at 50% -20%,#102a43 0,transparent 50%),var(--bg);color:var(--white);font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;letter-spacing:.1px}
a{color:inherit;text-decoration:none}
button{font:inherit}
.wrap{width:min(1420px,100%);margin:auto;padding:0 24px}
header{position:sticky;top:0;z-index:20;background:rgba(3,10,18,.96);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
.topbar{height:62px;display:flex;align-items:center;justify-content:space-between;gap:20px}
.brand{display:flex;align-items:center;gap:10px;font-size:clamp(22px,2.4vw,30px);font-weight:900;letter-spacing:-.8px;white-space:nowrap}
.ball{display:inline-grid;place-items:center;width:38px;height:38px;border:2px solid #dce8f5;border-radius:50%;font-size:22px;background:#10283d}
.brand em{font-style:normal;color:var(--green)}
nav{display:flex;align-items:center;gap:26px}
nav a{padding:21px 0 19px;font-size:13.5px;font-weight:800;letter-spacing:.4px;color:#c6d2de;border-bottom:3px solid transparent}
nav a.active,nav a:hover{color:var(--green);border-color:var(--green)}
.nav-actions{display:flex;align-items:center;gap:10px}
.iconbtn{width:40px;height:40px;border:1px solid var(--line);border-radius:10px;background:#0a1826;color:white;cursor:pointer;font-size:18px}
main{padding-top:22px;padding-bottom:36px}
.section-head{display:flex;justify-content:space-between;align-items:center;gap:16px;margin:14px 0}.section-heading-copy{display:flex;flex-direction:column;gap:5px;min-width:0}.section-subtitle{font-size:13px;color:var(--muted);letter-spacing:.2px}.freshness{font-size:12px;color:#8da7bc;white-space:nowrap}
h1,h2,h3,p{margin-top:0}
h1{font-size:clamp(22px,2.6vw,32px);font-weight:900;letter-spacing:-.4px;text-transform:none;margin-bottom:0}
h2{font-size:clamp(21px,2.6vw,28px);font-weight:900;letter-spacing:-.3px;text-transform:uppercase;margin-bottom:15px}
h3{font-size:19px;font-weight:900;text-transform:uppercase;margin-bottom:0}
.livepill{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border:1px solid #176e4a;background:#0c261c;color:var(--green);border-radius:9px;font-size:13px;font-weight:800;white-space:nowrap}
.pulse{display:inline-block;height:9px;width:9px;border-radius:50%;background:var(--green);box-shadow:0 0 12px var(--green);animation:pulse 1.6s infinite}
@keyframes pulse{50%{opacity:.45}}
.ad{position:relative;min-height:96px;margin:20px 0;border:1px dashed #34536d;border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center;text-align:center;padding:18px;background:linear-gradient(110deg,#0d2034,#07121f 55%,#102a41)}
.ad:before{content:"";position:absolute;inset:0;background:repeating-linear-gradient(125deg,transparent 0 36px,rgba(65,158,230,.04) 37px 39px);pointer-events:none}
.ad strong{position:relative;display:block;font-size:clamp(20px,2.6vw,28px);font-weight:900;letter-spacing:.3px}
.ad p{position:relative;color:#b7c7d6;font-size:13px;margin:6px 0 0}
.ad small{position:absolute;right:10px;top:8px;color:#71889d;font-size:9px;letter-spacing:1px}
.content-grid{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:20px;align-items:start}
.maincol,.sidecol{min-width:0}

/* Tablar */
.filterbar{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0 14px}
.filter{border:1px solid var(--line);border-radius:9px;background:#091725;color:#d2e0ec;padding:9px 14px;font-size:13px;font-weight:800;cursor:pointer;transition:background .15s,border-color .15s,color .15s,box-shadow .15s}
.filter:hover:not(.active){background:#0d5c3c;border-color:#24d982;color:#ffffff}
.filter.active{background:linear-gradient(135deg,#c91e36,#7a1021);border-color:var(--red);color:#ffffff;box-shadow:0 0 12px rgba(255,48,72,.35)}
.filter.has-vid:not(.active){border-color:#53f62d;color:#7dff56;background:#0f2916}
.date-filterbar{margin:10px 0 14px;padding-bottom:4px}
.date-filterbar .filter{padding:8px 13px;font-size:12px;letter-spacing:.4px;text-transform:uppercase}

.match-list{display:grid;gap:9px}

/* Panel ichidagi alohida ajratilgan Liga nomi */
.league-badge-box{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:6px 14px;border:1px solid #24d982;border-radius:8px;background:linear-gradient(90deg,#0b2b20,#0d2236);color:var(--green);font-size:12.5px;font-weight:800;letter-spacing:.9px;text-transform:uppercase;box-shadow:0 0 14px rgba(45,245,138,.12)}

/* Yon paneldagi Liga bloki sarlavhalari */
.side-league-header{padding:12px 14px;border-bottom:1px solid #24d98266;background:linear-gradient(90deg,#0b2920,#091929)}
.side-league-header .side-league-country{display:block;color:#9db6cc;font-size:10.5px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:3px}
.side-league-header .side-league-name{display:flex;align-items:center;justify-content:space-between;color:var(--green);font-size:15px;font-weight:900;letter-spacing:.6px;text-transform:uppercase}
.side-league-header .side-league-sub{color:#d8e6f3;font-size:10px;font-weight:800;padding:3px 7px;border:1px solid #274a66;border-radius:5px;background:#081523}

/* Yon paneldagi Foydali Ma'lumot */
.side-info-card{margin:14px 0;padding:14px 15px;border:1px solid #1f4968;border-left:4px solid var(--blue);border-radius:12px;background:linear-gradient(125deg,#0b2135,#071422)}
.side-info-kicker{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--blue);font-size:10.5px;font-weight:800;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px}
.side-info-kicker span.info-tag{padding:2px 6px;border-radius:4px;background:#0d2c47;color:#7cc8ff;border:1px solid #1e5582}
.side-info-title{font-size:14px;font-weight:900;color:var(--white);text-transform:uppercase;letter-spacing:.4px;margin-bottom:5px}
.side-info-text{font-size:12.5px;line-height:1.5;color:#BDD0E0;margin:0}

/* Hisob ostidagi real-time daqiqa va status ko'rinishi */
.realtime-badge{display:inline-flex;align-items:center;justify-content:center;gap:6px;margin-top:4px;padding:5px 12px;border-radius:7px;font-size:12px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;line-height:1.25}
.realtime-badge.is-live{background:#0c2f21;border:1px solid #1f7a53;color:var(--green)}
.realtime-badge.is-ht{background:#2b220c;border:1px solid #8a6d1b;color:#ffd454}
.realtime-badge.is-done{background:linear-gradient(90deg,#1a2c3e,#122231);border:1px solid #3c6082;color:#eef6ff;box-shadow:0 2px 8px rgba(0,0,0,.3)}
.realtime-badge.is-upcoming{background:#0c1c2c;border:1px solid #1f3950;color:#c5d6e6}
.live-dot{width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 8px var(--green);animation:pulse 1.2s infinite;flex:none}

/* Asosiy paneldagi gol mualliflari */
.scorers{display:flex;flex-direction:column;align-items:center;gap:5px;margin-top:10px;font-size:clamp(13px,1.3vw,14.5px);line-height:1.4;color:#e8f3fc;font-weight:700;max-width:100%;overflow-wrap:anywhere}
.scorers span{display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:4px 10px;border-radius:6px;background:rgba(12,35,54,.85);border:1px solid #234763;box-shadow:0 2px 6px rgba(0,0,0,.2)}
.scorers span em{font-style:normal;color:var(--green);font-weight:800}

.mini-crest{font-size:24px;flex:none}
.side-card{border:1px solid #1d3449;border-radius:14px;background:#091725;overflow:hidden;margin-bottom:14px}
.side-title{display:flex;align-items:center;justify-content:space-between;padding:14px 15px 11px;font-size:16px;font-weight:900;text-transform:uppercase}
.side-title span{color:var(--green)}
.vs-row{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:8px}
.vs-team{font-weight:800;font-size:13px}
.vs-logo{display:block;font-size:40px;margin-bottom:6px}
.vs-center{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px}
.vs{font-size:22px;font-weight:900;color:#dce7f2;font-variant-numeric:tabular-nums}
.kickoff{border-top:1px solid #25415a;margin-top:14px;padding-top:12px;font-size:13.5px;font-weight:800;line-height:1.7}
.kickoff small{display:block;color:#a9bdce;font-weight:600}
.small-ad{min-height:105px;margin:14px 0}
.small-ad strong{font-size:19px}
.bottom-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:20px}
.promo{min-height:96px;border:1px solid #23425b;border-radius:12px;background:linear-gradient(115deg,#102b46,#071421);padding:16px;display:flex;align-items:center;gap:13px;cursor:pointer;text-align:left;color:inherit;width:100%;transition:border-color .15s,transform .15s}
.promo:hover{border-color:var(--green);transform:translateY(-1px)}
.promo-icon{display:grid;place-items:center;width:44px;height:44px;flex:none;border:1px solid #2678b3;border-radius:50%;font-size:22px}
.promo b{display:block;font-size:15px;font-weight:900;text-transform:uppercase}
.promo small{display:block;color:#a9bdce;margin-top:4px;font-size:12.5px}
footer{border-top:1px solid #1b3042;margin-top:28px;padding:23px 0;color:#8fa5b8}
.footer-inner{display:flex;align-items:center;justify-content:space-between;gap:15px;flex-wrap:wrap}
footer strong{font-size:19px;color:#fff}
footer a{margin-left:16px;font-size:12.5px}

.data-slot{border:1px solid #23435b;border-radius:15px;background:#06111d;overflow:hidden}
.hero-slot{min-height:320px;padding:18px 24px;background:radial-gradient(ellipse at 50% 100%,#164f3b 0,transparent 58%),linear-gradient(110deg,#0d2945,#07111d 52%,#102a42)}
.slot-top{display:flex;justify-content:space-between;align-items:center;gap:10px;color:#90a8bd;font-size:11px;font-weight:800;letter-spacing:1px}
.slot-badge{padding:6px 10px;background:#123b2a;color:var(--green);border:1px solid #1c6845;border-radius:6px}
.slot-size{color:#7893aa}
.hero-placeholder{display:grid;grid-template-columns:1fr minmax(150px,.9fr) 1fr;align-items:center;gap:12px;margin:14px 0 12px;text-align:center}
.placeholder-team{min-width:0;transition:opacity .2s}
.placeholder-team.is-loser{opacity:.78}
.placeholder-team.is-winner .placeholder-team-name{color:#ffffff;text-shadow:0 0 14px rgba(45,245,138,.25)}
.win-check{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#134e35;border:1px solid var(--green);color:var(--green);font-size:12px;vertical-align:middle}
.placeholder-crest{width:clamp(64px,7vw,92px);height:clamp(64px,7vw,92px);display:grid;place-items:center;margin:0 auto 10px;border:1px dashed #45647c;border-radius:18px;background:#0a1d2d;color:#8fa8bc;font-size:10px;font-weight:800}
.placeholder-team-name{font-size:clamp(16px,2vw,24px);font-weight:900}
.placeholder-score{display:flex;flex-direction:column;align-items:center;gap:6px}
.placeholder-score>span{font-size:clamp(48px,6.5vw,82px);font-weight:900;line-height:.95;color:#f4f8fc;font-variant-numeric:tabular-nums}
.placeholder-score small{font-size:12px;color:#a8bfd4;font-weight:700;letter-spacing:.3px}
.hero-vid-btn{margin-top:4px;display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:99px;border:1px solid #66ff33;background:linear-gradient(90deg,#1a4712,#0e2d0a);color:#7dff4d;font-size:12px;font-weight:900;letter-spacing:.5px;cursor:pointer;box-shadow:0 0 14px rgba(102,255,51,.25)}
.hero-vid-btn:hover{background:#66ff33;color:#041a02}
.empty-state{padding:18px 14px;border:1px dashed #31506a;border-radius:12px;color:#b2c5d6;text-align:center;background:#081522;font-size:13px;line-height:1.55;margin-top:8px}
.team-logo{width:clamp(58px,7vw,88px);height:clamp(58px,7vw,88px);object-fit:contain;filter:drop-shadow(0 6px 8px #0007)}
.mini-logo{width:26px;height:26px;object-fit:contain;flex:none}
.mini-logo-xs{width:18px;height:18px;object-fit:contain;vertical-align:middle;margin:0 4px}
.promo.youtube-promo .promo-icon{display:grid;place-items:center;width:52px;height:38px;border-radius:10px;background:#ff0033;color:#fff;font-size:0;border:0;flex:none}
.promo.youtube-promo .promo-icon svg{width:52px;height:38px;display:block}
.section-head{margin-top:10px;margin-bottom:18px}
.section-head#live h1{font-size:14px;font-weight:900;letter-spacing:.4px;text-transform:uppercase;line-height:1.4}
.api-status,.sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
.search-wrap{display:flex;align-items:center;gap:7px;order:2;margin-left:auto;min-width:40px}
nav{order:3;margin-left:24px}
#siteSearch{width:clamp(180px,22vw,290px);height:40px;padding:0 40px 0 12px;border:1px solid var(--line);border-radius:10px;background:#081725;color:#f4f8fc;outline:none;font-size:14px}
#siteSearch:focus{border-color:var(--green);box-shadow:0 0 0 2px #24d98222}
#siteSearch[hidden],#searchClear[hidden]{display:none!important}
.featured-empty{min-height:205px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;color:#b8c9d8}
.featured-empty strong{font-size:clamp(19px,2vw,25px);color:#f3f7fb}
.featured-empty span{font-size:13.5px;color:#91a8bc}
.featured-league{margin:16px 0 8px;text-align:center}
.featured-venue{margin-top:14px;padding-top:12px;border-top:1px solid #25415a;text-align:center;color:#b8c9d8;font-size:13.5px}

/* cookie */
.cookie-banner{position:fixed;z-index:100;left:16px;right:16px;bottom:16px;max-width:860px;margin:auto;background:#0b1a29;border:1px solid #2b465e;border-radius:12px;box-shadow:0 15px 50px #0009;padding:17px;color:#e8f1f8}.cookie-banner p{font-size:13px;line-height:1.55;color:#b9c9d7;margin:7px 0 13px}.cookie-actions{display:flex;gap:8px;flex-wrap:wrap}.cookie-actions button{border:1px solid #37536b;border-radius:8px;padding:9px 12px;background:#12283b;color:#f4f8fc;font-weight:800;cursor:pointer}.cookie-actions .accept{background:#0d5c3c;border-color:#24d982}.cookie-banner a{color:#65e9aa}.cookie-settings-panel{position:fixed;z-index:101;inset:0;background:#0009;display:grid;place-items:center;padding:16px}.cookie-settings-card{max-width:460px;width:100%;background:#0b1a29;border:1px solid #2b465e;border-radius:12px;padding:20px;color:#e8f1f8}.cookie-settings-card label{display:flex;gap:9px;margin:13px 0;font-size:14px}.cookie-settings-card p{font-size:13px;color:#b9c9d7;line-height:1.5}.cookie-settings-card button{border:1px solid #37536b;border-radius:8px;padding:9px 12px;background:#12283b;color:#f4f8fc;font-weight:800;cursor:pointer;margin:4px 6px 0 0}

/* ===== V2/V3 Umumiy elementlar ===== */
.filter .cnt{margin-left:6px;padding:1px 6px;border-radius:6px;background:#ffffff1f;font-size:11px}
.more-btn{display:block;width:calc(100% - 24px);margin:8px 12px 10px;padding:10px;border:1px dashed #31506a;border-radius:10px;background:#081522;color:#9fe3c0;font-weight:800;font-size:13px;cursor:pointer}
.more-btn:hover{border-color:var(--green)}
.hero-slot .status-line{display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-top:6px}
.admin-chip{display:inline-block;padding:5px 10px;border:1px solid #8a6d1b;border-radius:7px;background:#2b220c;color:#ffd454;font-size:11.5px;font-weight:800;letter-spacing:.5px}
.slot-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center;margin-top:12px}
.slot-actions button,.slot-actions a{border:1px solid #29465e;border-radius:8px;background:#0d2133;color:#dfeaf5;padding:8px 13px;font-size:12.5px;font-weight:800;cursor:pointer}
.slot-actions button:hover{border-color:var(--green)}

/* Timeline & Stats */
.tl-row{display:grid;grid-template-columns:1fr 68px 1fr;gap:10px;align-items:center;padding:9px 4px;border-bottom:1px solid #12263a;font-size:14px}
.tl-row.is-goal{background:linear-gradient(90deg,rgba(45,245,138,.05),rgba(45,245,138,.12) 50%,rgba(45,245,138,.05));border-radius:6px}
.tl-row .tl-h{text-align:right}.tl-row .tl-a{text-align:left}
.tl-m{text-align:center;font-weight:900;color:var(--green);font-variant-numeric:tabular-nums;background:#0b231a;border:1px solid #1c573e;border-radius:6px;padding:3px 6px;font-size:12.5px}
.tl-row small{color:#95aec4;font-weight:600}
.info-line{margin-top:12px;padding:8px 10px;border-radius:8px;background:#091928;color:#b2c6d8;font-size:12.5px;text-align:center;line-height:1.6}
.stats-head{display:flex;justify-content:space-between;align-items:center;padding:6px 4px 10px;margin-bottom:8px;border-bottom:1px solid #172e44;font-size:13px;color:#9eb5c9;font-weight:800}
.stats-head span{display:inline-flex;align-items:center;gap:7px}
.sbar{margin:13px 0}.sbar .l{display:flex;justify-content:space-between;font-size:13.5px;font-weight:800;margin-bottom:6px;color:#d2e0ec}.sbar .l span{color:#9eb5c9;font-weight:700}
.sbar .l b.hi{color:var(--green)}
.sbar .b{height:10px;border-radius:6px;background:#159cff;overflow:hidden}.sbar .b i{display:block;height:100%;background:var(--green);transition:width .3s}

/* ===== LINE-UPS: FUTBOLCHI SILUETI (Squard.png referensiga mos) + ZAXIRA + HAKAMLAR ===== */
.pitches{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.pitch{background:#071422;border:1px solid #1a334a;border-radius:14px;padding:12px}
.pitch h4{display:flex;justify-content:space-between;align-items:center;margin:0 0 10px;padding-bottom:8px;border-bottom:2px solid var(--green);font-size:15px;font-weight:900;text-transform:uppercase}
.pitch-team{display:inline-flex;align-items:center;gap:8px}
.pitch-form{padding:3px 9px;border-radius:6px;background:#10293f;border:1px solid #274d6e;color:#ffd454;font-size:12.5px;font-weight:800}
.pitch.away h4{border-color:var(--blue)}

/* Maydon chizig'i va maysa (Squard.png kabi chuqur stadion maysasi) */
.fld{position:relative;aspect-ratio:4/5;border-radius:12px;border:2px solid rgba(255,255,255,.32);background:radial-gradient(ellipse at 50% 50%,rgba(45,245,138,.09) 0%,transparent 70%),repeating-linear-gradient(0deg,#155d32 0 9.09%,#114f2a 9.09% 18.18%);overflow:hidden;box-shadow:inset 0 0 40px rgba(0,0,0,.45)}
.fld:before{content:"";position:absolute;left:22%;right:22%;bottom:0;height:15%;border:2px solid rgba(255,255,255,.28);border-bottom:0;pointer-events:none}
.fld-markings-top{position:absolute;left:22%;right:22%;top:0;height:15%;border:2px solid rgba(255,255,255,.22);border-top:0;pointer-events:none}
.fld-midline{position:absolute;left:0;right:0;top:50%;height:2px;background:rgba(255,255,255,.22);pointer-events:none}
.fld-circle{position:absolute;left:50%;top:50%;width:24%;aspect-ratio:1/1;transform:translate(-50%,-50%);border:2px solid rgba(255,255,255,.22);border-radius:50%;pointer-events:none}

/* Futbolchi konteyneri */
.pl{position:absolute;transform:translate(-50%,-50%);text-align:center;width:24%;max-width:110px;z-index:2;display:flex;flex-direction:column;align-items:center;transition:transform .15s}
.pl:hover{transform:translate(-50%,-53%) scale(1.07);z-index:5}
.pl-fig{position:relative;width:clamp(42px,4.8vw,56px);height:clamp(38px,4.3vw,50px);display:grid;place-items:center}
.pl-svg{width:100%;height:100%;overflow:visible}
.pl-svg .sil-glow{stroke-width:2.6; stroke-linejoin:round}
.pl-svg .sil-collar{fill:none;stroke:rgba(255,255,255,.45);stroke-width:1.8;stroke-linecap:round}

/* Jamoa libosi ranglari va neon nurlanishi (Squard.png uslubida) */
.kit-home .sil-glow{fill:#d91b38;stroke:#ff6e85;filter:drop-shadow(0 0 8px rgba(255,56,92,.65))}
.kit-away .sil-glow{fill:#0e74d8;stroke:#68c2ff;filter:drop-shadow(0 0 8px rgba(21,156,255,.65))}
.kit-gk-h .sil-glow,.kit-gk-a .sil-glow{fill:#0ea563;stroke:#57f7ac;filter:drop-shadow(0 0 8px rgba(45,245,138,.65))}

/* Ko'krakdagi o'yinchi raqami */
.pl-num{position:absolute;bottom:14%;left:50%;transform:translateX(-50%);font-size:clamp(13px,1.5vw,16.5px);font-weight:900;color:#ffffff;text-shadow:0 1px 4px rgba(0,0,0,.95);letter-spacing:-.3px;line-height:1;pointer-events:none}

/* O'yinchi ismi yozilgan plashka (Squard.png kabi) */
.pl-tag{margin-top:-2px;padding:3px 8px;border-radius:6px;background:rgba(4,12,20,.92);border:1.5px solid #ff5670;box-shadow:0 3px 8px rgba(0,0,0,.65);max-width:100%;min-width:56px}
.kit-away .pl-tag{border-color:#45b1ff}
.kit-gk-h .pl-tag,.kit-gk-a .pl-tag{border-color:#3df59b}
.pl-tag span{display:block;font-size:clamp(11px,1.2vw,13px);font-weight:800;color:#f8fbff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:.15px;line-height:1.2}

/* O'yinchi ustidagi gol/kartochka belgilari */
.pl-badges{position:absolute;top:-4px;right:-6px;display:flex;gap:2px;z-index:3}
.pl-b{display:inline-grid;place-items:center;min-width:17px;height:17px;padding:0 3px;border-radius:99px;background:#07131f;border:1px solid #2c4c68;font-size:10px;font-weight:900;box-shadow:0 2px 5px #000a}

/* Zaxira o'rindig'i (Substitutes) */
.bench{margin-top:12px;padding-top:10px;border-top:1px solid #162b3f}
.bench-title{font-size:11px;font-weight:900;color:#8da7bc;letter-spacing:1px;margin-bottom:7px;text-transform:uppercase}
.bench-grid{display:flex;flex-wrap:wrap;gap:6px}
.bench-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:7px;background:#0b1c2c;border:1px solid #1d364d;font-size:12.5px;font-weight:700;color:#d6e4f0}
.bench-chip b{color:var(--green);font-weight:900;font-size:11.5px}
.bench-chip small{color:#819cb3;font-size:10.5px;font-weight:700}
.bench-chip.came-on{border-color:#1f7a53;background:#0b261c;color:#fff}
.bench-chip em{font-style:normal;font-size:11px}

/* Hakamlar va Stadion bloki (Line-ups eng pastida) */
.officials-card{margin-top:14px;padding:13px 15px;border:1px solid #1d3850;border-left:4px solid #ffd454;border-radius:12px;background:linear-gradient(90deg,#0b1c2c,#081420)}
.officials-head{font-size:12px;font-weight:900;color:#ffd454;letter-spacing:1px;text-transform:uppercase;margin-bottom:9px}
.officials-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px}
.off-item{padding:8px 11px;border-radius:8px;background:#07121d;border:1px solid #162b3e}
.off-role{display:block;font-size:10.5px;font-weight:800;color:#8da7bc;text-transform:uppercase;letter-spacing:.6px;margin-bottom:3px}
.off-name{display:block;font-size:13.5px;font-weight:800;color:#f2f7fc}

/* ===== H2H & FORM BO'LIMI ===== */
.h2h-wrap{display:grid;gap:14px}
.insight-box{padding:13px 15px;border:1px solid #1f5c42;border-left:4px solid var(--green);border-radius:12px;background:linear-gradient(110deg,#0a241b,#081624)}
.insight-title{font-size:12px;font-weight:900;color:var(--green);letter-spacing:1px;margin-bottom:8px;text-transform:uppercase}
.insight-list{margin:0;padding-left:18px;display:grid;gap:6px;font-size:13.5px;line-height:1.5;color:#dce9f5}
.insight-list b{color:#fff}

.pred-card{padding:12px 14px;border:1px solid #1b344a;border-radius:11px;background:#081624}
.pred-head{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13px;font-weight:800;margin-bottom:8px}
.pred-mid{font-size:11px;color:#95aec4;letter-spacing:.8px;text-transform:uppercase}
.pred-bar{display:flex;height:11px;border-radius:99px;overflow:hidden;background:#102233;gap:2px}
.pb-h{background:var(--green);height:100%}
.pb-d{background:#64748b;height:100%}
.pb-a{background:var(--blue);height:100%}

.tape-grid{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;padding:12px 14px;border:1px solid #1b344a;border-radius:11px;background:#081523}
.tape-side{display:flex;flex-direction:column;gap:7px}
.tape-side.away{align-items:flex-end;text-align:right}
.tape-team{display:inline-flex;align-items:center;gap:8px;font-size:15px;font-weight:900}
.tape-vs{padding:6px 10px;border-radius:8px;background:#0d2235;border:1px solid #24435e;font-size:12px;font-weight:900;color:#9db6cc}
.tape-meta{font-size:12.5px;color:#9eb5c9}
.tape-meta b{color:#fff}

.form-strip{display:inline-flex;gap:5px}
.f-pill{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:6px;font-size:11.5px;font-weight:900;color:#fff;flex:none}
.f-pill.is-w{background:#108548;border:1px solid #2df58a;color:#eafff3}
.f-pill.is-d{background:#6b5314;border:1px solid #fbbf24;color:#fff8db}
.f-pill.is-l{background:#7c1929;border:1px solid #ff5c72;color:#ffe6ea}

.h2h-section{border:1px solid #1b344a;border-radius:11px;background:#081523;overflow:hidden}
.h2h-sec-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding:10px 14px;background:#0b1d2e;border-bottom:1px solid #182f44;font-size:12px;font-weight:900;color:var(--green);letter-spacing:.7px}
.h2h-summary{color:#cfe0ee;font-size:12px}
.h2h-list{display:grid}
.h2h-item{display:grid;grid-template-columns:130px 1fr 72px 1fr;align-items:center;gap:8px;padding:9px 14px;border-bottom:1px solid #112436;font-size:13.5px}
.h2h-item:last-child{border-bottom:0}
.h2h-date{font-size:11.5px;color:#8da7bc;font-weight:700}
.h2h-Date small{color:#6f8ba1}
.h2h-t{font-weight:700;color:#b8cade;display:inline-flex;align-items:center;gap:5px}
.h2h-t.home{justify-content:flex-end;text-align:right}
.h2h-t.win{color:#fff;font-weight:900}
.h2h-sc{text-align:center;font-weight:900;background:#0d2234;border:1px solid #213d56;border-radius:6px;padding:3px 6px;color:#fff;font-variant-numeric:tabular-nums}

.h2h-cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.h2h-col{border:1px solid #1b344a;border-radius:11px;background:#081523;overflow:hidden}
.h2h-col-head{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#0b1d2e;border-bottom:1px solid #182f44;font-size:13px;font-weight:900}
.form-row{display:grid;grid-template-columns:26px 82px 1fr auto;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid #112436;font-size:13px}
.form-row:last-child{border-bottom:0}
.form-date{font-size:11.5px;color:#8da7bc}
.form-opp{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#d6e4f0}
.form-sc{font-weight:900;color:#fff;font-variant-numeric:tabular-nums;padding:2px 7px;border-radius:5px;background:#0d2234}

/* Video Admin Box */
.vid-admin-box{margin-bottom:12px;padding:12px 14px;border:1px solid #2b543a;border-radius:10px;background:#081b14}
.vid-admin-title{font-size:13px;color:var(--green);margin-bottom:8px}
.vid-admin-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}
.vid-url-in{flex:1;min-width:220px;padding:8px 11px;border:1px solid #284b68;border-radius:8px;background:#07131f;color:#fff;font-size:13.5px}

/* Turnir jadvali (Table) */
.tbl{width:100%;border-collapse:collapse;font-size:13.5px}.tbl th{color:#8da7bc;font-size:11.5px;text-align:right;padding:7px 6px;border-bottom:1px solid #1d3449}.tbl td{padding:8px 6px;text-align:right;border-bottom:1px solid #12263a;font-variant-numeric:tabular-nums}
.tbl th:nth-child(2),.tbl td:nth-child(2){text-align:left}.tbl td.t{display:flex;align-items:center;gap:8px;font-weight:800}.tbl tr.hl td{background:#0d2a21;color:var(--green)}.tbl td b{color:#fff}
.tbl img{width:20px;height:20px;object-fit:contain}.tbl-wrap{max-height:430px;overflow:auto}
.grp-name{margin:12px 0 4px;color:var(--green);font-size:12px;font-weight:900;letter-spacing:1px;text-transform:uppercase}
.vid{display:block;width:100%;aspect-ratio:16/9;border:0;border-radius:12px;background:#000}
.spot-body{padding:6px 12px 14px;text-align:center}.spot-body .vs-row{cursor:pointer}
.spot-body .kickoff{margin-top:12px}
.comp-list{padding:0 10px 12px;display:grid;gap:6px}.comp-list button{display:flex;justify-content:space-between;align-items:center;border:1px solid #1a3043;border-radius:9px;background:#08131f;color:#dfeaf5;padding:9px 11px;font-size:13.5px;font-weight:800;cursor:pointer;text-align:left}.comp-list button:hover{border-color:var(--green)}.comp-list small{color:#8da7bc}
body.stream .ad,body.stream .cookie-banner,body.stream .bottom-grid{display:none!important}

/* ===== Admin paneli ===== */
#admBtn{position:fixed;right:16px;bottom:16px;z-index:60;border:1px solid #8a6d1b;border-radius:99px;background:#2b220c;color:#ffd454;padding:10px 16px;font-weight:900;letter-spacing:.8px;cursor:pointer;box-shadow:0 8px 24px #000a}
#admDrawer{position:fixed;top:12px;right:12px;bottom:70px;width:min(480px,calc(100vw - 24px));z-index:61;overflow:auto;border:1px solid #2a4a63;border-radius:14px;background:#07131f;box-shadow:0 20px 60px #000c;color:#e6eef7;font-size:14px}
#admDrawer[hidden]{display:none}
.adm-h{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid #1d3449;font-weight:900}
.adm-h button,#admDrawer button,#admDrawer select,#admDrawer input[type=number]{font:inherit;border:1px solid #2c4b63;border-radius:9px;background:#0d2133;color:#fff;padding:8px 12px;cursor:pointer}
#admDrawer button:hover{border-color:var(--green)}
.adm-s{padding:14px 16px;border-bottom:1px solid #12263a;display:grid;gap:9px}
.adm-s h4{margin:0;color:var(--green);font-size:12px;letter-spacing:1.2px;text-transform:uppercase}
.adm-err{color:#ff8a8a}.adm-ok{color:#86efac}.adm-mut{color:#8da7bc;font-size:12.5px;line-height:1.45}
.adm-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.adm-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px 10px}.adm-grid label{display:flex;gap:7px;align-items:center;font-size:13px}
#admDrawer select{width:100%}

/* ===== V3.2: LIVESCORE RO'YXATI (2-skrinshotdagi kabi vaqt + FT, g'olib jamoa, ▶ video belgisi) ===== */
.ls-bar{display:grid;gap:10px;margin-bottom:14px}
.ds-wrap{display:flex;align-items:center;gap:6px}
.ds-arrow{flex:none;width:36px;height:42px;border:1px solid #21394e;border-radius:10px;background:#0a1826;color:#cfe0ee;font-size:22px;font-weight:900;cursor:pointer}
.ds-arrow:hover{border-color:var(--green);color:var(--green)}
.datestrip{display:flex;gap:6px;overflow-x:auto;scroll-behavior:smooth;scrollbar-width:none;flex:1;padding:2px}
.datestrip::-webkit-scrollbar{display:none}
.ds-btn{flex:none;min-width:86px;text-align:center;border:1px solid #21394e;border-radius:10px;background:#0a1826;color:#c9d8e6;padding:7px 10px;font-weight:800;cursor:pointer;line-height:1.2}
.ds-btn small{display:block;font-size:10.5px;color:#8da7bc;font-weight:700;letter-spacing:.3px;margin-top:2px}
.ds-btn.active{background:var(--green);border-color:var(--green);color:#03120b}.ds-btn.active small{color:#0a3a22}
.ds-btn.live{border-color:#7b1d2a;color:#ffb3bd}.ds-btn.live.active{background:#d4223c;border-color:#d4223c;color:#fff}.ds-btn.live.active small{color:#ffd5db}
.ls-filters{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.seg{display:inline-flex;border:1px solid #21394e;border-radius:10px;overflow:hidden;flex-wrap:wrap}
.seg button{border:0;background:#0a1826;color:#c9d8e6;padding:8px 13px;font-weight:800;font-size:13px;cursor:pointer;border-right:1px solid #21394e}
.seg button:last-child{border-right:0}.seg button.active{background:#13324a;color:var(--green)}
.seg .cnt{margin-left:6px;font-size:11px;opacity:.8}
.pill-x{border:1px solid #1e6447;border-radius:99px;background:#0b281d;color:var(--green);padding:6px 12px;font-size:12.5px;font-weight:800;cursor:pointer}
.ls-note{color:#88a1b7;font-size:12px}

.lg-block{margin-bottom:12px;border:1px solid #1a3043;border-radius:12px;background:#07131f;overflow:hidden}
.lg-head{display:flex;align-items:center;gap:10px;width:100%;border:0;border-bottom:1px solid #16293a;background:linear-gradient(90deg,#0d2a21,#08151f 70%);color:#fff;padding:11px 14px;cursor:pointer;text-align:left}
.lg-head b{color:var(--green);font-size:14.5px;font-weight:900;letter-spacing:.6px;text-transform:uppercase}.lg-head small{color:#9db6cc;font-size:11.5px;font-weight:700;letter-spacing:.5px;text-transform:uppercase}
.lg-vid-dot{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#65ff24;color:#051a00;font-size:10px;font-weight:900;box-shadow:0 0 10px rgba(101,255,36,.4)}
.lg-head .lg-n{margin-left:auto;font-size:11.5px;font-weight:800;color:#9db6cc}.lg-head .lg-n.live{color:#ff8a98}.lg-head .lg-c{color:#6f8ba1;font-size:12px}

/* O'yin qatori */
.lrow{display:grid;grid-template-columns:82px 1fr 98px 1fr auto;align-items:center;gap:10px;width:100%;border:0;border-bottom:1px solid #102334;border-left:3px solid transparent;background:transparent;color:#eef5fb;padding:11px 14px;cursor:pointer;text-align:left;font:inherit;transition:background .15s}
.lrow:hover{background:#0b1d2c}
.lrow.open{background:#0d2336;border-left-color:var(--green)}
.lrow.is-live-row{border-left-color:var(--red);background:linear-gradient(90deg,rgba(255,48,72,.07),transparent 35%)}
.lrow.is-fin{border-left-color:#3b5c7a;background:rgba(9,20,32,.65)}

/* Chap ustun: Vaqt + Status ustma-ust (2-skrinshotdagi kabi: 01:00 / FT) */
.lr-st{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;font-variant-numeric:tabular-nums;line-height:1.15;text-align:center}
.lr-day{font-size:10px;color:#7f9ab2;font-weight:700}
.lr-time{font-size:13px;font-weight:800;color:#c2d4e4}
.lr-time.is-ko{font-size:14px;font-weight:900;color:#eef6ff}
.st-badge{display:inline-flex;align-items:center;justify-content:center;padding:2px 7px;border-radius:5px;font-size:10.5px;font-weight:900;letter-spacing:.5px;text-transform:uppercase}
.st-badge.is-ft{background:#182b3d;border:1px solid #3c6082;color:#d6e8f8}
.st-badge.is-live{background:#3a0f18;border:1px solid #ff4760;color:#ff8595;animation:pulse 1.5s infinite}
.st-badge.is-ht{background:#2f240c;border:1px solid #bb9225;color:#ffd86b}
.st-badge.is-up{background:#0c2233;border:1px solid #1e425e;color:#7fb5dc;font-size:9.5px}
.st-badge.is-pp{background:#2a171c;border:1px solid #7d3545;color:#f3a6b4}

/* Jamoa nomlari (G'olib jamoa aniq ajralib turadi) */
.lr-t{display:flex;align-items:center;gap:10px;min-width:0;font-weight:800;font-size:15.5px;color:#dce8f4}
.lr-t.home{justify-content:flex-end;text-align:right}
.lr-t b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:800}
.lr-t.is-winner{color:#ffffff}
.lr-t.is-winner b{font-weight:900;color:#ffffff;text-shadow:0 0 10px rgba(255,255,255,.15)}
.lr-t.is-loser{color:#8aa1b6}
.lr-t.is-loser b{font-weight:700}
.lr-t img,.lr-t .mini-crest{width:24px;height:24px;object-fit:contain;flex:none}

/* Markaziy hisob qutisi */
.lr-sc{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-weight:900;font-size:18px;letter-spacing:.8px;background:#0c2030;border:1px solid #1f3c54;border-radius:9px;padding:5px 8px;font-variant-numeric:tabular-nums;line-height:1.1}
.lr-sc.live{color:var(--green);border-color:#1e6447;background:#0a2018;box-shadow:0 0 12px rgba(45,245,138,.12)}
.lr-sc.fin{background:#102233;border-color:#345573;color:#f5f9ff}
.sc-sub{display:block;font-size:9px;font-weight:900;letter-spacing:.9px;color:#89a6c0;margin-top:2px;text-transform:uppercase}
.sc-sub.live-sub{color:var(--green)}

/* O'ng tomondagi Video (▶), Sevimli (☆) va Ochish (⌄) tugmalari */
.lr-actions{display:inline-flex;align-items:center;justify-content:flex-end;gap:7px}
.vid-pill{display:inline-grid;place-items:center;width:26px;height:26px;border-radius:50%;border:0;background:#65ff24;color:#051a00;font-size:12px;font-weight:900;cursor:pointer;box-shadow:0 0 12px rgba(101,255,36,.45);transition:transform .15s}
.vid-pill:hover{transform:scale(1.12);background:#82ff4d}
.fav-btn{border:0;background:transparent;color:#5c7891;font-size:17px;line-height:1;padding:3px;cursor:pointer;transition:color .15s,transform .15s}
.fav-btn:hover{color:#ffd454;transform:scale(1.15)}
.fav-btn.on{color:#ffd454}
.lr-sh,.lr-sa{display:none}
.lr-ch{color:#6f8ba1;font-size:16px;text-align:center;transition:transform .2s;width:18px}
.lrow.open .lr-ch{transform:rotate(180deg);color:var(--green)}

.mdetail{border-bottom:1px solid #16293a;background:#06101a;padding:0}
.md-tabs{display:flex;gap:6px;flex-wrap:wrap;padding:10px 12px;border-bottom:1px solid #12263a;background:#07121e}.md-tabs .filter{padding:7px 13px;font-size:12.5px}
.md-body{padding:14px 16px;min-height:90px}
.cm-pin{margin-bottom:10px;padding:10px 12px;border:1px solid #1e6447;border-radius:10px;background:#0b281d;font-weight:800;font-size:13.5px}
.cm-note{padding:9px 12px;margin-bottom:8px;border-left:4px solid var(--green);border-radius:8px;background:#0a1826;font-size:13.5px}.cm-note small{display:block;color:#8da7bc;font-size:11px;margin-bottom:2px}
.hero-slot #heroDetail .mdetail{margin-top:14px;border:1px solid #1d3449;border-radius:12px;overflow:hidden}

/* Mobil va Planshet moslashuvi (2-skrinshotdagi kabi ustma-ust jamoalar va o'ngda hisob + ▶ video) */
@media(max-width:1000px){
  .content-grid{grid-template-columns:minmax(0,1fr) 300px}
  .wrap{padding-left:18px;padding-right:18px}
}
@media(max-width:760px){
  .topbar{height:auto;min-height:65px;flex-wrap:wrap;padding-top:10px;padding-bottom:8px;position:relative}
  .ball{width:32px;height:32px;font-size:19px}
  nav{order:3;width:100%;justify-content:space-between;gap:12px;margin-left:0}
  nav a{padding:9px 0 7px;font-size:12.5px}
  .search-wrap{order:2;margin-left:auto}
  .search-wrap #siteSearch{position:absolute;top:67px;right:14px;z-index:20;width:min(78vw,320px);box-shadow:0 10px 25px #0008}
  .search-wrap #searchClear{position:absolute;top:67px;right:14px;z-index:21;width:32px;height:32px;min-width:32px;border:0;background:transparent}
  .content-grid{grid-template-columns:1fr}
  .sidecol{display:grid;grid-template-columns:1fr;gap:0}
  .bottom-grid{grid-template-columns:1fr}
  .promo{min-height:78px}
  .hero-slot{padding:16px 10px}
  .hero-placeholder{grid-template-columns:minmax(0,1fr) minmax(96px,.85fr) minmax(0,1fr);gap:5px}
  .hero-placeholder .team-logo{width:52px;height:52px}
  .hero-placeholder .placeholder-team-name{font-size:clamp(13px,3.2vw,17px)}
  .hero-placeholder .placeholder-score>span{font-size:clamp(34px,8.5vw,54px)}
  .scorers{font-size:12.5px}
  .pitches,.h2h-cols{grid-template-columns:1fr}
  .tape-grid{grid-template-columns:1fr;text-align:center}
  .tape-side,.tape-side.away{align-items:center;text-align:center}
  .h2h-item{grid-template-columns:92px 1fr 58px 1fr;font-size:12.5px;padding:8px 10px}
  .tl-row{grid-template-columns:1fr 56px 1fr;font-size:13px}
}
@media(max-width:700px){
  .lrow{grid-template-columns:64px 1fr 32px auto;grid-template-areas:"st home sh act" "st away sa act";row-gap:6px;padding:10px 10px}
  .lr-st{grid-area:st}
  .lr-t.home{grid-area:home;justify-content:flex-start;text-align:left;flex-direction:row}
  .lr-t.home img,.lr-t.home .mini-crest{order:-1}
  .lr-t.away{grid-area:away}
  .lr-sc{display:none}
  .lr-sh,.lr-sa{display:block;text-align:center;font-weight:900;font-size:16px;color:#b8cade}
  .lr-sh.is-winner,.lr-sa.is-winner{color:#ffffff}
  .lr-sh{grid-area:sh}.lr-sa{grid-area:sa}
  .lr-actions{grid-area:act}
  .ds-btn{min-width:76px}.md-body{padding:12px}
}

/* admin: tablar, sharhlar */
.adm-tabs{display:flex;gap:4px;padding:8px 10px;border-bottom:1px solid #12263a;background:#081522;position:sticky;top:0;z-index:2}
.adm-tabs button{flex:1;padding:9px 4px!important;font-size:12px;font-weight:800}.adm-tabs button.on{background:#13324a!important;border-color:var(--green)!important;color:var(--green)}
.adm-qg{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));gap:6px}.adm-qg button{font-size:13px;font-weight:800;padding:8px 6px}
.adm-note{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;padding:8px 10px;border:1px solid #16293a;border-radius:9px;background:#0a1826;font-size:13px}.adm-note small{display:block;color:#7f98ad;margin-top:2px;word-break:break-all}.adm-note button{flex:none;padding:3px 8px!important;background:#5a1620!important}
#admDrawer textarea,#admDrawer input[type=password]{width:100%;font:inherit;border:1px solid #2c4b63;border-radius:9px;background:#0d2133;color:#fff;padding:9px}
.maincol,.sidecol,.ls-bar,.ds-wrap,.datestrip,.ls-list,.lg-block,.lrow-wrap,.mdetail{min-width:0;max-width:100%}
.datestrip{overscroll-behavior-x:contain}
.md-body,.tbl-wrap{overflow-x:auto}
.md-grid{display:grid;grid-template-columns:minmax(0,1fr) 290px}
.md-aside{border-left:1px solid #12263a;padding:12px 14px;min-width:0}.md-aside:empty{display:none}
.md-aside-t{margin-bottom:8px;color:var(--green);font-size:11.5px;font-weight:900;letter-spacing:1px;text-transform:uppercase}
.md-aside .tbl{font-size:12.5px}.md-aside .tbl td.t{gap:6px}.md-aside .tbl img{width:16px;height:16px}.tbl tr.gap td{text-align:center!important;color:#6f8ba1;padding:2px}
.md-pick{margin-left:auto;border:1px solid #1e6447;border-radius:8px;background:#0b281d;color:var(--green);padding:7px 12px;font-size:12px;font-weight:800;cursor:pointer}
@media(max-width:1100px){.md-grid{grid-template-columns:minmax(0,1fr)}.md-aside{display:none}}`;
        document.head.appendChild(st);
      }
    };
    checkCss();
    window.addEventListener("load", checkCss, { once: true });
  }

  document.addEventListener('error', e => { if (e.target && e.target.tagName === 'IMG') e.target.style.visibility = 'hidden'; }, true);

  const $ = id => document.getElementById(id);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const { T, isLive, ymd, addDays, dkey, minNum, fm, lgInfo, safeUrl, validId, ytId, HOUR } = LF.h;
  const PAGE = 8;                                    // har ligadan boshida nechta o'yin ko'rsatiladi
  const fmtTime = d => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  const fmtDay = d => new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtShortDate = d => {
    const dt = new Date(d);
    return isNaN(dt) ? String(d || '') : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  /* ================= Sevimli o'yinlar (faqat localStorage, hech qayerga uzatilmaydi) ================= */
  const FAV_KEY = 'lf_favs_v1';
  const favs = new Set();
  try { (JSON.parse(localStorage.getItem(FAV_KEY) || '[]') || []).forEach(id => { if (validId(id)) favs.add(id); }); } catch (_) {}
  function toggleFav(id) {
    if (!validId(id)) return;
    favs.has(id) ? favs.delete(id) : favs.add(id);
    try { localStorage.setItem(FAV_KEY, JSON.stringify([...favs].slice(-100))); } catch (_) {}
  }

  /* ================= Holat ================= */
  const S = { tab: null, status: 'all', lg: 'all', q: '', open: null, heroOpen: false, dtab: 'timeline', collapsed: new Set(), more: new Set(), notes: new Map(), hero: null, pick: null };
  try { S.hero = ADMIN ? localStorage.getItem('lf_hero') : null; } catch (_) {}
  if (STREAM && Q.get('m') && validId(Q.get('m'))) S.hero = Q.get('m');

  /* ================= Tanlash ================= */
  const heroMatch = () => (S.pick && LF.get(S.pick)) || (S.hero && LF.get(S.hero)) || LF.pickBest(null);
  const spotMatch = () => { const h = heroMatch(); return LF.pickBest(h ? h.lg : null); };
  const byId = id => LF.get(id);
  const hasVideo = id => !STREAM && !!ytId(LF.videoFor(id));

  /* ================= Umumiy: badge, gol urganlar ================= */
  function badge(m) {
    if (m.s === 'in') return `<span class="realtime-badge is-live"><i class="live-dot"></i>LIVE · ${esc(m.c || 'IN PLAY')}</span>`;
    if (m.s === 'ht') return '<span class="realtime-badge is-ht">⏸ HALF-TIME</span>';
    if (m.s === 'post') return `<span class="realtime-badge is-done">🏁 FULL-TIME (${esc(m.sd || 'FT')}) · FINISHED</span>`;
    if (m.s === 'pp') return '<span class="realtime-badge is-done">⚠ POSTPONED</span>';
    return `<span class="realtime-badge is-upcoming">🕒 KICK-OFF ${esc(fmtTime(m.d))}</span>`;
  }
  function scorers(m, side) {
    const g = new Map();
    for (const e of m.e || []) if (e.k === 'g' && e.t === side) {
      const k = e.p || '?';
      if (!g.has(k)) g.set(k, []);
      g.get(k).push(fm(e.m) + (e.q === 'p' ? ' (P)' : e.q === 'o' ? ' (OG)' : ''));
    }
    return g.size ? `<div class="scorers">${[...g].map(([p, ms]) => `<span>⚽ ${esc(p)} <em>${esc(ms.join(', '))}</em></span>`).join('')}</div>` : '';
  }
  const crest = (t, cls) => t && safeUrl(t.l) ? `<img class="${cls}" src="${esc(safeUrl(t.l))}" alt="" loading="lazy">` : '<span class="mini-crest">⚽</span>';

  /* ================= Tafsilotlar komponenti (hero va ro'yxat uchun bitta) ================= */
  const DT = [
    ['timeline', 'Timeline'],
    ['stats', 'Stats'],
    ['lineups', 'Line-ups'],
    ['h2h', 'H2H & Form'],
    ['table', 'Table'],
    ['video', 'Video']
  ];

  function mergedEvents(m, d) {
    const seen = new Set(), evs = [];
    for (const e of [].concat(d && d.events || [], m.e || [])) {
      const key = e.k === 's' ? `s|${e.p}|${e.o}` : `${e.k}|${minNum(e.m)}|${e.t}`;
      if (!seen.has(key)) { seen.add(key); evs.push(e); }
    }
    return evs.sort((x, y) => minNum(x.m) - minNum(y.m));
  }
  function evHTML(e) {
    const ic = { g: '⚽', y: '🟨', r: '🟥', s: '🔁' }[e.k] || '•';
    const extra = e.q === 'p' ? ' <small>(pen)</small>' : e.q === 'o' ? ' <small>(own goal)</small>' : '';
    return e.k === 's' ? `${ic} <b>${esc(e.p)}</b> <small>in for ${esc(e.o)}</small>` : `${ic} <b>${esc(e.p)}</b>${extra}`;
  }

  function tlHTML(m, d) {
    const evs = mergedEvents(m, d);
    const rec = S.notes.get(m.id);
    if (!rec && ! STREAM) {
      S.notes.set(m.id, { t: Date.now(), d: null, busy: true });
      LF.notes(m.id).then(j => { S.notes.set(m.id, { t: Date.now(), d: j }); refreshDetails(m.id); });
    }
    const n = rec && rec.d;
    const pinHtml = n && n.pin ? `<div class="cm-pin">📌 ${esc(n.pin)}</div>` : '';
    const manualNotes = (n && n.notes || []).slice(-3).reverse().map(x => `<div class="cm-note"><small>${esc(x.t || 'LIVE NOTE')}</small>${esc(x.x)}</div>`).join('');
    if (!evs.length && !pinHtml && !manualNotes) {
      return `<div class="empty-state">${m.s === 'pre' ? `Kick-off at ${esc(fmtTime(m.d))}. Check the H2H & Form tab for team comparison and recent results!` : 'No key match events recorded yet.'}</div>`;
    }
    const rows = evs.map(e => `<div class="tl-row${e.k === 'g' ? ' is-goal' : ''}"><div class="tl-h">${e.t === 'h' ? evHTML(e) : ''}</div><div class="tl-m">${esc(fm(e.m))}</div><div class="tl-a">${e.t === 'a' ? evHTML(e) : ''}</div></div>`).join('');
    const i = d && d.info ? d.info : {};
    const info = [i.venue || m.v ? '🏟 ' + (i.venue || m.v) : '', i.city || m.ct, i.att ? '👥 Attendance ' + Number(i.att).toLocaleString() : '', i.ref ? '⚖️ Referee: ' + i.ref : ''].filter(Boolean).join(' · ');
    return pinHtml + manualNotes + rows + (info ? `<div class="info-line">${esc(info)}</div>` : '');
  }

  function statsHTML(m, d) {
    const ext = d && d.extStats;
    if (ext && ext.length) {
      return `<div class="stats-head"><span>${crest(m.h, 'mini-logo')} <b>${esc(m.h.n)}</b></span><span>TECHNICAL STATS</span><span><b>${esc(m.a.n)}</b> ${crest(m.a, 'mini-logo')}</span></div>` +
        ext.map(s => {
          const a = Number(s.h) || 0, b = Number(s.a) || 0, tot = (a + b) || 1;
          const pct = (a === 0 && b === 0) ? 50 : Math.round((a / tot) * 100);
          const fa = (s.u === '%' ? Math.round(a) + '%' : a), fb = (s.u === '%' ? Math.round(b) + '%' : b);
          return `<div class="sbar"><div class="l"><b class="${a > b ? 'hi' : ''}">${esc(fa)}</b><span>${esc(s.l)}</span><b class="${b > a ? 'hi' : ''}">${esc(fb)}</b></div><div class="b"><i style="width:${pct}%"></i></div></div>`;
        }).join('');
    }
    if (!m.st) return '<div class="empty-state">Live technical statistics appear as soon as the match kicks off.</div>';
    const N = [['p', 'Ball Possession', v => Math.round(v) + '%'], ['sh', 'Total Shots', v => v], ['ot', 'Shots on Target', v => v], ['co', 'Corner Kicks', v => v], ['fo', 'Fouls Committed', v => v]];
    return `<div class="stats-head"><span>${crest(m.h, 'mini-logo')} <b>${esc(m.h.n)}</b></span><span>TECHNICAL STATS</span><span><b>${esc(m.a.n)}</b> ${crest(m.a, 'mini-logo')}</span></div>` +
      N.map(([k, n, f]) => {
        const [a, b] = m.st[k] || [0, 0], t = (a + b) || 1;
        return `<div class="sbar"><div class="l"><b class="${a > b ? 'hi' : ''}">${f(a)}</b><span>${n}</span><b class="${b > a ? 'hi' : ''}">${f(b)}</b></div><div class="b"><i style="width:${a || b ? a / t * 100 : 50}%"></i></div></div>`;
      }).join('');
  }

  /* ================= Line-ups: O'yinchi silueti (Squard.png uslubida) + Zaxira + Hakamlar ================= */
  const W = n => n >= 4 ? 76 : n === 3 ? 64 : 42;
  function place(xi, form) {
    const f = String(form || '').split('-').map(Number).filter(n => n > 0);
    let rows;
    if (f.length >= 2 && f.reduce((x, y) => x + y, 0) === 10) {
      rows = [[xi[0]]];
      let i = 1;
      f.forEach(n => { rows.push(xi.slice(i, i + n)); i += n; });
    } else {
      const g = p => /^G/.test(p.pos) ? 0 : /^(D|CB|LB|RB|WB|SW)/.test(p.pos) ? 1 : /^(F|ST|CF|LW|RW|SS)/.test(p.pos) ? 3 : 2;
      rows = [[], [], [], []];
      xi.forEach(p => rows[g(p)].push(p));
      rows = rows.filter(r => r.length);
    }
    const out = [], n = rows.length;
    rows.forEach((r, ri) => r.forEach((p, k) => out.push({
      p,
      isGK: ri === 0 || /^G/i.test(p.pos || ''),
      x: r.length === 1 ? 50 : 50 - W(r.length) / 2 + k * W(r.length) / (r.length - 1),
      y: 88 - ri * (74 / Math.max(n - 1, 1))
    })));
    return out;
  }

  /* O'yinchi hodisalari (gol, kartochka, almashtirish) ni siluet ustida ko'rsatish */
  function playerBadges(p, evs) {
    if (!evs || !evs.length) return '';
    const fn = String(p.f || p.n || '').toLowerCase(), sn = String(p.n || '').toLowerCase();
    const matchName = who => {
      const w = String(who || '').toLowerCase();
      return w && (w === fn || w === sn || (sn.length >= 3 && w.endsWith(sn)));
    };
    const b = [];
    let goals = 0;
    for (const e of evs) {
      if (e.k === 'g' && matchName(e.p)) goals++;
      else if (e.k === 'y' && matchName(e.p)) b.push('<span class="pl-b yc" title="Yellow card">🟨</span>');
      else if (e.k === 'r' && matchName(e.p)) b.push('<span class="pl-b rc" title="Red card">🟥</span>');
      else if (e.k === 's' && matchName(e.o)) b.push('<span class="pl-b sub" title="Substituted off">🔻</span>');
    }
    if (goals === 1) b.unshift('<span class="pl-b gl" title="Goal">⚽</span>');
    else if (goals > 1) b.unshift(`<span class="pl-b gl" title="${goals} Goals">⚽×${goals}</span>`);
    return b.length ? `<div class="pl-badges">${b.slice(0, 3).join('')}</div>` : '';
  }

  /* Broadcast-uslubidagi futbolchi silueti (Squard.png referensiga mos: bosh + yelka + ko'krakda raqam + neon kontur) */
  function playerSilhouetteSVG(kitClass) {
    return `<svg class="pl-svg ${kitClass}" viewBox="0 0 64 58" aria-hidden="true" focusable="false">
      <path class="sil-glow" d="M32 4c6.2 0 11 4.8 11 11 0 4.3-2.2 8-5.6 9.8 1.2 1.8 3.2 3 6.2 3.8l8.8 2.4c4.8 1.3 8.1 5.6 8.6 10.6L62 54H2l1-12.4c.5-5 3.8-9.3 8.6-10.6l8.8-2.4c3-.8 5-2 6.2-3.8C23.2 23 21 19.3 21 15c0-6.2 4.8-11 11-11z"/>
      <path class="sil-collar" d="M24 27.5c2.4 2.5 5.1 3.7 8 3.7s5.6-1.2 8-3.7"/>
    </svg>`;
  }

  function pitchHTML(t, side, teamObj, evs) {
    if (!t) return '';
    const dots = place(t.xi, t.form).map(o => {
      const kitClass = o.isGK ? (side === 'h' ? 'kit-gk-h' : 'kit-gk-a') : (side === 'h' ? 'kit-home' : 'kit-away');
      return `<div class="pl ${kitClass}" style="left:${o.x}%;top:${o.y}%" title="${esc((o.p.num ? '#' + o.p.num + ' ' : '') + (o.p.f || o.p.n) + (o.p.pos ? ' (' + o.p.pos + ')' : ''))}">
        <div class="pl-fig">
          ${playerSilhouetteSVG(kitClass)}
          <span class="pl-num">${esc(o.p.num || '•')}</span>
          ${playerBadges(o.p, evs)}
        </div>
        <div class="pl-tag"><span>${esc(o.p.n)}</span></div>
      </div>`;
    }).join('');

    const benchChips = (t.bench && t.bench.length)
      ? `<div class="bench"><div class="bench-title">🔄 SUBSTITUTES BENCH</div><div class="bench-grid">${t.bench.map(p => {
          const subbedIn = (evs || []).some(e => e.k === 's' && String(e.p || '').toLowerCase().endsWith(String(p.n || '').toLowerCase()));
          return `<span class="bench-chip${subbedIn ? ' came-on' : ''}">${p.num ? `<b>#${esc(p.num)}</b>` : ''}${esc(p.n)}${p.pos ? `<small>${esc(p.pos)}</small>` : ''}${subbedIn ? ' <em>🔼</em>' : ''}</span>`;
        }).join('')}</div></div>`
      : '';

    return `<div class="pitch ${side === 'h' ? 'home' : 'away'}">
      <h4><span class="pitch-team">${crest(teamObj, 'mini-logo')} ${esc(teamObj.n)}</span><span class="pitch-form">${esc(t.form || 'XI')}</span></h4>
      <div class="fld">
        <div class="fld-markings-top"></div>
        <div class="fld-midline"></div>
        <div class="fld-circle"></div>
        ${dots}
      </div>
      ${benchChips}
    </div>`;
  }

  function lineupHTML(m, d) {
    const L = d && d.lineup;
    const evs = mergedEvents(m, d);
    const i = (d && d.info) || {};
    const officials = (i.officials && i.officials.length)
      ? i.officials
      : (i.ref ? [{ n: i.ref, r: 'Main Referee' }] : []);

    const officialsHTML = `<div class="officials-card">
      <div class="officials-head"><span>⚖️ MATCH OFFICIALS &amp; VENUE INFO</span></div>
      <div class="officials-grid">
        ${officials.length
          ? officials.map(o => `<div class="off-item"><span class="off-role"> whistle · ${esc(o.r)}</span><strong class="off-name">${esc(o.n)}</strong></div>`).join('')
          : '<div class="off-item"><span class="off-role">Main Referee</span><strong class="off-name">To be confirmed (TBC)</strong></div>'}
        ${(i.venue || m.v) ? `<div class="off-item"><span class="off-role">🏟 Stadium / Venue</span><strong class="off-name">${esc(i.venue || m.v)}${(i.city || m.ct) ? ' · ' + esc(i.city || m.ct) : ''}</strong></div>` : ''}
        ${i.att ? `<div class="off-item"><span class="off-role">👥 Attendance</span><strong class="off-name">${Number(i.att).toLocaleString()} spectators</strong></div>` : ''}
      </div>
    </div>`;

    if (!L || (!L.h && !L.a)) {
      return `<div class="empty-state">Starting line-ups are usually confirmed about 60 minutes before kick-off.</div>${officialsHTML}`;
    }
    return `<div class="pitches">${pitchHTML(L.h, 'h', m.h, evs)}${pitchHTML(L.a, 'a', m.a, evs)}</div>${officialsHTML}`;
  }

  /* ================= H2H & Form (Commentary o'rniga qiziqarli tahlil bo'limi) ================= */
  function findTeamRow(lg, teamId, teamName) {
    const rec = LF.store.table.get(lg);
    if (!rec || !rec.d || !rec.d.groups) return null;
    const tn = String(teamName || '').toLowerCase();
    for (const g of rec.d.groups) {
      for (const r of g.rows || []) {
        if (r.i === teamId || String(r.n || '').toLowerCase() === tn) return r;
      }
    }
    return null;
  }

  function h2hHTML(m, d) {
    if (!LF.store.table.has(m.lg)) {
      LF.loadTable(m.lg).then(() => { refreshDetails(m.id); renderSideTable(); });
    }
    const hRow = findTeamRow(m.lg, m.h.i, m.h.n);
    const aRow = findTeamRow(m.lg, m.a.i, m.a.n);
    const form = (d && d.form) || { h: [], a: [] };
    const h2h = (d && d.h2h) || [];

    /* O'zaro o'yinlar (H2H) hisob-kitobi */
    let hWins = 0, aWins = 0, draws = 0, totalGoals = 0;
    h2h.forEach(g => {
      totalGoals += (g.hg || 0) + (g.ag || 0);
      if (g.hg === g.ag) draws++;
      else {
        const homeWon = g.hg > g.ag;
        const hIsHome = String(g.hn || '').toLowerCase() === String(m.h.n || '').toLowerCase();
        if ((homeWon && hIsHome) || (!homeWon && !hIsHome)) hWins++;
        else aWins++;
      }
    });

    /* G'alaba ehtimoli / Jamoalar kuchi (Predictor yoki Jadval+Forma asosida) */
    let pred = d && d.pred;
    if (!pred) {
      const formPts = arr => (arr || []).reduce((s, x) => s + (x.r === 'W' ? 3 : x.r === 'D' ? 1 : 0), 0);
      const hScore = 36 + formPts(form.h) * 2.2 + (hRow ? Math.max(0, 22 - hRow.r) * 1.2 : 10);
      const aScore = 30 + formPts(form.a) * 2.2 + (aRow ? Math.max(0, 22 - aRow.r) * 1.2 : 10);
      const tot = hScore + aScore + 26;
      const hp = Math.round((hScore / tot) * 100);
      const ap = Math.round((aScore / tot) * 100);
      pred = { h: hp, d: Math.max(10, 100 - hp - ap), a: ap };
    }

    /* Qiziqarli faktlar (Match Insights) */
    const facts = [];
    if (hRow && aRow) {
      const diff = Math.abs(hRow.pts - aRow.pts);
      if (diff <= 3) facts.push(`🔥 <b>Six-pointer clash:</b> Only <b>${diff} point${diff === 1 ? '' : 's'}</b> separate ${esc(m.h.n)} (#${hRow.r}) and ${esc(m.a.n)} (#${aRow.r}) in the ${esc(lgInfo(m.lg).n)} standings.`);
      else facts.push(`📊 <b>Table positions:</b> ${esc(m.h.n)} sit <b>#${hRow.r}</b> (${hRow.pts} pts, GD ${hRow.gd > 0 ? '+' + hRow.gd : hRow.gd}) while ${esc(m.a.n)} are <b>#${aRow.r}</b> (${aRow.pts} pts, GD ${aRow.gd > 0 ? '+' + aRow.gd : aRow.gd}).`);
      if (hRow.p > 0 && aRow.p > 0) {
        const hPpg = (hRow.pts / hRow.p).toFixed(2), aPpg = (aRow.pts / aRow.p).toFixed(2);
        facts.push(`⚡ <b>Season pace:</b> ${esc(m.h.n)} average <b>${hPpg} pts/game</b> (${hRow.w}W-${hRow.d}D-${hRow.lo}L) vs ${esc(m.a.n)}'s <b>${aPpg} pts/game</b> (${aRow.w}W-${aRow.d}D-${aRow.lo}L).`);
      }
    }
    if (h2h.length) {
      const avgG = (totalGoals / h2h.length).toFixed(1);
      facts.push(`⚔️ <b>Head-to-Head trend:</b> Their last <b>${h2h.length}</b> meetings produced <b>${totalGoals} goals</b> (<b>${avgG} goals per match</b>) — ${esc(m.h.n)} won ${hWins}, ${draws} draws, ${esc(m.a.n)} won ${aWins}.`);
    }
    const countW = arr => (arr || []).filter(x => x.r === 'W').length;
    if (form.h.length || form.a.length) {
      facts.push(`📈 <b>Recent momentum:</b> Over their last ${Math.max(form.h.length, form.a.length)} outings, ${esc(m.h.n)} claimed <b>${countW(form.h)} win${countW(form.h) === 1 ? '' : 's'}</b> while ${esc(m.a.n)} recorded <b>${countW(form.a)} win${countW(form.a) === 1 ? '' : 's'}</b>.`);
    }
    if (!facts.length) {
      facts.push(`🏆 <b>Featured ${esc(lgInfo(m.lg).n)} fixture:</b> ${esc(m.h.f || m.h.n)} vs ${esc(m.a.f || m.a.n)}${m.v ? ' at ' + esc(m.v) : ''}.`);
    }

    const formPills = arr => (arr && arr.length)
      ? `<div class="form-strip">${arr.map(x => `<span class="f-pill is-${x.r.toLowerCase()}" title="${esc((x.h ? 'vs ' : '@ ') + x.opp + ' (' + x.sc + ')')}">${esc(x.r)}</span>`).join('')}</div>`
      : '<span class="adm-mut">No recent form data</span>';

    const formList = (arr, teamObj) => `
      <div class="h2h-col">
        <div class="h2h-col-head">${crest(teamObj, 'mini-logo')} <b>${esc(teamObj.n)} · Last 5 Matches</b></div>
        ${(arr && arr.length) ? arr.map(x => `
          <div class="form-row">
            <span class="f-pill is-${x.r.toLowerCase()}">${esc(x.r)}</span>
            <span class="form-date">${esc(fmtShortDate(x.d))}</span>
            <span class="form-opp">${x.h ? 'vs' : '@'} ${x.l ? `<img src="${esc(x.l)}" alt="" class="mini-logo-xs">` : ''}<b>${esc(x.opp)}</b></span>
            <span class="form-sc">${esc(x.sc)}</span>
          </div>
        `).join('') : '<div class="empty-state">Recent matches will appear once loaded.</div>'}
      </div>`;

    return `<div class="h2h-wrap">
      <!-- 1. Match Insights & Key Facts -->
      <div class="insight-box">
        <div class="insight-title">💡 MATCH INSIGHTS &amp; PRE-MATCH FACTS</div>
        <ul class="insight-list">${facts.map(f => `<li>${f}</li>`).join('')}</ul>
      </div>

      <!-- 2. Team Power / Win Probability Bar -->
      <div class="pred-card">
        <div class="pred-head">
          <span><b>${esc(m.h.n)}</b> ${pred.h}%</span>
          <span class="pred-mid">MATCH MOMENTUM · DRAW ${pred.d}%</span>
          <span>${pred.a}% <b>${esc(m.a.n)}</b></span>
        </div>
        <div class="pred-bar">
          <i class="pb-h" style="width:${pred.h}%"></i>
          <i class="pb-d" style="width:${pred.d}%"></i>
          <i class="pb-a" style="width:${pred.a}%"></i>
        </div>
      </div>

      <!-- 3. Tale of the Tape (2 Jamoa solishtirmasi) -->
      <div class="tape-grid">
        <div class="tape-side home">
          <div class="tape-team">${crest(m.h, 'mini-logo')} <b>${esc(m.h.n)}</b></div>
          ${formPills(form.h)}
          <div class="tape-meta">${hRow ? `Rank <b>#${hRow.r}</b> · <b>${hRow.pts}</b> pts · GD <b>${hRow.gd > 0 ? '+' + hRow.gd : hRow.gd}</b>` : esc(lgInfo(m.lg).n)}</div>
        </div>
        <div class="tape-vs">VS</div>
        <div class="tape-side away">
          <div class="tape-team"><b>${esc(m.a.n)}</b> ${crest(m.a, 'mini-logo')}</div>
          ${formPills(form.a)}
          <div class="tape-meta">${aRow ? `Rank <b>#${aRow.r}</b> · <b>${aRow.pts}</b> pts · GD <b>${aRow.gd > 0 ? '+' + aRow.gd : aRow.gd}</b>` : esc(lgInfo(m.lg).n)}</div>
        </div>
      </div>

      <!-- 4. O'zaro o'yinlar (H2H History) -->
      <div class="h2h-section">
        <div class="h2h-sec-head">
          <span>⚔️ HEAD-TO-HEAD (PREVIOUS MEETINGS)</span>
          ${h2h.length ? `<span class="h2h-summary"><b>${esc(m.h.n)}: ${hWins}W</b> · <b>Draws: ${draws}</b> · <b>${esc(m.a.n)}: ${aWins}W</b></span>` : ''}
        </div>
        ${h2h.length ? `<div class="h2h-list">${h2h.map(g => {
          const hw = g.hg > g.ag, aw = g.ag > g.hg;
          return `<div class="h2h-item">
            <span class="h2h-date">${esc(fmtShortDate(g.d))}${g.lg ? ` <small>· ${esc(g.lg)}</small>` : ''}</span>
            <span class="h2h-t home${hw ? ' win' : ''}">${esc(g.hn)} ${g.hl ? `<img src="${esc(g.hl)}" alt="" class="mini-logo-xs">` : ''}</span>
            <span class="h2h-sc">${g.hg} – ${g.ag}</span>
            <span class="h2h-t away${aw ? ' win' : ''}">${g.al ? `<img src="${esc(g.al)}" alt="" class="mini-logo-xs">` : ''} ${esc(g.an)}</span>
          </div>`;
        }).join('')}</div>` : '<div class="empty-state">No recent head-to-head meetings recorded in ESPN archive for this pair.</div>'}
      </div>

      <!-- 5. Har ikki jamoaning oxirgi 5 o'yini -->
      <div class="h2h-cols">${formList(form.h, m.h)}${formList(form.a, m.a)}</div>
    </div>`;
  }

  function tableAround(m) {
    const rec = LF.store.table.get(m.lg);
    if (!rec || !rec.d || !rec.d.groups || !rec.d.groups.length) return '';
    const ids = [m.h.i, m.a.i], g = rec.d.groups.find(x => x.rows.some(r => ids.includes(r.i))) || rec.d.groups[0], rows = g.rows;
    const keep = new Set([0, 1, 2]);
    rows.forEach((r, i) => { if (ids.includes(r.i)) [i - 1, i, i + 1].forEach(k => { if (k >= 0 && k < rows.length) keep.add(k); }); });
    const idx = [...keep].sort((a, b) => a - b); let html = '', prev = -1;
    for (const i of idx) {
      const r = rows[i];
      if (prev >= 0 && i - prev > 1) html += '<tr class="gap"><td colspan="4">⋯</td></tr>';
      html += `<tr class="${ids.includes(r.i) ? 'hl' : ''}"><td>${r.r}</td><td class="t">${safeUrl(r.l) ? `<img src="${esc(safeUrl(r.l))}" alt="" loading="lazy">` : ''}${esc(r.n)}</td><td>${r.p}</td><td><b>${r.pts}</b></td></tr>`;
      prev = i;
    }
    return `<div class="md-aside-t">${esc(lgInfo(m.lg).n)}${g.name && rec.d.groups.length > 1 ? ' · ' + esc(g.name) : ''}</div><table class="tbl"><thead><tr><th>#</th><th>Team</th><th>P</th><th>Pts</th></tr></thead><tbody>${html}</tbody></table>`;
  }
  function asideHTML(m) {
    if (S.dtab === 'table') return '';
    if (!LF.store.table.has(m.lg)) { LF.loadTable(m.lg).then(() => { refreshDetails(m.id); renderSideTable(); }); return '<div class="md-aside-t">Loading table…</div>'; }
    return tableAround(m);
  }
  function tableHTML(m, limit) {
    const rec = LF.store.table.get(m.lg);
    if (!rec) { LF.loadTable(m.lg).then(() => { refreshDetails(m.id); renderSideTable(); }); return '<div class="empty-state">Loading table…</div>'; }
    if (!rec.d || !rec.d.groups || !rec.d.groups.length) return '<div class="empty-state">No standings table is available for this competition.</div>';
    const ids = [m.h.i, m.a.i], gs = rec.d.groups;
    return gs.map(g => {
      let rows = g.rows;
      if (limit) rows = rows.slice(0, limit);
      else if (gs.length > 1 && !g.rows.some(r => ids.includes(r.i))) return '';
      return `${g.name && gs.length > 1 ? `<div class="grp-name">${esc(g.name)}</div>` : ''}<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead><tbody>${rows.map(r => `<tr class="${ids.includes(r.i) ? 'hl' : ''}"><td>${r.r}</td><td class="t">${safeUrl(r.l) ? `<img src="${esc(safeUrl(r.l))}" alt="" loading="lazy">` : ''}${esc(r.n)}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.lo}</td><td>${r.gd > 0 ? '+' : ''}${r.gd}</td><td><b>${r.pts}</b></td></tr>`).join('')}</tbody></table></div>`;
    }).join('');
  }

  function videoHTML(m) {
    if (STREAM) return '<div class="empty-state">Video is disabled in stream mode.</div>';
    const curUrl = LF.videoFor(m.id);
    const id = ytId(curUrl);
    const adminBox = ADMIN ? `<div class="vid-admin-box">
      <div class="vid-admin-title">🎬 <b>Admin · Attach YouTube Video / Highlights</b> <small>(Match ID: <code>${esc(m.id)}</code>)</small></div>
      <div class="vid-admin-row">
        <input type="url" class="vid-url-in" data-vid-input="${esc(m.id)}" placeholder="Paste YouTube link (e.g. https://youtu.be/xxxxxxxxxxx)" value="${esc(curUrl)}">
        <button type="button" class="filter active" data-vid-save="${esc(m.id)}">💾 Save Video</button>
        ${id ? `<button type="button" class="filter" data-vid-del="${esc(m.id)}">🗑 Remove</button>` : ''}
      </div>
      <div class="adm-mut" data-vid-msg="${esc(m.id)}">Saved videos show a green ▶ icon on the match row for visitors.</div>
    </div>` : '';

    if (!id) return adminBox + '<div class="empty-state">No video highlight has been linked for this match yet.</div>';
    return adminBox + `<iframe class="vid" src="https://www.youtube-nocookie.com/embed/${id}?rel=0" title="Match video" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  }

  function mdBody(m) {
    const rec = LF.store.detail.get(m.id), d = rec && rec.d;
    if (!rec) loadDetail(m);
    return {
      timeline: () => tlHTML(m, d),
      stats: () => statsHTML(m, d),
      lineups: () => lineupHTML(m, d),
      h2h: () => h2hHTML(m, d),
      table: () => tableHTML(m, 0),
      video: () => videoHTML(m)
    }[S.dtab]();
  }

  const mdShell = (m, inHero) => {
    const vOn = hasVideo(m.id);
    return `<div class="mdetail" data-for="${esc(m.id)}"><div class="md-tabs" role="tablist">${DT.map(([k, n]) => {
      const label = k === 'video' && vOn ? `▶ ${n} ●` : n;
      return `<button type="button" role="tab" class="filter${S.dtab === k ? ' active' : ''}${k === 'video' && vOn ? ' has-vid' : ''}" data-dt="${k}" aria-pressed="${S.dtab === k}">${label}</button>`;
    }).join('')}${inHero ? '' : `<button type="button" class="md-pick" data-pick="${esc(m.id)}" title="Show this match in the main panel">📌 Show in main panel</button>`}</div><div class="md-grid"><div class="md-body">${mdBody(m)}</div><aside class="md-aside">${asideHTML(m)}</aside></div></div>`;
  };

  async function loadDetail(m, force) { await LF.loadDetail(m, force); refreshDetails(m.id); }
  function refreshDetails(id) {
    const m = byId(id); if (!m) return;
    document.querySelectorAll(`.mdetail[data-for="${CSS.escape(id)}"]`).forEach(el => {
      el.querySelectorAll('.md-tabs .filter').forEach(b => {
        if (!b.dataset.dt) return;
        const on = b.dataset.dt === S.dtab;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
        if (b.dataset.dt === 'video') {
          const vOn = hasVideo(m.id);
          b.classList.toggle('has-vid', vOn);
          b.textContent = vOn ? '▶ Video ●' : 'Video';
        }
      });
      el.querySelector('.md-body').innerHTML = mdBody(m);
      el.querySelector('.md-aside').innerHTML = asideHTML(m);
    });
  }

  /* ================= Asosiy panel va Spotlight ================= */
  function renderHero() {
    const m = heroMatch(), el = $('featuredMatch');
    if (!m) { el.innerHTML = '<div class="empty-state featured-empty"><strong>No major match right now</strong><span>Check the fixtures below for the next big game.</span></div>'; $('heroDetail').innerHTML = ''; return; }
    const li = lgInfo(m.lg), h = m.h, a = m.a, pre = m.s === 'pre' || m.s === 'pp', fin = m.s === 'post';
    const venue = [m.v, m.ct].filter(Boolean).join(' · ');
    const logo = t => safeUrl(t.l) ? `<img class="team-logo" src="${esc(safeUrl(t.l))}" alt="${esc(t.n)} logo">` : '<div class="placeholder-crest">⚽</div>';
    const vBadge = hasVideo(m.id) ? `<button type="button" class="hero-vid-btn" data-hero-vid="${esc(m.id)}">▶ WATCH HIGHLIGHTS</button>` : '';
    const hWin = fin && h.g > a.g, aWin = fin && a.g > h.g;
    el.innerHTML = `<div class="featured-league"><span class="league-badge-box">${esc(li.n)}${m.nt ? ' · ' + esc(String(m.nt).toUpperCase()) : ''}</span></div>
      <div class="hero-placeholder${fin ? ' is-finished-hero' : ''}">
        <div class="placeholder-team${hWin ? ' is-winner' : aWin ? ' is-loser' : ''}">${logo(h)}<div class="placeholder-team-name">${esc(h.n)}${hWin ? ' <span class="win-check" title="Winner">✓</span>' : ''}</div>${scorers(m, 'h')}</div>
        <div class="placeholder-score"><span>${pre ? esc(fmtTime(m.d)) : `${h.g} – ${a.g}`}</span><div class="status-line">${badge(m)}</div><small>🕒 ${esc(fmtDay(m.d))} · ${esc(fmtTime(m.d))} (Local time)</small>${vBadge}</div>
        <div class="placeholder-team${aWin ? ' is-winner' : hWin ? ' is-loser' : ''}">${logo(a)}<div class="placeholder-team-name">${esc(a.n)}${aWin ? ' <span class="win-check" title="Winner">✓</span>' : ''}</div>${scorers(m, 'a')}</div>
      </div>
      ${venue ? `<div class="featured-venue">🏟 ${esc(venue)}</div>` : ''}
      <div class="slot-actions"><button type="button" id="heroToggle" aria-expanded="${S.heroOpen}">${S.heroOpen ? '▲ Hide match details' : '▼ Match details (Line-ups, H2H, Stats)'}</button><button type="button" id="copyLink">🔗 Copy match link</button>${ADMIN ? `<button type="button" id="heroAddVid">🎬 ${hasVideo(m.id) ? 'Edit video link' : 'Add video link'}</button>` : ''}${S.pick ? '<button type="button" id="resetMain">↺ Back to biggest match</button>' : ''}</div>`;
    $('mainHint').textContent = S.pick ? 'YOUR SELECTED MATCH' : S.hero ? 'SELECTED BY ADMIN' : 'AUTO · BIGGEST MATCH';
    if ($('resetMain')) $('resetMain').onclick = () => { S.pick = null; S.heroOpen = false; renderAll(); };
    $('heroToggle').onclick = () => { S.heroOpen = !S.heroOpen; renderHero(); };
    if ($('heroAddVid')) $('heroAddVid').onclick = () => { S.heroOpen = true; S.dtab = 'video'; renderHero(); };
    $('copyLink').onclick = () => { const u = `${location.origin}${location.pathname}?m=${encodeURIComponent(m.id)}`; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => { $('copyLink').textContent = '✓ Copied'; }).catch(() => prompt('Copy this link:', u)); };
    const hd = $('heroDetail');
    if (S.heroOpen) { if (!hd.firstChild || hd.dataset.id !== m.id) { hd.dataset.id = m.id; hd.innerHTML = mdShell(m, true); } else refreshDetails(m.id); } else { hd.innerHTML = ''; hd.dataset.id = ''; }
  }

  function renderSpot() {
    const m = spotMatch(), body = $('spotBody');
    if (!m) { $('spotLeague').textContent = ''; body.innerHTML = '<div class="empty-state">No other competition to highlight right now.</div>'; return; }
    $('spotLeague').textContent = lgInfo(m.lg).n.toUpperCase();
    const pre = m.s === 'pre' || m.s === 'pp';
    const lg = t => safeUrl(t.l) ? `<img class="mini-logo" style="width:46px;height:46px;margin-bottom:6px" src="${esc(safeUrl(t.l))}" alt="" loading="lazy">` : '<span class="vs-logo">⚽</span>';
    body.innerHTML = `<div class="vs-row" data-focus="${esc(m.id)}" title="Open this match in the list"><div class="vs-team">${lg(m.h)}${esc(m.h.n)}</div><div class="vs-center"><div class="vs">${pre ? 'VS' : `${m.h.g} – ${m.a.g}`}</div>${badge(m)}</div><div class="vs-team">${lg(m.a)}${esc(m.a.n)}</div></div><div class="kickoff">${esc(fmtDay(m.d))} · ${esc(fmtTime(m.d))}<small>Local time</small></div>`;
  }

  function renderSideTable() {
    const open = S.open && byId(S.open), m = open || heroMatch(), card = $('tableCard');
    if (!m) { card.hidden = true; return; }
    if (!LF.store.table.has(m.lg)) { LF.loadTable(m.lg).then(renderSideTable); card.hidden = true; return; }
    const rec = LF.store.table.get(m.lg);
    if (!rec.d || !rec.d.groups || !rec.d.groups.length || rec.d.groups.length > 4) { card.hidden = true; return; }
    const li = lgInfo(m.lg);
    $('tableCountry').textContent = li.c.toUpperCase(); $('tableName').textContent = li.n.toUpperCase();
    card.hidden = false;
    $('tableBody').innerHTML = tableHTML(m, 8);
  }

  /* ================= Ro'yxat: sana tasmasi, filtrlar, liga bloklari ================= */
  function dayList() {
    const p = LF.prefs(), now = new Date(), out = [];
    for (let i = -p.back; i <= p.ahead; i++) { const d = addDays(now, i); out.push({ key: dkey(d), top: i === -1 ? 'Yesterday' : i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'short' }), sub: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), today: i === 0 }); }
    return out;
  }
  const searchHit = m => (m.h.n + ' ' + m.h.f + ' ' + m.a.n + ' ' + m.a.f + ' ' + lgInfo(m.lg).n + ' ' + lgInfo(m.lg).c).toLowerCase().includes(S.q.toLowerCase());
  const inView = m => S.q.length >= 2 ? searchHit(m) : (S.tab === 'live' ? isLive(m) : dkey(m.d) === S.tab);
  const statusOK = m => S.status === 'all' || (S.status === 'live' && isLive(m)) || (S.status === 'fin' && m.s === 'post') || (S.status === 'up' && (m.s === 'pre' || m.s === 'pp')) || (S.status === 'fav' && favs.has(m.id));

  /* O'yin qatori: 2-skrinshotdagi kabi vaqt + FT aniq ajratilgan, g'olib jamoa yorqin, video bo'lsa yashil ▶ tugmasi */
  function rowHTML(m) {
    const pre = m.s === 'pre' || m.s === 'pp', fin = m.s === 'post', live = isLive(m), open = S.open === m.id;
    const koTime = esc(fmtTime(m.d));
    const dayPrefix = (S.q.length >= 2 || S.tab === 'live') && !live ? `<span class="lr-day">${esc(fmtDay(m.d))}</span>` : '';

    let statusCell = '';
    if (m.s === 'in') {
      statusCell = `<span class="lr-time">${koTime}</span><span class="st-badge is-live">● ${esc(m.c || 'LIVE')}</span>`;
    } else if (m.s === 'ht') {
      statusCell = `<span class="lr-time">${koTime}</span><span class="st-badge is-ht">HT</span>`;
    } else if (fin) {
      statusCell = `${dayPrefix}<span class="lr-time">${koTime}</span><span class="st-badge is-ft" title="Match Finished">✔ ${esc(m.sd || 'FT')}</span>`;
    } else if (m.s === 'pp') {
      statusCell = `${dayPrefix}<span class="lr-time">${koTime}</span><span class="st-badge is-pp">POSTP.</span>`;
    } else {
      statusCell = `${dayPrefix}<span class="lr-time is-ko">${koTime}</span><span class="st-badge is-up">SOON</span>`;
    }

    const hWin = fin && m.h.g > m.a.g, aWin = fin && m.a.g > m.h.g;
    const vOn = hasVideo(m.id);
    const favOn = favs.has(m.id);
    const sc = pre ? 'VS' : `${m.h.g} – ${m.a.g}`;

    return `<div class="lrow-wrap">
      <div class="lrow${open ? ' open' : ''}${fin ? ' is-fin' : ''}${live ? ' is-live-row' : ''}" data-id="${esc(m.id)}" role="button" tabindex="0" aria-expanded="${open}">
        <span class="lr-st">${statusCell}</span>
        <span class="lr-t home${hWin ? ' is-winner' : aWin ? ' is-loser' : ''}"><b>${esc(m.h.n)}</b>${crest(m.h, 'mini-logo')}</span>
        <span class="lr-sc${live ? ' live' : ''}${fin ? ' fin' : ''}">
          <span class="sc-nums">${sc}</span>
          ${fin ? '<small class="sc-sub">ENDED</small>' : live ? `<small class="sc-sub live-sub">${esc(m.s === 'ht' ? 'HT' : m.c || 'LIVE')}</small>` : ''}
        </span>
        <span class="lr-sh${hWin ? ' is-winner' : ''}">${pre ? '' : m.h.g}</span>
        <span class="lr-t away${aWin ? ' is-winner' : hWin ? ' is-loser' : ''}">${crest(m.a, 'mini-logo')}<b>${esc(m.a.n)}</b></span>
        <span class="lr-sa${aWin ? ' is-winner' : ''}">${pre ? '' : m.a.g}</span>
        <span class="lr-actions">
          ${vOn ? `<button type="button" class="vid-pill" data-open-vid="${esc(m.id)}" title="Watch match video">▶</button>` : ''}
          <button type="button" class="fav-btn${favOn ? ' on' : ''}" data-fav="${esc(m.id)}" title="Pin / Save match" aria-label="Favorite match">${favOn ? '★' : '☆'}</button>
          <span class="lr-ch">⌄</span>
        </span>
      </div>
      ${open ? mdShell(m) : ''}
    </div>`;
  }

  function renderStrip() {
    const all = LF.all(), days = dayList();
    if (!S.tab) S.tab = all.some(isLive) ? 'live' : days.find(d => d.today).key;
    const liveN = all.filter(isLive).length, cnt = k => all.filter(m => dkey(m.d) === k).length;
    const searching = S.q.length >= 2;
    $('dateStrip').innerHTML = `<button type="button" class="ds-btn live${S.tab === 'live' && !searching ? ' active' : ''}" data-tab="live">● LIVE<small>${liveN} now</small></button>` +
      days.map(d => `<button type="button" class="ds-btn${S.tab === d.key && !searching ? ' active' : ''}" data-tab="${d.key}" data-today="${d.today ? 1 : 0}">${esc(d.top)}<small>${esc(d.sub)} · ${cnt(d.key)}</small></button>`).join('');
    const base = all.filter(inView).filter(m => S.lg === 'all' || m.lg === S.lg);
    const c = f => base.filter(f).length;
    $('lsFilters').innerHTML = (S.tab === 'live' && !searching ? '' : `<div class="seg" role="group" aria-label="Status filter">${[
      ['all', 'All', base.length],
      ['live', 'Live', c(isLive)],
      ['fin', '✔ Finished', c(m => m.s === 'post')],
      ['up', 'Upcoming', c(m => m.s === 'pre' || m.s === 'pp')],
      ['fav', '★ Saved', c(m => favs.has(m.id))]
    ].map(([k, n, v]) => `<button type="button" data-st="${k}" class="${S.status === k ? 'active' : ''}">${n}<span class="cnt">${v}</span></button>`).join('')}</div>`) +
      (S.lg !== 'all' ? `<button type="button" class="pill-x" data-lg="all">${esc(lgInfo(S.lg).n)} ✕</button>` : '') + (searching ? '<button type="button" class="pill-x" id="clearQ">Search: “' + esc(S.q) + '” ✕</button>' : '');
  }

  function renderList() {
    renderStrip();
    const all = LF.all();
    let list = all.filter(inView).filter(m => S.lg === 'all' || m.lg === S.lg);
    if (!(S.tab === 'live' && S.q.length < 2)) list = list.filter(statusOK);
    $('matchCount').textContent = `${list.length} MATCH${list.length === 1 ? '' : 'ES'}`;
    if (!list.length) {
      $('matchList').innerHTML = `<div class="empty-state">${S.q.length >= 2 ? 'No matches found for your search.' : S.status === 'fav' ? 'No saved matches in this view yet. Tap ☆ on any match row to pin it here.' : S.tab === 'live' ? 'No live matches right now. Pick a day above to see fixtures.' : 'No matches for this selection.'}</div>`;
      return;
    }
    const groups = new Map();
    list.sort((a, b) => (favs.has(b.id) - favs.has(a.id)) || (isLive(b) - isLive(a)) || (T(a) - T(b))).forEach(m => {
      if (!groups.has(m.lg)) groups.set(m.lg, []);
      groups.get(m.lg).push(m);
    });
    let html = '';
    [...groups].sort((a, b) => lgInfo(b[0]).w - lgInfo(a[0]).w).forEach(([lg, ms]) => {
      const li = lgInfo(lg), key = S.tab + '|' + lg, folded = S.collapsed.has(lg), expanded = S.more.has(key) || ms.some(m => m.id === S.open);
      const shown = expanded ? ms : ms.slice(0, PAGE), liveN = ms.filter(isLive).length, finN = ms.filter(m => m.s === 'post').length;
      const lgHasVid = ms.some(m => hasVideo(m.id));
      html += `<section class="lg-block"><button type="button" class="lg-head" data-fold="${esc(lg)}" aria-expanded="${!folded}"><span>🏆</span><b>${esc(li.n)}</b><small>${esc(li.c)}</small>${lgHasVid ? '<span class="lg-vid-dot" title="Video highlights available">▶</span>' : ''}<span class="lg-n${liveN ? ' live' : ''}">${liveN ? '● ' + liveN + ' LIVE · ' : finN === ms.length ? '✔ ALL FT · ' : ''}${ms.length}</span><span class="lg-c">${folded ? '▸' : '▾'}</span></button>`;
      if (!folded) { html += shown.map(rowHTML).join(''); if (ms.length > PAGE && !expanded) html += `<button type="button" class="more-btn" data-more="${esc(key)}">Show ${ms.length - PAGE} more</button>`; }
      html += '</section>';
    });
    $('matchList').innerHTML = html;
  }

  function renderComp() {
    const base = LF.all().filter(inView), counts = {};
    base.forEach(m => counts[m.lg] = (counts[m.lg] || 0) + 1);
    const ids = Object.keys(counts).sort((a, b) => lgInfo(b).w - lgInfo(a).w);
    $('compList').innerHTML = (S.lg !== 'all' ? '<button type="button" data-lg="all">Show all competitions<small>✕</small></button>' : '') + (ids.map(id => `<button type="button" data-lg="${esc(id)}"${S.lg === id ? ' style="border-color:var(--green)"' : ''}>${esc(lgInfo(id).n)}<small>${counts[id]}</small></button>`).join('') || '<div class="empty-state">No competitions in this view.</div>');
  }
  function renderFresh() {
    const st = LF.store, t = st.gen ? new Date(st.gen).toLocaleTimeString() : '';
    $('dataFreshness').textContent = t ? `Updated ${t} · refreshes automatically` : 'Connecting to live match data…';
  }
  function renderAll() { renderHero(); renderSpot(); renderList(); renderSideTable(); renderComp(); renderFresh(); }

  /* ================= Hodisalar ================= */
  function focusMatch(id) {
    const m = byId(id); if (!m) return;
    S.q = ''; $('siteSearch').value = ''; S.lg = 'all'; S.status = 'all'; S.tab = isLive(m) ? 'live' : dkey(m.d); S.open = id;
    renderAll();
    const el = document.querySelector(`.lrow[data-id="${CSS.escape(id)}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  document.addEventListener('click', async e => {
    if (e.target.closest('#admDrawer, #admBtn')) return;

    /* 1. Sevimlilarga qo'shish (☆ / ★) */
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      e.stopPropagation();
      toggleFav(favBtn.dataset.fav);
      renderList();
      return;
    }

    /* 2. Qatordagi yashil ▶ video tugmasi */
    const vidBtn = e.target.closest('[data-open-vid]');
    if (vidBtn) {
      e.stopPropagation();
      const id = vidBtn.dataset.openVid;
      S.open = id;
      S.dtab = 'video';
      renderList();
      renderSideTable();
      return;
    }

    /* 3. Hero'dagi Watch Highlights tugmasi */
    const heroVid = e.target.closest('[data-hero-vid]');
    if (heroVid) {
      S.heroOpen = true;
      S.dtab = 'video';
      renderHero();
      return;
    }

    /* 4. Admin: Video tab ichidan YouTube havolani saqlash / o'chirish */
    const vidSave = e.target.closest('[data-vid-save]');
    if (vidSave) {
      const id = vidSave.dataset.vidSave;
      const inp = document.querySelector(`input[data-vid-input="${CSS.escape(id)}"]`);
      const msgEl = document.querySelector(`[data-vid-msg="${CSS.escape(id)}"]`);
      const url = inp ? inp.value.trim() : '';
      if (url && !ytId(url)) {
        if (msgEl) msgEl.textContent = '❌ Please enter a valid YouTube link (https://youtu.be/... or youtube.com/watch?v=...).';
        return;
      }
      if (msgEl) msgEl.textContent = 'Saving video…';
      try {
        const res = await LF.saveVideo(id, url);
        renderAll();
        const mAfter = document.querySelector(`[data-vid-msg="${CSS.escape(id)}"]`);
        if (mAfter) mAfter.textContent = res.localOnly ? '✅ Saved in this browser! (Enter Admin Token in Control -> Setup to publish for all visitors).' : '✅ Video published for all visitors!';
      } catch (err) {
        if (msgEl) msgEl.textContent = '✅ Saved locally · Worker note: ' + err.message;
        renderAll();
      }
      return;
    }
    const vidDel = e.target.closest('[data-vid-del]');
    if (vidDel) {
      const id = vidDel.dataset.vidDel;
      try { await LF.saveVideo(id, ''); } catch (_) {}
      renderAll();
      return;
    }

    const t = e.target.closest('[data-id],[data-tab],[data-lg],[data-more],[data-dt],[data-st],[data-fold],[data-focus],[data-ds],[data-pick],#clearQ');
    if (!t) return;
    if (t.id === 'clearQ') { S.q = ''; $('siteSearch').value = ''; renderAll(); return; }
    if (t.dataset.pick) { S.pick = t.dataset.pick; S.heroOpen = false; S.open = t.dataset.pick; renderAll(); $('mainScoreboard').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (t.dataset.dt) { S.dtab = t.dataset.dt; const w = t.closest('.mdetail'); refreshDetails(w.dataset.for); return; }
    if (t.dataset.id) { S.open = S.open === t.dataset.id ? null : t.dataset.id; const m = byId(S.open); renderList(); renderSideTable(); if (m && isLive(m)) LF.loadDetail(m, true).then(() => refreshDetails(m.id)); return; }
    if (t.dataset.tab) { S.tab = t.dataset.tab; S.q = ''; $('siteSearch').value = ''; S.status = 'all'; S.open = null; renderAll(); return; }
    if (t.dataset.st) { S.status = t.dataset.st; renderList(); return; }
    if (t.dataset.fold) { const k = t.dataset.fold; S.collapsed.has(k) ? S.collapsed.delete(k) : S.collapsed.add(k); renderList(); return; }
    if (t.dataset.more) { S.more.add(t.dataset.more); renderList(); return; }
    if (t.dataset.focus) { focusMatch(t.dataset.focus); return; }
    if (t.dataset.ds) { $('dateStrip').scrollBy({ left: 240 * Number(t.dataset.ds), behavior: 'smooth' }); return; }
    if (t.dataset.lg) { S.lg = t.dataset.lg; renderList(); renderComp(); if (S.lg !== 'all') $('fixtures').scrollIntoView({ behavior: 'smooth' }); }
  });

  $('openTableBtn').addEventListener('click', () => { S.heroOpen = true; S.dtab = 'table'; renderHero(); $('mainScoreboard').scrollIntoView({ behavior: 'smooth' }); });

  /* Qidiruv */
  const sIn = $('siteSearch'), sTog = $('searchToggle'), sClr = $('searchClear');
  function toggleSearch(force) {
    const open = typeof force === 'boolean' ? force : sIn.hidden;
    sIn.hidden = !open; sClr.hidden = !open;
    sTog.setAttribute('aria-expanded', String(open));
    if (open) sIn.focus(); else { S.q = ''; sIn.value = ''; renderList(); renderComp(); }
  }
  sTog.addEventListener('click', () => toggleSearch());
  sClr.addEventListener('click', () => { S.q = ''; sIn.value = ''; renderList(); renderComp(); sIn.focus(); });
  sIn.addEventListener('input', () => { S.q = sIn.value.trim(); S.lg = 'all'; S.status = 'all'; renderList(); renderComp(); });
  sIn.addEventListener('keydown', e => { if (e.key === 'Escape') toggleSearch(false); });

  const vl = $('videoHighlightsLink');
  if (CFG.youtubeChannelUrl) { vl.href = CFG.youtubeChannelUrl; vl.target = '_blank'; vl.rel = 'noopener noreferrer'; }

  /* ================= Yuklash va yangilash ================= */
  const progress = () => renderAll();
  async function start() {
    try {
      await LF.loadWindow(progress);
      const want = Q.get('m');
      if (want && validId(want) && LF.get(want) && !STREAM) focusMatch(want);
    } catch (err) {
      const why = esc(LF.store.err || String(err && err.message || err));
      $('dataFreshness').textContent = 'Live data is temporarily unavailable. Retrying…';
      $('featuredMatch').innerHTML = `<div class="empty-state featured-empty"><strong>Live data is temporarily unavailable</strong><span>We are retrying automatically.${ADMIN ? ' · ' + why : ''}</span></div>`;
      $('matchList').innerHTML = '<div class="empty-state">Could not load matches. Please try again in a moment.</div>';
    }
    renderAll();
    schedule();
  }
  let timer;
  function schedule() {
    clearTimeout(timer);
    const soon = LF.all().some(m => isLive(m) || (m.s === 'pre' && T(m) - Date.now() < HOUR));
    timer = setTimeout(tick, soon ? 35e3 : 120e3);
  }
  async function tick() {
    if (document.visibilityState === 'visible') {
      try {
        if (LF.all().length) await LF.pollLive(); else await LF.loadWindow(progress);
        renderHero(); renderSpot(); renderList(); renderFresh(); renderComp();
        const ids = new Set([S.open, S.heroOpen && heroMatch() && heroMatch().id].filter(Boolean));
        for (const id of ids) { const m = byId(id); if (m && isLive(m)) { await LF.loadDetail(m, true); S.notes.delete(id); refreshDetails(id); } }
      } catch (_) {}
    }
    schedule();
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { clearTimeout(timer); tick(); } });

  /* Admin paneli bilan aloqa (faqat ?admin=1 ochilgan brauzerda yuklanadi) */
  window.LF_APP = {
    hero: () => heroMatch(), focus: id => focusMatch(id), refresh: () => renderAll(),
    setHero: id => { S.hero = id || null; try { id ? localStorage.setItem('lf_hero', id) : localStorage.removeItem('lf_hero'); } catch (_) {} renderAll(); },
    reload: async () => { try { await LF.reset(progress); } catch (_) {} renderAll(); },
    refreshNotes: id => { S.notes.delete(id); refreshDetails(id); }
  };
  if (ADMIN && !STREAM) { const sc = document.createElement('script'); sc.src = 'admin.js'; document.body.appendChild(sc); }

  /* ================= Cookie va rozilik (roziliksiz hech qayerga ma'lumot uzatilmaydi) ================= */
  const consentKey = 'liveFootball.cookieConsent.v1';
  function startOptionalTools(choice) {
    const cfg = window.LIVE_FOOTBALL_CONFIG || {};
    if (choice.analytics && /^G-[A-Z0-9]+$/i.test(cfg.gaMeasurementId || '')) {
      if (!document.querySelector('script[data-ga-loaded]')) {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: choice.ads ? 'granted' : 'denied', ad_user_data: choice.ads ? 'granted' : 'denied', ad_personalization: choice.ads ? 'granted' : 'denied', wait_for_update: 500 });
        const g = document.createElement('script');
        g.async = true;
        g.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cfg.gaMeasurementId)}`;
        g.dataset.gaLoaded = 'true';
        document.head.appendChild(g);
        window.gtag('js', new Date());
        window.gtag('config', cfg.gaMeasurementId, { anonymize_ip: true });
      }
    }
    if (choice.ads && /^ca-pub-\d+$/.test(cfg.adsensePublisherId || '') && cfg.adsensePublisherId !== 'ca-pub-0000000000000000') {
      if (!document.querySelector('script[data-adsense-loaded]')) {
        const a = document.createElement('script');
        a.async = true; a.crossOrigin = 'anonymous';
        a.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(cfg.adsensePublisherId)}`;
        a.dataset.adsenseLoaded = 'true';
        document.head.appendChild(a);
      }
      const slots = Array.isArray(cfg.adsenseSlots) ? cfg.adsenseSlots : [];
      document.querySelectorAll('main .ad').forEach((ad, index) => {
        const slot = String(slots[index] || '');
        if (!/^\d+$/.test(slot) || ad.querySelector('.adsbygoogle')) return;
        const ins = document.createElement('ins');
        ins.className = 'adsbygoogle'; ins.style.display = 'block'; ins.style.minWidth = '250px'; ins.style.width = '100%'; ins.style.minHeight = '90px';
        ins.dataset.adClient = cfg.adsensePublisherId; ins.dataset.adSlot = slot; ins.dataset.adFormat = 'auto'; ins.dataset.fullWidthResponsive = 'true';
        const content = ad.querySelector('div');
        if (content) content.replaceChildren(ins); else ad.appendChild(ins);
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_) {}
      });
    }
  }
  function saveConsent(choice) {
    try { localStorage.setItem(consentKey, JSON.stringify({ ...choice, savedAt: new Date().toISOString() })); } catch (_) {}
    if (typeof window.gtag === 'function') window.gtag('consent', 'update', { analytics_storage: choice.analytics ? 'granted' : 'denied', ad_storage: choice.ads ? 'granted' : 'denied', ad_user_data: choice.ads ? 'granted' : 'denied', ad_personalization: choice.ads ? 'granted' : 'denied' });
    $('cookieBanner') && $('cookieBanner').remove();
    $('cookieSettingsPanel') && $('cookieSettingsPanel').remove();
    startOptionalTools(choice);
  }
  function openCookieSettings() {
    $('cookieSettingsPanel') && $('cookieSettingsPanel').remove();
    const panel = document.createElement('div');
    panel.id = 'cookieSettingsPanel'; panel.className = 'cookie-settings-panel';
    panel.innerHTML = '<div class="cookie-settings-card" role="dialog" aria-modal="true" aria-labelledby="cookieSettingsTitle"><h3 id="cookieSettingsTitle">Privacy & Cookie Settings</h3><p>Necessary storage keeps the site’s basic features working. Optional analytics and advertising are off unless you choose to enable them.</p><label><input type="checkbox" checked disabled> Necessary storage (always active)</label><label><input id="consentAnalytics" type="checkbox"> Analytics cookies (Google Analytics)</label><label><input id="consentAds" type="checkbox"> Advertising cookies (Google AdSense)</label><button id="saveCookieSettings">Save choices</button><button id="cancelCookieSettings">Cancel</button></div>';
    document.body.appendChild(panel);
    let existing = {};
    try { existing = JSON.parse(localStorage.getItem(consentKey) || '{}'); } catch (_) {}
    panel.querySelector('#consentAnalytics').checked = Boolean(existing.analytics);
    panel.querySelector('#consentAds').checked = Boolean(existing.ads);
    panel.querySelector('#saveCookieSettings').onclick = () => saveConsent({ analytics: panel.querySelector('#consentAnalytics').checked, ads: panel.querySelector('#consentAds').checked });
    panel.querySelector('#cancelCookieSettings').onclick = () => panel.remove();
    panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
  }
  function showCookieBanner() {
    if (STREAM) return;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(consentKey) || 'null'); } catch (_) {}
    if (saved && typeof saved === 'object') { startOptionalTools(saved); return; }
    const banner = document.createElement('section');
    banner.id = 'cookieBanner'; banner.className = 'cookie-banner';
    banner.innerHTML = '<strong>Privacy & Cookie Choices</strong><p>We use necessary storage to operate this website. With your permission, optional analytics can help us understand visits and advertising tools may display relevant ads. You can change your choice at any time in the footer. Read our <a href="about.html">About &amp; Privacy information</a>.</p><div class="cookie-actions"><button class="accept" id="acceptAllCookies">Accept all</button><button id="rejectOptionalCookies">Reject optional</button><button id="customizeCookies">Settings</button></div>';
    document.body.appendChild(banner);
    banner.querySelector('#acceptAllCookies').onclick = () => saveConsent({ analytics: true, ads: true });
    banner.querySelector('#rejectOptionalCookies').onclick = () => saveConsent({ analytics: false, ads: false });
    banner.querySelector('#customizeCookies').onclick = openCookieSettings;
  }
  $('privacySettingsLink').addEventListener('click', e => { e.preventDefault(); openCookieSettings(); });
  showCookieBanner();

  start();
})();
