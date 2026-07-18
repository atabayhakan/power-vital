# Admin Paneli Sol Menü — Özellik Denetim Raporu

**Tarih:** 18 Temmuz 2026
**Kapsam:** `frontend/src/components/Sidebar.vue` menüsündeki 22 admin öğesi + rol bazlı görünümler
**Yöntem:** Her menü hedefinin view dosyası, çağırdığı API uçları ve çakışmaları tek tek incelendi.

---

## 1. Menü Envanteri ve Hükümler

| # | Menü öğesi | Hüküm | Gerekçe |
|---|---|---|---|
| 1 | 📊 Genel Bakış (`/admin`) | ✅ Gerekli | KPI kartları, 30g trend, top ürün/müşteri, canlı SSE bildirimleri, sunucu metrikleri — hepsi tek panelde, başka yerde tekrarlanmıyor |
| 2 | 🛍️ Sipariş Yönetimi (`/orders`) | ✅ Gerekli | Durum geçişleri, toplu işlem, CSV export, fiş; dashboard'daki "son siparişler" ile bilinçli örtüşme (normal) |
| 3 | 💸 Ödemeler (`/finance-payouts`) | ✅ Gerekli | Çekim talebi onay/red kuyruğu + CSV; finans-ayarları ile ayrımı doğru (işlem kuyruğu vs statik konfig) |
| 4 | 💵 POS (`/pos`) | ✅ Gerekli | Kasiyer rolü var, fiziksel satış kanalı; storefront ile aynı `/checkout` ucunu kullanması tutarlı |
| 5 | 👥 Kullanıcı Merkezi (`/user-management`) | ✅ Gerekli | CRUD, rol yönetimi, toplu silme, CSV, impersonation |
| 6 | 🌳 Ağaç (`/network`) | ✅ Gerekli | MLM salt-okunur soy ağacı |
| 7 | 💎 Bonus Kontrol (`/bonus-control`) | ⚠️ Riskli | Canlı MLM konfigürasyon editörü — **simülasyon ile aynı yazma hedefi** (`/system/config`) + hata durumunda demo veriye düşme kokusu |
| 8 | 🔮 Simülasyon (`/simulation`) | 🔀 Birleştirme adayı | Aynı config'e yazıyor ama **canlı değerleri okumadan** "uygula" yapıyor → kör üzerine yazma riski; bonus-control içine "simüle et" modu olarak taşınmalı |
| 9 | 💊 Ürünler (`/products`) | ⚠️ Küçük eksik | CRUD + stok + düşük-stok rozeti var; **products.csv export butonu yok** (API hazır) |
| 10 | 🗂️ Kategoriler (`/categories`) | ✅ Gerekli | CRUD + sıralama + görsel |
| 11 | 🎨 Sayfa Oluşturucu (`/cms/page-builder`) | ✅ Gerekli | Ana sayfa blok bestecisi (9 blok tipi) |
| 12 | 📄 İçerik Sayfaları (`/cms/pages`) | ✅ Gerekli | Bağımsız CMS sayfaları (`/p/:slug`) |
| 13 | 🖼️ Slider Yönetimi (`/cms/slider-manage`) | ✅ Gerekli (çapraz bağ öner) | HeroSlide **içeriğini** yönetir; page-builder yalnızca bloğun **yerleşimini** yapar — tekrar değil ama admin'in içeriğin başka menüde olduğunu anlaması zor |
| 14 | 📁 Medya Kütüphanesi (`/cms/media-library`) | ✅ Gerekli | Merkezi medya; modal olarak da gömülü |
| 15 | 💬 Yorum Moderasyonu (`/cms/reviews`) | ✅ Gerekli | Ürün + mağaza yorum onay kuyruğu |
| 16 | 📊 Push Analitiği (`/admin-push-analytics`) | ✅ Gerekli (çapraz bağ öner) | **Agregat kanal performansı** (abone sayısı, event-key bazlı oranlar, 14g trend, top adminler); broadcast'teki **gönderim bazlı log**dan farklı kesit |
| 17 | 📜 Canlı Log (`/admin-logs`) | ✅ Gerekli | Backend pino log tail'i |
| 18 | 🐞 İstemci Hataları (`/admin-errors`) | ✅ Gerekli | Frontend hata gelen kutusu; sunucu loglarından farklı kaynak |
| 19 | 📣 Broadcast (`/admin-broadcast`) | ✅ Gerekli | Push besteci + gönderim geçmişi + CSV |
| 20 | ⏰ Zamanlanmış (`/admin-scheduled`) | ⚠️ Küçük koku | İşlevsel ama besteci formu broadcast'tekinin **kopyası** (paylaşılan bileşen yok) |
| 21 | 🛒 Sepet Kurtarma (`/admin-cart-recovery`) | ✅ Gerekli | Terk edilen sepet hattı, KPI'lar, manuel sweep/notify |
| 22a | 🌍 i18n Merkezi (`/i18n`) | ⚠️ İnce | Yalnızca istatistik + 6 kartlık geçiş sayfası; diğer iki i18n ekranının **sekmesi** olabilirdi |
| 22b | 🔤 UI Strings (`/i18n/ui-strings`) | ✅ Gerekli | Statik arayüz metni override'ları |
| — | 💱 Finans Ayarları (`/finance-settings`) | ✅ Gerekli | Ödeme kanalı hesapları, QR, kargo eşiği |
| — | ⚙️ Mağaza Ayarları (`/site-settings`) | ✅ Gerekli | Logo, harita, topbar, **kampanya sayacı**, sertifikalar, SSS |

