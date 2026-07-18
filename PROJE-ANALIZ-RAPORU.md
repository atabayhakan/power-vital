# PowerVital Web Platformu — Derinlemesine Teknik Analiz Raporu

**Rapor tarihi:** 18 Temmuz 2026
**Kapsam:** `D:\PowerVitalWebProject` — backend, frontend, DevOps, dokümantasyon, git geçmişi
**Yöntem:** Kaynak kodun tamamı üzerinde statik analiz (üç paralel keşif ajanı: backend / frontend / DevOps)

---

## 1. Yönetici Özeti

PowerVital, Kırgızistan pazarına yönelik (`powervital.kg`) **üç modlu bir ticaret platformudur**: perakende e-ticaret vitrini + POS (kasiyer) terminali + MLM (çok katmanlı pazarlama) distribütör ağı. Tek kod tabanında hem müşteri mağazası, hem yönetim paneli, hem CMS (sayfa oluşturucu), hem de MLM bonus motoru barındırır.

**Genel hüküm:** Uygulama kodu olgun, güvenlik bilinci yüksek ve test disiplini güçlü; buna karşılık dağıtım (deploy) ve sır (secret) yönetimi tek operatörlü, dizüstü-bilgisayar-merkezli bir düzende yürüyor ve asıl risk burada yoğunlaşıyor. Özetle: **"profesyonel uygulama, amatör DevOps"** — ancak 12 Temmuz'daki commit dalgası, belgelenen CI/CD disiplinine geçişin başladığını gösteriyor.

