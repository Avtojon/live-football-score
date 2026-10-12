LIVE FOOTBALL — WEBSITE UPDATE V1.5

GITHUB PAGES GA YUKLANADIGAN FAYLLAR
Quyidagi fayllarni GitHub repository ildiz papkasiga yuklang va mavjud fayllarni almashtiring:
- index.html
- app-config.js
- about.html
- robots.txt
- sitemap.xml

MUHIM: Cloudflare Worker bu versiyada o'zgartirilmadi. worker.js faylini qayta joylash yoki API kalitlarini o'zgartirish kerak emas.

V1.5 O'ZGARISHLARI
- Gol muallifi va daqiqasi faqat API haqiqiy hodisa qaytarganda ko'rsatiladi. "No goals", "Goal events unavailable" va "Loading goal events" kabi ortiqcha yozuvlar olib tashlandi.
- Video Highlights bloki YouTube uslubidagi qizil play belgisi bilan yangilandi.
- Sahifa sarlavhasi "Football Scores & Fixtures" bo'ldi va ixchamlashtirildi.
- Qidiruv API allaqachon yuklagan barcha uchrashuvlardan (kecha, bugun, ertaga UTC ma'lumot oynasi) izlaydi; joriy tab va bugungi sana bilan cheklanmaydi. Qidiruv qo'shimcha API so'rovi yubormaydi.
- Asosiy scoreboard tanlovi: nufuzli jonli o'yin, keyin nufuzli kelayotgan o'yin, keyin oxirgi 24 soatdagi nufuzli yakunlangan o'yin. Eski natijani kunlab bosh panelda qoldirmaslik uchun undan keyin bo'sh, toza holat ko'rsatiladi.
- Sahifa ko'rinib turganda har 5 daqiqada ma'lumot yangilanishi tekshiriladi. Worker'ning umumiy 20 daqiqalik kesh siyosati o'zgartirilmaydi; bu har besh daqiqada tashqi API chaqiriladi degani emas.
- Ma'lumot snapshot vaqti yuqori qismda ko'rsatiladi. U Worker/API bergan generatedAt qiymatiga asoslanadi.
- SEO uchun title, meta description, canonical, Open Graph, Twitter meta, robots.txt va sitemap.xml qo'shildi.
- GA4 ulash joyi app-config.js ichida tayyor. Analytics faqat foydalanuvchi rozilik berganida va to'g'ri Measurement ID kiritilganda ishga tushadi.
- YouTube kanal havolasi app-config.js ichida sozlanadi.

GA4 ID QO'SHISH
1. Google Analytics'da sayt uchun GA4 Web data stream yarating.
2. G-XXXXXXXXXX formatidagi Measurement ID ni oling.
3. app-config.js faylida gaMeasurementId: "" qatoridagi qo'shtirnoqlar ichiga ID ni yozing.
Misol: gaMeasurementId: "G-ABC1234567",
Bu faqat namuna; o'z ID'ingizdan foydalaning.
4. GitHub'ga app-config.js ni saqlang.
5. Saytda Cookie Settings orqali Analytics cookies roziligini bering va GA4 Realtime hisobotida tekshiring.

YOUTUBE HAVOLASI QO'SHISH
app-config.js ichida youtubeChannelUrl: "" qatoridagi qo'shtirnoqlar ichiga ommaviy kanal havolasini yozing.
Masalan, format: https://www.youtube.com/@YourChannel

DEPLOY QADAMLARI
1. ZIP faylni kompyuteringizga yuklab oling va oching.
2. Yuqoridagi beshta faylni GitHub repository ildiziga yuklang.
3. index.html va app-config.js uchun mavjud fayllarni almashtiring.
4. Commit changes qiling.
5. Saytni Ctrl+F5 bilan yangilang.
6. Search, asosiy scoreboard, YouTube bloki va robots.txt/sitemap.xml ni tekshiring.

CHEKLOVLAR
- Qidiruv faqat Worker orqali hozir yuklangan uch kunlik ma'lumot oynasini qidiradi; tarixiy arxiv qidiruvi yo'q.
- Gol tafsilotlari faqat API qaytarganida ko'rsatiladi. Hech qanday gol ma'lumoti uydirilmaydi.
- API/Worker keshining amaldagi muddati 20 daqiqa bo'lib qoladi.
- SEO metama'lumotlari indekslanishga yordam beradi, ammo Google'da yuqori o'rinni kafolatlamaydi.