**Genel hüküm:** Menü şişkin değil; tam anlamıyla "gereksiz" (hiç olmamalı) öğe yok. Sorunlar: 1 birleştirme adayı (Simülasyon), 1 riskli etkileşim (bonus↔simülasyon config çakışması), 2 ince sayfa (i18n girişi), 1 ölü dosya.

---

## 2. Tekrarlanan / Çakışan Öğeler

1. **🔴 → ✅ Bonus Kontrol ↔ Simülasyon (en kritik çakışma):** İkisi de `/system/config`'e yazıyor. Simülasyon canlı değerleri hiç okumuyor (hardcoded varsayılanlarla açılıyor) ve "Canlıya Uygula" dediğinizde bonus-control'de ayarlanmış gerçek değerleri **körlemesine eziyor**. MLM ödeme oranlarını yanlışlıkla sıfırlayabilecek/bozabilecek bir tuzak. **Çözüldü — bkz. §7.**
2. **🟡 i18n üç parçası:** `/i18n` (istatistik kartları), `/i18n/:model` (kayıt çevirileri), `/i18n/ui-strings` (arayüz metinleri) işlevsel olarak farklı ama giriş sayfası çok ince — tek ekranda 3 sekme daha temiz olur.
3. **🟡 → ✅ Push Analitiği ↔ Broadcast geçmişi:** Aynı teslimat verisi, farklı kesit (agregat performans vs gönderim logu) — tekrar sayılmaz ama menüde birbirine bağlanmalı. **Çapraz bağlantılar eklendi — bkz. §7.**
4. **🟡 → ✅ Slider ↔ Page-builder hero bloğu:** İçerik vs yerleşim ayrımı doğru; admin deneyimi için page-builder'da hero bloğuna "içeriği düzenle →" bağlantısı eklenmeli. **Çapraz bağlantılar eklendi — bkz. §7.**
5. **🟡 Zamanlanmış besteci formu:** Broadcast bestecisinin kopyası — ortak bileşene çıkarılmalı.

---

## 3. Mantıksız / Riskli Davranışlar (menü öğesi olmayan bulgular)

1. **Bonus Kontrol demo veri tuzağı:** API hatasında ekran **demo verisiyle** doluyor (`BonusControlView.vue:18-22`) — finans konfigürasyonu ekranında sahte veri, yanlış karar riski. **✅ Kaldırıldı — bkz. §7.**
2. **Destek formu sahte başarı:** `/account/support` formu hata olursa bile "gönderildi" diyor (`SupportView.vue:59`) — müşteri mesajı kaybolduğunda bile sessiz.
3. **Ölü kod:** `AdminI18nProductView.vue` (22 satırlık stub) hiçbir yerde kullanılmıyor — silinmeli. **✅ Silindi — bkz. §7.**

---

## 4. Eksikler — "Buna Gerek Var"

