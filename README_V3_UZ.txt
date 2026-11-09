LIVE FOOTBALL — V3 (ESPN + Cloudflare Worker, GitHub Pages)

1) CLOUDFLARE WORKER (avval shuni qiling)
   a. Cloudflare -> Workers & Pages -> live-football-api -> Edit code -> worker.js ichidagini TO'LIQ almashtiring -> Deploy.
   b. Settings -> Variables and Secrets:
        ALLOWED_ORIGIN = https://avtojon.github.io          (bir nechta bo'lsa vergul bilan)
        ADMIN_TOKEN    = <kamida 24 belgili tasodifiy matn>  (Secret sifatida; hech kimga ko'rsatmang)
   c. Sharhlar uchun KV: Storage & Databases -> KV -> Create namespace (masalan "notes"),
      so'ng Worker -> Settings -> Bindings -> Add -> KV namespace -> Variable name: NOTES.
      (Eski MATCH_CACHE binding ham ishlaydi.)
   d. API_FOOTBALL_KEY endi KERAK EMAS — o'chirib tashlang.
   e. Tekshirish: https://<worker-manzil>/api/health  -> "lastStatus" da har liga uchun ok/error ko'rinadi.
      "HTTP 400/404" = ESPN bunday liga kodini tanimaydi (boshqa ligalar ishlayveradi). Admin panel -> Data da o'chirib qo'ying.

2) GITHUB (repository ildiziga yuklang, eskilarini almashtiring)
   index.html, style.css, app.js, lf-core.js, admin.js, app-config.js, videos.json, about.html, robots.txt, sitemap.xml
   (worker.js GitHub'ga kerak emas — u Cloudflare'da ishlaydi; nusxasini saqlab qo'ysangiz bo'ladi)
   Commit -> Ctrl+F5.

3) ADMIN PANEL
   Saytni bir marta  .../live-football-score/?admin=1  bilan oching -> pastki o'ngda "CONTROL" tugmasi paydo bo'ladi.
   Setup tabi: ADMIN_TOKEN ni kiriting (faqat shu brauzerda saqlanadi) -> "Save & test".
   Commentary tabi: o'yinni tanlang, o'zbekcha yozing -> inglizcha chiqadi; tezkor xabarlar (🧱 Devor ham bor) bir bosishda chiqadi.
   Hamma tashrifchi o'yin tafsilotlaridagi "Commentary" tabida shu sharhlarni ko'radi.
   Chiqish: Setup -> "Disable admin mode"  yoki  ?admin=0

4) KUNLAR VA VIDEO ARXIVI
   Standart: kechadan +6 kun gacha. Admin -> Data -> "Video archive (5 back + 8 ahead)" -> Save & reload  => 14 kunlik oyna.
   Videoni o'yinga bog'lash: videos.json ga  "esp.1:12345": "https://youtu.be/XXXXXXXXXXX"  qo'shing
   (o'yin ID si "Copy match link" tugmasi bergan havoladagi ?m= dan keyingi qism).
   Faqat o'zingizga tegishli yoki ruxsat berilgan videolarni qo'ying.

5) STREAM REJIMI  (index.html?stream=1&m=<ID>)
   Video, reklama va cookie banneri YO'Q; asosiy panel ?m= dagi o'yin bo'ladi. OBS'ga ulashda shu rejimdan foydalaning.
   Match videosi bor sahifani OBS'ga HECH QACHON ulamang (YouTube strike xavfi).

6) XAVFSIZLIK
   - Maxfiy kalit repoda yo'q. ADMIN_TOKEN faqat Worker'da; yozish/o'chirish faqat token bilan.
   - Worker: faqat GET/POST, parametrlar qat'iy tekshiriladi, CORS faqat ALLOWED_ORIGIN, noto'g'ri tokenda 0.5 s kechikish.
   - Sayt: CSP, barcha matn eskeyp qilinadi, logotiplar faqat https, YouTube faqat youtube-nocookie.
   - ?admin=1 faqat tugmani ko'rsatadi, himoya emas. Himoya = ADMIN_TOKEN.
   - AdSense yoqilganda CSP ni kengaytirish kerak bo'lishi mumkin (index.html dagi meta Content-Security-Policy).

7) CHEKLOVLAR
   - ESPN ochiq API rasmiy emas, kafolat yo'q. Reklamali/tijoriy saytga o'tishdan oldin litsenziyali manbaga (masalan API-Football pullik) o'tish tavsiya etiladi:
     faqat worker.js dagi normMatch/parseSummary/parseTable o'zgaradi.
   - Cloudflare bepul tarif: kuniga 100 000 so'rov, KV yozuvi kuniga 1000, bir chaqiruvda 50 ichki so'rov, 10 ms CPU.
     "Error 1102" chiqsa, ligalar sonini kamaytiring yoki pullik tarifga o'ting.
   - Ovozli sharh, yangilik kartalari va OBS overlay hozircha faqat kompyuterdagi Python versiyada.