| Boyut | Değerlendirme |
|---|---|
| Uygulama mimarisi | Güçlü (Express 5 + Prisma, katmanlı, zod doğrulamalı) |
| Güvenlik (uygulama içi) | Güçlü (JWT rotasyonu + replay tespiti, CSP/HSTS, uç nokta başına rate limit) |
| Güvenlik (operasyonel) | **Zayıf — kritik** (repo kökünde düz metin parolalar, tek parola her yerde) |
| Test kapsamı | İyi (backend 579 test, frontend 38 test dosyası) |
| Dağıtım olgunluğu | **Zayıf** (gerçek deploy = laptop'tan root SSH "hot deploy") |
| Dokümantasyon | Kapsamlı ama gerçeklikle yer yer uyumsuz |
| Sürdürülebilirlik | Riskli (tek geliştirici, bus factor = 1) |

---

## 2. Proje Kimliği ve Alan Adı Modeli

- **İş:** Power Vital LLC (Kırgızistan) — sağlık/takviye ürünleri e-ticareti + MLM ağı.
- **Etki alanları:** `powervital.kg` (birincil), `powervital.org`, `admin.powervital.kg`, www varyantları; önünde **Cloudflare CDN**.
- **Barındırma:** **Hostinger VPS** (IP `193.160.119.100`, SSH port `65002`, kullanıcı `u928946246`, root erişimi), nginx + PM2, Let's Encrypt TLS, HSTS preload.
- **Ödeme:** Yerel yöntemler — MBank, O!Money, MegaPay, Kaspi; makbuz OCR ile ödeme doğrulaması (tesseract.js, `rus+kir+eng` traineddata).
- **Para birimi / diller:** KGS/USD; arayüz dilleri **kg (varsayılan) / ru / tr** — her biri 1.017 anahtarlık tam parite + yönetim panelinden çalışma-zamanı UI-string geçersiz kılmaları.
- **Miras:** Kod tabanı Türkçe kökenli (route başlıkları, yorumlar, hata mesajları Türkçe kalıntılar taşıyor); pazar dili Kırgızca/Rusça. Bu, i18n tutarlılığı açısından izlenmesi gereken bir nokta.

**Veri modeli (26 Prisma modeli):** User (MLM sponsor/placement/leg ağacı), WithdrawalRequest, Product, PriceRule, Order, OrderItem, Transaction, SystemConfig, WeeklyCycle, UserWeeklyStats, HeroSlide, Category, ProductImage, SiteSettings, MediaFolder, Media, Page, ProductReview, StoreReview, RefreshToken, PushSubscription, CartAbandonment, BroadcastLog, BroadcastJob, ImpersonationSession, ClientError.

---

## 3. Mimari Genel Bakış

```
Tarayıcı (Vue 3 SPA)
   │  HTTPS (Cloudflare → nginx, TLS 1.2/1.3, HSTS preload)
   ▼
nginx vhost (powervital.kg)
   ├─ /api/      → 127.0.0.1:3000  (PM2, Express 5)
   ├─ /uploads/  → disk (30 gün cache)
   └─ /          → frontend/dist (SPA fallback, hashed /assets 1y immutable)

Backend (Node + Express 5 + TypeScript, tek PM2 süreci)
   ├─ 33 router / 134 endpoint  (zod validate → OpenAPI 3.1)
   ├─ Prisma 5 → MySQL 8  (26 model, FULLTEXT ngram arama)
   ├─ Redis (opsiyonel; yoksa bellek içi Map'e düşer) + BullMQ kuyrukları
   ├─ SSE olay veriyolu (admin canlı bildirimler), presence, in-proc metrikler
   └─ Web Push (VAPID) + nodemailer (smtp.hostinger.com)
```

**Önemli mimari karar:** SSE olay veriyolu, presence haritası ve metrikler süreç-içi bellekte tutuluyor. Tek PM2 süreci için bilinçli ve doğru bir tercih; ancak yatay ölçeklenme gerekirse Redis pub/sub'a taşınması şart.

---

## 4. Backend Derin Analizi (`backend/`)

### 4.1 Yığın
- **Express 5.2.1** (dikkat: 4.x değil, yeni ana sürüm) + **TypeScript 6.0.3 strict**; geliştirme `tsx watch`, üretim `tsc → dist/`.
- **Prisma 5** (MySQL provider), **BullMQ 5 + ioredis**, **zod 4 + zod-to-openapi** (doğrulama şemaları aynı zamanda OpenAPI kaynağı), **pino** yapısal loglama.
- Auth: `jsonwebtoken` + `bcryptjs` + cookie-parser; güvenlik: `helmet`, `cors`, `express-rate-limit`, `compression`.
- Özel: `tesseract.js` (OCR), `sharp` (görsel optimizasyonu), `multer` (upload), `web-push`, `nodemailer`, `@google/genai` (Gemini çeviri — **bilinçli olarak devre dışı**; çeviriler artık admin tarafından manuel yönetiliyor).

### 4.2 Yapı
- Giriş: `src/index.ts` (296 satır) — ~14 global middleware belgelenmiş sırada; **35 route mount** (33 router dosyası, 134 endpoint tanımı; `pushRoutes` ve `errorsRoutes` reklam engelleyicilere takılmamak için çifter mount edilmiş).
- Katmanlar: `routes/` (33), `services/` (14), `validators/` (548 satırlık ortak zod kütüphanesi), `utils/` (15 yardımcı), `queues/` + `workers/`, `i18n/` (652 satırlık TranslationCenter), `openapi/` (1.616 satırlık spec — en büyük kaynak dosya).
- **Eksik:** Global hata middleware'i ve 404 handler yok — her route kendi try/catch'ini taşıyor (route'larda 147 `try` bloğu). Hata zarfı tutarlılığı rota disiplinine bağlı.

### 4.3 Kimlik Doğrulama ve Yetkilendirme — projedeki en güçlü halka
- **JWT çift katman:** 15 dk access token (Bearer) + 7 gün refresh token (HttpOnly cookie).
- **Refresh token rotasyonu + aile (family) kavramı + replay tespiti:** çalınan token tekrar kullanılırsa tüm aile iptal ediliyor; DB'de yalnızca SHA-256 hash saklanıyor (`services/tokenService.ts`).
- Token-türü karıştırma koruması; 6 rol (`guest, customer, cashier, dealer, distributor, admin`); **75 admin-only guard noktası**.
- **Admin impersonation sistemi:** ayrı oturum tablosu, `realAdmin` ile denetim izi, yetki yükseltme koruması.

### 4.4 Rate limiting ve doğrulama
- Uç nokta başına isim-alanlı kovalar: login 5/15dk, register 3/sa, AI çeviri 20/dk, OCR 10/dk, yorum 3/sa, arama 60/dk, genel `/api` 300/dk. IPv6-güvenli anahtarlar, health-check muafiyeti.
- Tüm giriş/çıkışlar zod ile; CI'da `openapi-drift.yml` spec sapmasını yakalıyor.

### 4.5 Veri katmanı
- MySQL (SQLite'tan göç edilmiş; `prisma/dev.db` kalıntısı duruyor). 1 Prisma migration + **11 elle yazılmış SQL dosyası** (562 satır) — aralarında TR/RU/KG için idempotent **FULLTEXT ngram indeksi** var.
- Arama: `MATCH...AGAINST` doğal dil + relevans skoru + `<mark>` snippet; ≤2 karakterde LIKE'a düşüyor.
- Çift sayfalama stratejisi: offset zarfı `{items,total,page,limit,hasMore}` + yüksek hacimli uçlarda **cursor pagination** (base64url).
- Redis yoksa **zarif degradasyon** (bellek içi Map); cache-aside + `X-Cache` gözlemlenebilirliği; soft-delete (`deletedAt`).

### 4.6 Öne çıkan özellikler
- **MLM motoru:** BullMQ bonus kuyruğu + worker, sponsor bonusları, **%30 global payout güvenlik kilidi**, `isMlmEnabled` kill-switch, haftalık döngüler.
- **SSE** (`/admin/events`): `new_order, payment_received, ocr_pending, withdrawal_*, review_pending, low_stock` olayları; socket.io bilinçli olarak kullanılmıyor.
- **Canlı presence:** 90 sn TTL'li heartbeat — "bu ürünü şu an N kişi inceliyor".
- **Analitik:** ham-SQL `$queryRaw` agregasyonları (kategori cirosu, top müşteri/ürün, trendler, metrikler, loglar, admin arama).
- **Toplu işlemler:** 4 CSV export + 3 transaction'lı toplu yazma (≤500 ID, denetim olaylı).
- **Web Push + yayın zamanlayıcı + sepet-terk kurtarma analitiği + OCR makbuz doğrulama.**

### 4.7 Test
- **51 test dosyası / 579 test vakası / ~7.825 satır** (Vitest 4 + supertest, seri çalıştırma, paylaşılan MySQL).
- Kapsam: auth, checkout, OCR (mock'lu), impersonation, rate limit, güvenlik başlıkları, arama, sayfalama, cache, yedek/geri-yükleme, migration, OpenAPI sözleşmesi, broadcast zamanlayıcı, metrikler, i18n kenar durumları.
- Kökteki 13 `test-*.cjs`, canlı `https://powervital.kg`'ye karşı **üretim duman testleri**.

### 4.8 Sayısal özet (backend)
| Metrik | Değer |
|---|---|
| Kaynak (`src/`) | 75 TS dosyası / **15.404 satır** |
| Test | 49 dosya / 7.825 satır / 579 vaka |
| Endpoint | 134 tanım, 33 router, 35 mount |
| OpenAPI path | 95 (154 KB spec) |
| TODO/FIXME | **0** |
| Admin guard | 75 nokta |

---

## 5. Frontend Derin Analizi (`frontend/`)

### 5.1 Yığın
- **Vue 3.5** (Composition API, `<script setup>`) + TypeScript strict; **Vite 8**; **Pinia 3** (4 store); vue-router 5; vue-i18n 9; axios; `@sentry/vue` (lazy, fail-open).
- **Stil:** Tailwind yok — elle yazılmış tasarım sistemi ("Tactile Minimalism 2.0"): 1.329 satırlık `style.css` + `admin-light.css`, CSS custom properties, Inter/Montserrat/Outfit (Kiril fallback'li).

### 5.2 Rota envanteri (~31 rota, 41 view)
- **Vitrin:** `/` (ana sayfa), `/katalog`, `/product/:id`, `/p/:slug` (CMS dinamik sayfa), `/checkout`, `/login`, `/register`, `/iletisim`, `/about`; gizlenmiş admin kapısı **`/pv-hq-admin`**.
- **Hesap/Paneller:** `/account`, `/account/wallet`, `/account/support`, `/admin`, `/dashboard` (distribütör).
- **Operasyon:** `/orders`, `/products`, `/categories`, `/pos` (kasiyer karantina korumalı).
- **MLM:** `/network`, `/bonus-control`, `/simulation` — rol koruması **+ sunucu-taraflı kill-switch** (`/system/mlm-status`).
- **Admin sistem:** kullanıcı yönetimi, finans ödemeleri/ayarları, site ayarları, i18n (3 görünüm), loglar, hata akışı, broadcast, push analitiği, zamanlanmış işler, sepet kurtarma.
- **CMS:** sayfa oluşturucu (9 blok tipi: HeroSlider, ProductGrid, CategoryGrid, PromoBanner, ReviewSection, CrossSellGrid, Certificates, Partners, ProductShowcase), sayfalar, slider, medya kütüphanesi, yorumlar.
- Her navigasyonda token `/auth/me` ile yeniden doğrulanıyor; roller asla localStorage'a güvenilmeden sunucudan teyit ediliyor.

### 5.3 Özellik yoğunluğu
Kayar sepet, 9.000 KGS ücretsiz-kargo ilerleme çubuğu, karşılaştırma çekmecesi, paylaşılabilir favori listeleri (`?w=`), son görüntülenenler, canlı ziyaretçi sayacı, arama otomatik tamamlama, geri sayım kampanyaları, oyunlaştırılmış cüzdan + sadakat dinamik fiyatlandırma (`PriceEngine.ts`), 15 dk stok rezervasyonu, Web Push, sepet-terk heartbeat, admin impersonation banner'ı. Grafikler bile elle yazılmış (bar/pie — chart kütüphanesi yok).

### 5.4 Performans mühendisliği (dikkat çekici düzeyde iyi)
- 23 dinamik `import()` ile rota bazlı bölme (admin görünümleri lazy), 11 `defineAsyncComponent`, Quill CSS lazy enjeksiyonu.
- `LazyImage`: AVIF/WebP srcset (600/1024/1920), `fetchpriority=high` üst katman için.
- **ETag stale-while-revalidate katmanı:** `If-None-Match` + sessionStorage; 304'ler cache'ten 200'e hidratlanıyor.
- CI'da **bundle bütçesi** (main ≤180 KB gzip, toplam JS ≤700 KB); `dist/` = 3,2 MB, route başına bölünmüş.
- Dayanıklılık: rota başına ErrorBoundary, bayat-chunk kendini-iyileştirme (tek korumalı reload), Sentry + backend `/errors/report` yedeği.

### 5.5 Borç ve tutarsızlıklar
- README güncel değil (olmayan bir `en.json`'dan bahsediyor).
- `layouts/` ve `services/` dizinleri **boş** (layout'lar `App.vue` içinde koşullu).
- Bazı admin görünümleri paylaşılan axios yerine global axios çağırıyor.
- PWA bilinçli olarak devre dışı (service worker bayat bundle cache'liyordu); yalnızca özel push worker `/sw.js` kaldı.
- Türkçe UI kalıntıları guard'larda/ErrorBoundary'de duruyor.

### 5.6 Sayısal özet (frontend)
| Metrik | Değer |
|---|---|
| Kaynak | 92 `.vue` (33.430 satır) + 43 `.ts` (9.996) ≈ **43,4 bin satır** |
| View / bileşen / composable / store | 41 / 50 (9 CMS bloğu) / 24 / 4 |
| Test | 38 dosya (~6.600 satır) |
| i18n | 3 dil × 1.017 anahtar |
| Erişilebilirlik | 122 `aria-*` kullanımı |

---

## 6. DevOps, Dağıtım ve Operasyon

### 6.1 CI/CD (GitHub Actions — 10 workflow + PR şablonu)
| Workflow | İşlev |
|---|---|
| `ci.yml` | MySQL 8 servisli backend testleri + frontend typecheck/test/build/smoke |
| `deploy.yml` | Manuel tetiklemeli, rsync + atomik release + rollback komutlu — **hiç çalıştırılmamış** |
| `backend-integration.yml` | Gecelik tam entegrasyon (MySQL container) |
| `lint.yml`, `codeql.yml`, `snyk.yml`, `dependency-review.yml` | Kalite/güvenlik kapıları |
| `bundle-budget.yml`, `i18n-coverage.yml`, `openapi-drift.yml` | Frontend/i18n/API sözleşme kapıları |

**Kritik bulgu:** `runs.json` dökümüne göre repo tarihindeki **20 Actions çalıştırmasının tamamı başarısız** (6–12 Temmuz gecelik entegrasyon serileri dahil) ve **hiç "Deploy (Production)" çalışması yok**. 12 Temmuz'daki commit dalgası CI'ı yeşillendirmeye yönelik; yani pipeline kağıt üzerinde mükemmel ama pratikte yeni yeni oturuyor.

### 6.2 Gerçek dağıtım düzeni
- Kök dizin bir **ops harness'ı**: 39 `.cjs` + 3 `.js` tek-seferlik script, 11 log dosyası; kök `package.json`'un tek bağımlılığı `node-ssh`.
- `full-hot-deploy.js`: Windows geliştirme makinesinden **root + parola ile SSH** → `backend/dist` ve `frontend/dist`'i doğrudan üzerine yazar → **`prisma db push --accept-data-loss` üretimde çalıştırır** → `pm2 restart`. Staging yok, artifact sürümleme yok, rollback yolu yok.
- Belgelenen `/var/www/power-vital/releases → current` symlink düzeni **kullanılmıyor**; PM2 uygulama adı (`pv-backend` vs `power-vital-api`) ve DB adı (`pv_production` vs `powervital_db`) dokümanlarla gerçeklik arasında **çelişiyor**.
- `scripts-archive/` altında ~130 arşivlenmiş tek-seferlik script (gitignore ile kontrol altında).

### 6.3 Yedekleme ve izleme
- `backend/scripts/backup.js`: mysqldump→gzip, 7 günlük/4 haftalık/12 aylık rotasyon, opsiyonel S3; `restore-verify.js` haftalık doğrulama; `smoke.sh` ~30 uç noktalı deploy sonrası duman testi. **Ancak crontab/systemd tanımı repoda yok** — yedekleme zamanlaması yalnızca sunucuda yaşıyor (doğrulanamıyor).
- `MONITORING.md`: Prometheus + Grafana mimarisi, 13 `pv_*` metriği, hazır dashboard JSON ve 4 alarm kuralı — **tamamı şablon; dağıtıldığına dair kanıt yok**. `/metrics` uç noktası kimlik doğrulamasız; nginx ACL'sine güveniliyor.

---

## 7. Güvenlik Durumu

### 7.1 Güçlü yönler
helmet + elle ayarlanmış CSP (unsafe-inline yok), 1 yıl HSTS preload, frame-ancestors none, COOP/CORP, Permissions-Policy kilidi; CORS allowlist; refresh-token replay tespiti; sırlar env üzerinden; trust-proxy; CI'da güvenlik-başlığı testleri; CodeQL + Snyk + dependency-review; PR #1 (`security/audit-hardening`) ile harita-embed host kontrolü, axios başlık korumaları, hata-akışı sertleştirme uygulanmış.

### 7.2 Kritik bulgular (öncelik sırasıyla)

1. **Repo kökünde düz metin parolalar:** admin giriş parolası **21** `.cjs` dosyasında, SSH/DB parolası **12** dosyada açık metindi — üstelik bazıları canlı `powervital.kg`'ye istek atıyor. **(18 Temmuz 2026'da temizlendi: aktif script'ler `.env.deploy` / `.env.smoke` tabanlı hale getirildi, `scripts-archive/` ve log'lardaki 255 literal `REDACTED` ile maskelendi; parola değerleri bu rapordan da kaldırıldı.)**
2. **Telafi edilmemiş kimlik sızıntısı:** `ROTATE-SECRETS.md`'ye göre tek bir parola **SSH-root + SMTP + MySQL root** için ortak ve 218+ yerde sızmış. Script hijyeni 18 Temmuz'da düzeltildi. Aynı gün yapılan `--dry-run --all` ön kontrolü şunu ortaya çıkardı: sunucudaki `.env` zaten `.env.deploy.new` ile **5/6 anahtarda birebir aynı** — yani daha önce zayıf/öngörülebilir aday değerlerle (ör. `0123456789abcdef…` desenli JWT secret) bir rotasyon uygulanmış; bu değerler yerel script'lerde/sohbet geçmişinde de dolaştığı için **üretim hâlâ fiilen ele geçirilmiş sayılmalı**. Ayrıca script'in `--db` yolunda DATABASE_URL'i bozan bir kodlama hatası (`%23%23` → ham `##`) ve `--ssh` modunun gerçek OS parolasını hiç değiştirmediği tespit edildi. **(18 Temmuz düzeltmeleri: `scripts/generate-new-secrets.mjs` ile modulo-bias'sız kriptografik sırlar üretilip `.env.deploy.new` yenilendi — eski zayıf adaylar silindi; `rotate-secrets.cjs`'deki DATABASE_URL encode hatası düzeltildi (ham/encoded girdi normalize edilip her zaman encoded yazılıyor) ve dry-run çıktısı artık değerleri sha256 parmak iziyle maskeliyor — yeni sırlar sohbet/log geçmişine düşmüyor. Maskeli dry-run, 6 anahtarın da doğru değerlere rotate olacağını doğruladı. Kalan adımlar: canlı rotasyonun `--safe` ile anahtar-anahtar uygulanması, OS seviyesinde gerçek SSH rotasyonu ve `.env.deploy.new`'in rotasyon sonrası güvenli silinmesi.)** **İlerleme (18 Temmuz, ~13:10):** `JWT_SECRET` + `REFRESH_TOKEN_SECRET` `--safe --jwt` ile **canlıda rotate edildi** — her anahtar sonrası sağlık kontrolü 200 OK, uzak yedek `.env.backups/.env.bak.1784358725391`, sonrasında taze admin girişiyle duman testi (ürün CSV export'ları) başarılı. Yan etki olarak tüm kullanıcı oturumları düştü (beklenen). **İlerleme (18 Temmuz, ~13:20):** DB rotasyonu da tamamlandı — `rotate-db-password.cjs` ile `pv_admin@localhost` MySQL parolası ALTER edilip gerçek bağlantıyla doğrulandı, ardından `rotate-secrets.cjs --safe --db` ile uzak `DATABASE_URL` güncellendi (yedek `.env.bak.1784359204046`, sağlık 200 OK); düzeltilen encode mantığı sorunsuz çalıştı. Rotasyon sonrası duman testleri (admin girişi, ürün CSV, FULLTEXT arama) tam başarı. **Sırada:** SMTP (önce hPanel'de posta kutusu parolası), SSH (hPanel + anahtar-auth), VAPID ve Gemini anahtarları; tümü bitince `.env.deploy.new` güvenli silinecek. **SMTP bulgusu (18 Temmuz, ~13:30):** Rotasyon öncesi güvenlik kapısı (yeni `scripts/verify-smtp.mjs`) yeni parolanın Hostinger'da reddedildiğini gösterdi; sunucudaki **mevcut** parolayla yapılan kontrol de 535 auth hatası verdi — yani **üretimde e-posta gönderimi zaten kırık** (önceki yarım rotasyonda `.env`'e aday değer yazılmış ama hPanel'de posta kutusu parolası hiç değiştirilmemiş; hata uygulama loglarına düşmüyor, sessiz yutuluyor). Çözüm: hPanel'de `info@powervital.org` parolası `.env.deploy.new`'deki `MAIL_PASS` değerine ayarlanınca `verify-smtp.mjs` → `--safe --smtp` → test maili zinciri çalıştırılacak — bu rotasyon artık bir iyileştirme değil, **kesinti giderme**. **SMTP ilerleme (18 Temmuz, ~13:45):** Kullanıcı hPanel'de posta kutusu parolasını değiştirdi (kendi seçtiği 14 karakterlik bir değer; üretecin 28 karakterlik rastgele değeri yerine — `.env.deploy.new`'deki `MAIL_PASS` satırını da aynı değerle el ile güncelledi; ilk taramadaki "yazma bozulması" şüphesi aslında bu el düzenlemesiydi, **rotasyon script'i doğru çalışmış**). `--safe --smtp` ile uzak env güncellendi, her iki anahtar (`MAIL_PASS`/`SMTP_PASSWORD`) lokal+uzakta aynı çalışan değere hizalandı, API sağlıklı. **Kalan engel:** sunucudan gönderilen test mailleri 535 alıyor — aynı kimlikle aynı dakikalarda dış ağdan auth başarılıyken VPS'ten 465/587 ve IPv4/IPv6'nın tümü reddediliyor → **Hostinger'ın auth katmanında VPS kaynak-IP'sine özgü bir engel** var (haftalarca yanlış parolayla deneyen uygulamanın tetiklediği anti-brute-force veya VPS anti-spam politikası). Çözüm: engelin kendiliğinden kalkması (15-60 dk) + periyodik yeniden deneme, ya da Hostinger destek kaydı. Ayrıca kullanıcının seçtiği 14 karakterlik parolanın ileride üreteçteki 28 karakterlik güçlü değerle (hPanel + env birlikte) değiştirilmesi önerilir.
3. **Üretimde `prisma db push --accept-data-loss`:** hot-deploy script'i veri kaybı riskini açıkça kabul ederek şema itiyor; migration disipliniyle çelişiyor.
4. **`/metrics` kimlik doğrulamasız** (bilinçli; nginx ACL'sine bağımlı).
5. Global hata/404 handler eksikliği; eslint'in `any`'ye ve boş catch'lere izin vermesi (kısmen bilinçli ve belgelenmiş).
6. Repo'ya commit'lenmiş ikili/üretilmiş artıklar: Prisma generated client (Windows DLL + `.tmp` dosyaları), ~20 MB OCR traineddata; `.gitignore`'da `dist/` ve `*.log` eksik.

---

## 8. Git Geçmişi ve Geliştirme Süreci

- **37 commit**, tek geliştirici (Atabay Hakan) — **bus factor = 1**. İlk commit 4 Haziran 2026, son commit 12 Temmuz 2026 (~5,5 haftada inşa edilmiş!).
- Tag/release yok; tek PR (#1 security/audit-hardening, 12 Temmuz).
- **AI destekli geliştirme açıkça görülüyor:** `.claude/` altında 60+ ön-onaylı Bash izni (deploy script'leri dahil), kurulu `senior-backend` skill'i; `.agents/AGENTS.md` yol disiplini dayatıyor; commit ritmi ("checkpoint:" commit'leri, yoğun `fix(...)` patlamaları) AI-eşli oturumlarla uyumlu.
- 2 eski OneDrive yoluna kayıtlı **prunable worktree** artığı var (temizlenebilir).
- README rozeti yanlış org'a işaret ediyor (`powervital/pv-platform` vs gerçek `atabayhakan/power-vital`).

---

## 9. Risk Matrisi

| # | Risk | Şiddet | Olasılık | Durum |
|---|---|---|---|---|
| 1 | Tek parolanın SSH-root/SMTP/DB'de ortak ve sızmış olması | **Kritik** | Yüksek | Rotasyon planı var, tamamlanması doğrulanamadı |
| 2 | Kök script'lerde düz metin parolalar (33 dosya) | **Kritik** | Yüksek | Gitignore'lı ama diskte aktif |
| 3 | Üretimde `--accept-data-loss` ile şema itme | Yüksek | Orta | Her hot-deploy'da tekrarlanıyor |
| 4 | Rollback'siz, staging'siz laptop-deploy | Yüksek | Orta | `deploy.yml` hazır ama hiç kullanılmamış |
| 5 | Tek geliştirici (bus factor = 1) | Yüksek | — | Yapısal |
| 6 | Yedekleme cron'u ve izleme stack'i doğrulanamıyor | Orta | Orta | Dokümanda var, repoda kanıt yok |
| 7 | Süreç-içi durum (SSE/presence/metrik) yatay ölçeklenemez | Orta | Düşük (şimdilik) | Bilinçli tasarım |
| 8 | Doc/gerçeklik uyumsuzlukları (PM2 adı, DB adı, yollar, rozetler) | Düşük | — | Kafa karışıklığı kaynağı |
| 9 | i18n miras tutarsızlığı (TR kalıntılar) | Düşük | — | Kozmetik/bakım |

---

## 10. Öneriler (öncelik sırasıyla)

1. **Bu hafta:** `ROTATE-SECRETS.md` planını uçtan uca tamamla (SSH anahtar auth'a geçiş, SMTP, MySQL, JWT/refresh, VAPID, Gemini); kökteki 33 script'teki parolaları temizle; `scripts/check-db.cjs`'teki aday parolayı kaldır; sızıntı geçmişi için BFG ile git temizliği değerlendir.
2. **Bu ay:** Dağıtımları `deploy.yml`'e taşı (Environment secret'ları tanımla, ilk kontrollü çalıştırmayı yap); hot-deploy script'lerini emekliye ayır; `db push --accept-data-loss`'u üretimden kaldırıp migration'a dön.
3. **Altyapı:** Yedekleme cron'unu ve Prometheus/Grafana'yı gerçekten kur (veya UptimeRobot gibi hafif bir başlangıç); `prometheus.yml` + alertmanager config'lerini repoya ekle; `/metrics`'i nginx ACL ile kilitle.
4. **Kod hijyeni:** Global hata middleware'i + 404 handler ekle; `dist/` ve `*.log`'u `.gitignore`'a al; Prisma generated client'ı ve traineddata'yı repodan çıkar (CI'da generate); boş `layouts/`/`services/` dizinlerini kaldır; README'yi güncelle.
5. **Sürdürülebilirlik:** En az bir yedek operatöre runbook eğitimi; tag/release disiplini başlat; prunable worktree'leri temizle.

---

## 11. Toplam Sayısal Panorama

| Kategori | Değer |
|---|---|
| Toplam izlenen dosya (git) | 435 |
| Backend kaynak | 15.404 satır (75 dosya) |
| Backend test | 7.825 satır / 579 vaka |
| Frontend kaynak | ~43.400 satır (135 dosya) |
| Frontend test | ~6.600 satır (38 dosya) |
| API | 134 endpoint / 95 OpenAPI path |
| Veri modeli | 26 Prisma modeli, 734 satır şema |
| CI workflow | 10 |
| Commit / süre | 37 / ~5,5 hafta |
| Kök dizin tek-seferlik script | 42 (+ arşivde ~130) |
| TODO/FIXME (backend src) | 0 |

---

*Bu rapor, kaynak kodun tamamı üzerinde çalışan üç paralel analiz ajanının bulgularından derlenmiştir. Canlı sunucu durumu (yedekleme cron'u, izleme, secret rotasyonunun tamamlanması) bu analizle doğrulanamayan başlıklardır.*