| # | Eksik | Etki | Durum |
|---|---|---|---|
| 1 | **Admin destek/iletişim gelen kutusu** | İletişim ve destek formları `POST /contact`'a gidiyor ama hiçbir admin ekranı bu mesajları listelemiyor — **müşteri mesajları kara deliğe düşüyor** | ✅ Yapıldı (bkz. §7) |
| 2 | **Distribütör çekim talebi UI'ı** | API hazır (`POST withdrawal request`, bakiye atomik düşüyor) ama `/account/wallet` yalnızca bakiye gösteriyor — **distribütör parasını talep edemiyor**, admin tarafında onay kuyruğu boşuna bekliyor | ✅ Yapıldı (bkz. §7) |
| 3 | **Envanter rezervasyon (soft-hold) görünürlüğü** | 15 dk'lık stok rezervasyonları var ama admin aktif hold'ları hiçbir ekranda göremiyor | 🟡 Orta |
| 4 | **products.csv export butonu** | Backend ucu hazır, UI'da buton yok (diğer 4 CSV'nin butonu var) | ✅ Yapıldı (bkz. §7) |
| 5 | **Kampanya yönetimi** | Tek global countdown, site-settings içine gömülü; kampanya listesi/zamanlama yok (şimdilik yeterli olabilir) | 🟢 Düşük |

## 5. "Buna Gerek Yok" Denilebilecekler

- **Simülasyon** (mevcut haliyle) — ayrı menü öğesi olarak gereksiz ve tehlikeli; bonus-control içine mod olarak taşınmalı.
- **i18n Merkezi giriş sayfası** — ayrı rota yerine sekme olabilir.
- Bunun dışında menü disiplinli; POS, çift kesitli push ekranları, 3'lü i18n ayrımı gibi "şüpheli" görünenlerin tamamı haklı gerekçelere sahip.

---

## 6. Öncelikli Öneriler

1. **Bu sprint:** Destek gelen kutusu (contact mesajlarını DB'ye yaz + admin ekranı) ve distribütör çekim talebi formu (wallet'a) — ikisi de API tarafı neredeyse hazır, iş etkisi yüksek.
2. **Hemen:** Simülasyonun "Canlıya Uygula"sını canlı config'i okuyacak şekilde düzelt (veya birleştir); bonus-control demo fallback'ini kaldır.
3. **Küçük işler:** products.csv butonu, `AdminI18nProductView.vue` silme, destek formundaki sahte başarıyı düzelt, broadcast↔analitik ve slider↔page-builder çapraz bağlantıları.

---

## 7. Tamamlanan İşler

**Güncelleme:** 18 Temmuz 2026 (raporla aynı gün)

### Büyük maddeler

- ✅ **Çekim talebi listesi** — `WalletView`'a çekim talebi formu + talep listesi eklendi; `GET /finance/withdrawals` ile canlı veriye bağlı (§4 eksik #2).
- ✅ **Destek gelen kutusu** — İletişim/destek formları `POST /api/v1/contact` ile DB'ye düşüyor; yeni `SupportInboxView` (`/support-inbox`) + menü öğesi ile admin mesajları okuyup yanıtlayabiliyor (§4 eksik #1).
- ✅ **Simülasyon/BonusControl düzeltmesi** — BonusControl şemada olmayan `isReferralActive` alanını yazıyordu (strict validator 400 veriyordu); gerçek alan `isFastStartActive`'a düzeltildi. Simülasyon artık mount'ta canlı config'i okuyor, "Canlıya Al" önce değişiklik önizlemesi (diff) gösteriyor ve onay olmadan hiçbir şey yazmıyor; her iki ekrandaki demo-veri fallback'i kaldırıldı, hata durumunda gerçek hata + retry gösteriliyor (§2 çakışma #1, §3 risk #1).

### Küçük işler

- ✅ **products.csv export butonu** — `ProductsView` tablo araç çubuğuna "📥 Ürünleri CSV olarak indir" butonu eklendi; OrdersView/UserManagementView ile aynı auth-header + blob kalıbı (`utils/csvDownload`), dosya adı `products.csv` (§4 eksik #4).
- ✅ **Ölü view silindi** — `AdminI18nProductView.vue` (yalnızca `/i18n/products`'a yönlendiren stub); router'da ve hiçbir import/link'te referans olmadığı grep ile doğrulandıktan sonra silindi, tek tüketicisi olduğu `admin.i18nProduct.redirecting` anahtarı 3 locale + fixture + seed script'ten temizlendi (§3 risk #3).
- ✅ **Broadcast ↔ Analitik çapraz bağlantısı** — Broadcast başlığına "Hedef kitleyi analizde gör →", Push Analitik başlığına "Broadcast'e dön →" bağlantısı eklendi (§2 çakışma #3).
- ✅ **Slider ↔ PageBuilder çapraz bağlantısı** — Slider Yönetimi başlığına "Ana sayfa bölüm sıralaması (Sayfa Kurucu) →", PageBuilder "Bölümler" listesine (Ana Sayfa sekmesinde) "Slider içerikleri Slider Yönetimi'nde →" bağlantısı eklendi (§2 çakışma #4).
