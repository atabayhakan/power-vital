<script setup lang="ts">
</script>

<template>
  <div class="page-wrap">
    <header class="page-nav">
      <div class="container page-nav__inner">
        <router-link to="/" class="page-nav__logo"><span class="lp">Power</span><span class="lv">Vital</span></router-link>
        <nav class="page-nav__menu">
          <router-link to="/">Ana Sayfa</router-link>
          <router-link to="/about" class="active-link">Hakkımızda</router-link>
          <router-link to="/contact">İletişim</router-link>
        </nav>
      </div>
    </header>

    <main class="container page-main">
      <section class="about-hero">
        <h1>Hakkımızda</h1>
        <p class="subtitle">Orta Asya'nın ilk otonom sağlık ve iş fırsatı platformu.</p>
      </section>

      <section class="about-content">
        <div class="about-block">
          <h2>Misyonumuz</h2>
          <p>Power Vital, Kırgızistan merkezli hibrit bir sağlık teknolojisi platformudur. Amacımız, bilim destekli premium takviye gıda ürünlerini herkes için erişilebilir kılmak ve distribütörlerimize adil, şeffaf ve otonom bir kazanç modeli sunmaktır.</p>
        </div>

        <div class="about-block">
          <h2>Vizyonumuz</h2>
          <p>Tüm Orta Asya pazarında (Kırgızistan, Kazakistan, Özbekistan, Tacikistan ve Türkmenistan) en güvenilir takviye gıda markası olmak ve geleneksel ağ pazarlama modellerinin ötesine geçen, tamamen otonom bir distribütör ekosistemi inşa etmektir.</p>
        </div>

        <div class="about-stats">
          <div class="stat-card">
            <span class="stat-num">9+</span>
            <span class="stat-label">Premium Ürün</span>
          </div>
          <div class="stat-card">
            <span class="stat-num">0.3 sn</span>
            <span class="stat-label">Prim Hesaplama</span>
          </div>
          <div class="stat-card">
            <span class="stat-num">5+</span>
            <span class="stat-label">Hedef Ülke</span>
          </div>
          <div class="stat-card">
            <span class="stat-num">%100</span>
            <span class="stat-label">Otonom Motor</span>
          </div>
        </div>

        <div class="about-block">
          <h2>Neden Farklıyız?</h2>
          <ul class="feature-list">
            <li><strong>Otonom Prim Motoru:</strong> Geleneksel MLM şirketlerinin aksine, prim dağıtımı tamamen robotlar tarafından yapılır — sıfır insan müdahalesi, sıfır gecikme.</li>
            <li><strong>%30 Güvenlik Kilidi:</strong> Şirketin toplam gelirinin en fazla %30'u prim olarak dağıtılır. Bu matematiksel garanti sayesinde sistem asla tıkanmaz.</li>
            <li><strong>Marketplace Entegrasyonu:</strong> Wildberries, Ozon, Kaspi gibi büyük platformlarla entegre çalışarak ürünlerimizi daha geniş kitlelere ulaştırıyoruz.</li>
            <li><strong>Carry-over Sistemi:</strong> Haftalık kapanışlarda eşleşmeyen puanlarınız yanmaz, sonraki haftaya otomatik devreder.</li>
          </ul>
        </div>
      </section>
    </main>

    <footer class="page-footer">
      <div class="container"><p>&copy; 2026 Power Vital. Tüm hakları saklıdır.</p></div>
    </footer>
  </div>
</template>

<style scoped>
.page-wrap { min-height: 100vh; width: 100vw; background: #fff; font-family: 'Inter', system-ui, sans-serif; color: #1a1a1a; overflow-y: auto; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.page-nav { border-bottom: 1px solid #e8e8e8; background: #fff; position: sticky; top: 0; z-index: 100; }
.page-nav__inner { display: flex; align-items: center; justify-content: space-between; height: 60px; }
.page-nav__logo { text-decoration: none; font-size: 20px; font-weight: 800; }
.lp { color: #2d6b4f; } .lv { color: #1a1a1a; }
.page-nav__menu { display: flex; gap: 24px; }
.page-nav__menu a { text-decoration: none; color: #666; font-size: 14px; font-weight: 500; }
.page-nav__menu .active-link { color: #1a1a1a; font-weight: 600; }

.page-main { padding: 48px 20px; }
.about-hero { text-align: center; margin-bottom: 56px; }
.about-hero h1 { font-size: 36px; font-weight: 700; margin-bottom: 10px; }
.about-hero .subtitle { font-size: 16px; color: #666; }

.about-content { max-width: 800px; margin: 0 auto; }
.about-block { margin-bottom: 40px; }
.about-block h2 { font-size: 22px; font-weight: 700; margin-bottom: 12px; color: #1a1a1a; }
.about-block p { font-size: 15px; color: #555; line-height: 1.8; }

.about-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 48px 0; }
.stat-card { text-align: center; padding: 24px 16px; border: 1px solid #e8e8e8; border-radius: 8px; }
.stat-num { display: block; font-size: 28px; font-weight: 800; color: #2d6b4f; }
.stat-label { font-size: 12px; color: #999; margin-top: 4px; }

.feature-list { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 16px; }
.feature-list li { padding: 16px; border: 1px solid #e8e8e8; border-radius: 8px; font-size: 14px; color: #555; line-height: 1.7; }
.feature-list strong { color: #1a1a1a; }

.page-footer { border-top: 1px solid #e8e8e8; padding: 20px 0; text-align: center; font-size: 12px; color: #999; margin-top: 40px; }

@media (max-width: 768px) {
  .about-stats { grid-template-columns: repeat(2, 1fr); }
  .page-nav__menu { display: none; }
}
</style>
