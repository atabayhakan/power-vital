<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useMlm } from '../composables/useMlm';

const router = useRouter();
const { isMlmEnabled, fetchMlmStatus } = useMlm();

/* ─── Types ─── */
interface ProductImage { id: string; imageUrl: string; sortOrder: number; }
interface Category { id: string; name: string; slug: string; iconEmoji: string | null; }
interface Product {
  id: string; name: string; barcode: string; description: string | null;
  basePriceKgs: number; categoryId: string | null;
  images: ProductImage[]; category: Category | null;
}
interface Slide {
  id: string; title: string; subtitle: string | null;
  buttonText: string | null; buttonLink: string | null; imageUrl: string;
}

/* ─── State ─── */
const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const slides = ref<Slide[]>([]);
const activeCategory = ref<string | null>(null);
const cartCount = ref(0);
const currentSlide = ref(0);
const isLoggedIn = ref(false);
const userRole = ref('customer');
const productsLoading = ref(true);
const imgErrors = ref<Record<string, boolean>>({});
let slideTimer: ReturnType<typeof setInterval> | null = null;

// Dynamic Settings State
const siteSettings = ref({
  logoUrl: '',
  topbarShippingMsg: '🚚 1 000 сом üzeri siparişlerde ücretsiz kargo',
  topbarPhone: '📞 +996 312 123 456',
  trustBadges: [] as any[],
  partners: [] as any[],
  footerLinks: [] as any[],
  copyrightText: '© 2026 Power Vital. Tüm hakları saklıdır.'
});

/* ─── Fallback images keyed by barcode ─── */
const PRODUCT_IMAGES: Record<string, string> = {
  'PV-001': 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/b0668799-333b-4bd0-9c9b-508ed5ed5ff3/1080/magnezyum-calisma-yuzeyi-1.webp',
  'PV-002': 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/abdf396c-433e-4dc4-ae67-5c43f805b42d/1080/karadut-01.webp',
  'PV-003': 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/33ad56e8-87bc-4af9-b202-1a893bdea410/1080/omega30.webp',
  'PV-004': 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/ed4f5687-ff5d-44bc-b225-5dd384d7f20b/1080/yynlkmcyhujkqszb-jpg.webp',
  'PV-005': 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/17011374-c4da-4a0f-aa6c-7719c32fe704/1080/corekotu-calisma-yuzeyi-1.webp',
  'PV-006': 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/a3353538-88ec-4644-a34d-85b7f2d0296b/1080/kolajen-calisma-yuzeyi-1.webp',
  'PV-007': 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/89c5c8bc-e202-4830-8de5-633e973aed21/1080/kolajen-ardis-sampuan.webp',
  'PV-008': 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/274e1ec7-1f90-4c42-9741-9762b4038f8b/1080/men-care-1.webp',
  'PV-009': 'https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/37d23687-6abb-4cf3-9ce2-1bc46818be42/1080/women-care-1.webp',
};

const SLIDE_FALLBACKS = [
  { id: 'f1', title: 'Sağlığınıza Yatırım Yapın', subtitle: 'Bilim destekli premium takviye gıdalar ile daha güçlü bir yaşam.', buttonText: 'Ürünleri Keşfet', buttonLink: '#products', imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=80' },
  { id: 'f2', title: 'İş Fırsatını Kaçırmayın', subtitle: 'Power Vital distribütörü olun, anında kazanmaya başlayın.', buttonText: 'Distribütör Ol', buttonLink: '/register', imageUrl: 'https://images.unsplash.com/photo-1505576399279-0d754cf06d1d?w=1400&q=80' },
  { id: 'f3', title: 'Doğanın Gücü, Bilimin Işığı', subtitle: 'Omega 3, Magnezyum, Kolajen — vücudunuzun ihtiyacı olan her şey.', buttonText: 'Hemen Alışveriş Yap', buttonLink: '#products', imageUrl: 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=1400&q=80' },
];

const CAT_FALLBACKS = [
  { id: 'c1', name: 'Takviye Gıda', slug: 'takviye-gida', iconEmoji: '💊' },
  { id: 'c2', name: 'Cilt Bakım', slug: 'cilt-bakim', iconEmoji: '✨' },
  { id: 'c3', name: 'Saç Bakım', slug: 'sac-bakim', iconEmoji: '💇' },
  { id: 'c4', name: 'Multivitamin', slug: 'multivitamin', iconEmoji: '🏋️' },
];

const MOCK_PRODUCTS: Product[] = [
  { id: 'm1', name: 'Magnezyum Kompleks - 60 Tablet', barcode: 'PV-001', description: null, basePriceKgs: 2000, categoryId: 'c1', images: [], category: { id: 'c1', name: 'Takviye Gıda', slug: 'takviye-gida', iconEmoji: '💊' } },
  { id: 'm2', name: 'Karadut, Karamürver, Ahududu Özü', barcode: 'PV-002', description: null, basePriceKgs: 2000, categoryId: 'c1', images: [], category: { id: 'c1', name: 'Takviye Gıda', slug: 'takviye-gida', iconEmoji: '💊' } },
  { id: 'm3', name: 'Omega 3 Kapsül - 30 Adet', barcode: 'PV-003', description: null, basePriceKgs: 2000, categoryId: 'c1', images: [], category: { id: 'c1', name: 'Takviye Gıda', slug: 'takviye-gida', iconEmoji: '💊' } },
  { id: 'm4', name: 'Hidrolize Kolajen Peptit - 30 Şase', barcode: 'PV-004', description: null, basePriceKgs: 2000, categoryId: 'c1', images: [], category: { id: 'c1', name: 'Takviye Gıda', slug: 'takviye-gida', iconEmoji: '💊' } },
  { id: 'm5', name: 'Çörek Otu Yağı - 100ml', barcode: 'PV-005', description: null, basePriceKgs: 2000, categoryId: 'c1', images: [], category: { id: 'c1', name: 'Takviye Gıda', slug: 'takviye-gida', iconEmoji: '💊' } },
  { id: 'm6', name: 'Kolajen Cilt Bakım Serumu', barcode: 'PV-006', description: null, basePriceKgs: 2000, categoryId: 'c2', images: [], category: { id: 'c2', name: 'Cilt Bakım', slug: 'cilt-bakim', iconEmoji: '✨' } },
  { id: 'm7', name: 'Kolajen Ardıç Şampuan', barcode: 'PV-007', description: null, basePriceKgs: 2000, categoryId: 'c3', images: [], category: { id: 'c3', name: 'Saç Bakım', slug: 'sac-bakim', iconEmoji: '💇' } },
  { id: 'm8', name: 'Men Care Multivitamin', barcode: 'PV-008', description: null, basePriceKgs: 2000, categoryId: 'c4', images: [], category: { id: 'c4', name: 'Multivitamin', slug: 'multivitamin', iconEmoji: '🏋️' } },
  { id: 'm9', name: 'Women Care Multivitamin', barcode: 'PV-009', description: null, basePriceKgs: 2000, categoryId: 'c4', images: [], category: { id: 'c4', name: 'Multivitamin', slug: 'multivitamin', iconEmoji: '🏋️' } },
];

/* ─── Computed ─── */
const displaySlides = computed(() => slides.value.length > 0 ? slides.value : SLIDE_FALLBACKS);
const displayCategories = computed(() => categories.value.length > 0 ? categories.value : CAT_FALLBACKS);
const displayProducts = computed(() => {
  const raw = products.value.length > 0 ? products.value : MOCK_PRODUCTS;
  const list = Array.isArray(raw) ? raw : [];
  const safe = list.filter(p => p && p.id && p.name);
  if (!activeCategory.value) return safe;
  return safe.filter(p => p.categoryId === activeCategory.value);
});

/* ─── Fetch ─── */
const fetchAll = async () => {
  productsLoading.value = true;
  try {
    const [pRes, cRes, sRes] = await Promise.all([
      axios.get('/api/v1/products').catch(() => ({ data: [] })),
      axios.get('/api/v1/categories').catch(() => ({ data: [] })),
      axios.get('/api/v1/slides').catch(() => ({ data: [] })),
    ]);
    products.value = Array.isArray(pRes.data) ? pRes.data : [];
    categories.value = Array.isArray(cRes.data) ? cRes.data : [];
    slides.value = Array.isArray(sRes.data) ? sRes.data : [];
  } catch (err) { console.error('Fetch products err:', err); }
  productsLoading.value = false;
  
  // Fetch Site Settings
  try {
    const settingsRes = await axios.get('/api/v1/settings');
    if (settingsRes.data) {
      siteSettings.value = {
        logoUrl: settingsRes.data.logoUrl || '',
        topbarShippingMsg: settingsRes.data.topbarShippingMsg || siteSettings.value.topbarShippingMsg,
        topbarPhone: settingsRes.data.topbarPhone || siteSettings.value.topbarPhone,
        trustBadges: Array.isArray(settingsRes.data.trustBadges) && settingsRes.data.trustBadges.length > 0 ? settingsRes.data.trustBadges : [
          { id: 1, icon: '🚚', title: 'Hızlı Kargo', desc: '1-3 iş günü teslimat', isActive: true },
          { id: 2, icon: '🔒', title: 'Güvenli Ödeme', desc: '256-bit SSL koruması', isActive: true },
          { id: 3, icon: '✅', title: 'Orijinal Ürün', desc: '%100 orijinal garanti', isActive: true },
          { id: 4, icon: '↩️', title: 'Kolay İade', desc: '14 gün iade hakkı', isActive: true }
        ],
        partners: Array.isArray(settingsRes.data.partners) && settingsRes.data.partners.length > 0 ? settingsRes.data.partners : [
          { id: 1, name: 'Wildberries', isActive: true },
          { id: 2, name: 'Ozon', isActive: true },
          { id: 3, name: 'Kaspi', isActive: true },
          { id: 4, name: 'Lamoda', isActive: true },
          { id: 5, name: 'Lalafo', isActive: true }
        ],
        footerLinks: Array.isArray(settingsRes.data.footerLinks) ? settingsRes.data.footerLinks : [],
        copyrightText: settingsRes.data.copyrightText || siteSettings.value.copyrightText
      };
    }
  } catch (err) { console.error('Fetch settings err:', err); }
};

/* ─── Auth ─── */
const checkAuth = () => {
  if (localStorage.getItem('token')) {
    isLoggedIn.value = true;
    userRole.value = localStorage.getItem('role') || 'customer';
  }
};
const logout = () => { localStorage.clear(); isLoggedIn.value = false; };
const goPanel = () => {
  if (userRole.value === 'admin') router.push('/admin');
  else if (userRole.value === 'distributor') router.push('/dashboard');
};

/* ─── Slider ─── */
const nextSlide = () => { currentSlide.value = (currentSlide.value + 1) % displaySlides.value.length; };
const prevSlide = () => { currentSlide.value = (currentSlide.value - 1 + displaySlides.value.length) % displaySlides.value.length; };

/* ─── Cart ─── */
const addToCart = (p: Product) => {
  const saved = localStorage.getItem('pv_cart');
  let cart: any[] = saved ? JSON.parse(saved) : [];
  const existing = cart.find((c: any) => c.productId === p.id);
  if (existing) { existing.quantity++; } else {
    cart.push({ productId: p.id, name: p.name, price: Number(p.basePriceKgs), quantity: 1, image: getImg(p) });
  }
  localStorage.setItem('pv_cart', JSON.stringify(cart));
  cartCount.value = cart.reduce((s: number, c: any) => s + c.quantity, 0);
};
const goCheckout = () => router.push('/checkout');

/* ─── Helpers ─── */
const fmtPrice = (n: number) => Math.round(Number(n)).toLocaleString('ru-RU') + ' сом';
const getImg = (p: Product) => {
  if (p.images?.length > 0) return p.images[0].imageUrl;
  return PRODUCT_IMAGES[p.barcode] || '';
};
const onImgError = (id: string) => { imgErrors.value[id] = true; };
const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
const handleSlideBtn = (link: string | null) => {
  if (!link) return;
  if (link.startsWith('#')) scrollTo(link.slice(1));
  else router.push(link);
};

/* pseudo-random but stable rating per product */
const rating = (id: string) => {
  if (!id) return 50;
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return 40 + (hash % 80);
};

onMounted(() => { checkAuth(); fetchAll(); fetchMlmStatus(); slideTimer = setInterval(nextSlide, 5500); });
onUnmounted(() => { if (slideTimer) clearInterval(slideTimer); });
</script>

<template>
<div class="sv">

  <!-- ====== TOP RIBBON ====== -->
  <div class="sv-ribbon">
    <div class="wrap ribbon-inner">
      <span v-html="siteSettings.topbarShippingMsg"></span>
      <span class="ribbon-phone" v-html="siteSettings.topbarPhone"></span>
    </div>
  </div>

  <!-- ====== NAVBAR ====== -->
  <nav class="sv-nav">
    <div class="wrap nav-row">
      <router-link to="/" class="nav-brand">
        <img v-if="siteSettings.logoUrl" :src="siteSettings.logoUrl" alt="Power Vital — Logo" class="nav-logo-img" />
        <template v-else>Power<span>Vital</span></template>
      </router-link>
      <div class="nav-links">
        <a @click.prevent="scrollTo('products')">Ürünler</a>
        <router-link to="/about">Hakkımızda</router-link>
        <a v-if="isMlmEnabled" @click.prevent="scrollTo('opportunity')">İş Fırsatı</a>
        <router-link to="/contact">İletişim</router-link>
      </div>
      <div class="nav-right">
        <button class="nav-cart" @click="goCheckout">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          <i v-if="cartCount" class="cart-dot">{{ cartCount }}</i>
        </button>
        <template v-if="isLoggedIn">
          <button class="nb nb-outline" @click="goPanel">Panelim</button>
          <button class="nb nb-ghost" @click="logout">Çıkış</button>
        </template>
        <template v-else>
          <router-link to="/login" class="nb nb-ghost">Giriş</router-link>
          <router-link to="/register" class="nb nb-fill">Distribütör Ol</router-link>
        </template>
      </div>
    </div>
  </nav>

  <!-- ====== HERO SLIDER ====== -->
  <section class="sv-hero">
    <div class="hero-track">
      <div v-for="(s, i) in displaySlides" :key="s.id"
           class="hero-item" :class="{ on: i === currentSlide }">
        <!-- background image with gradient overlay baked in -->
        <div class="hero-bg" :style="{ backgroundImage: `linear-gradient(105deg, rgba(0,0,0,.52) 0%, rgba(0,0,0,.10) 65%), url(${s.imageUrl})` }"></div>
        <div class="wrap hero-body">
          <h1>{{ s.title }}</h1>
          <p v-if="s.subtitle">{{ s.subtitle }}</p>
          <button v-if="s.buttonText" class="nb nb-fill nb-lg" @click="handleSlideBtn(s.buttonLink)">{{ s.buttonText }} →</button>
        </div>
      </div>
    </div>
    <button class="arr arr-l" @click="prevSlide" aria-label="Prev">‹</button>
    <button class="arr arr-r" @click="nextSlide" aria-label="Next">›</button>
    <div class="dots">
      <button v-for="(_, i) in displaySlides" :key="i" :class="{ on: i === currentSlide }" @click="currentSlide = i"></button>
    </div>
  </section>

  <!-- ====== CATEGORIES ====== -->
  <section class="sv-cats">
    <div class="wrap cats-scroll">
      <button class="cat-chip" :class="{ on: !activeCategory }" @click="activeCategory = null">🛒 Tümü</button>
      <button v-for="c in displayCategories" :key="c.id" class="cat-chip" :class="{ on: activeCategory === c.id }" @click="activeCategory = c.id">
        {{ c.iconEmoji }} {{ c.name }}
      </button>
    </div>
  </section>

  <!-- ====== PRODUCTS ====== -->
  <section class="sv-products" id="products">
    <div class="wrap">
      <div class="sec-head">
        <h2>Ürünlerimiz</h2>
        <p>Bilimsel formüllerle desteklenen, kaliteli hammaddelerden üretilen premium ürünler.</p>
      </div>

      <!-- Skeleton Loaders -->
      <div v-if="productsLoading" class="pgrid">
        <div v-for="n in 8" :key="n" class="skel-card">
          <div class="skel skel-img"></div>
          <div class="skel-body">
            <div class="skel skel-line w70"></div>
            <div class="skel skel-line w40"></div>
            <div class="skel skel-line w50"></div>
          </div>
        </div>
      </div>

      <!-- Real Grid -->
      <div v-else class="pgrid">
        <div v-for="p in displayProducts" :key="p.id" class="pcard">
          <div class="pcard-img">
            <!-- Fallback color if image errors -->
            <div v-if="imgErrors[p.id]" class="pcard-img-fallback">
              <span>{{ p.name.charAt(0) }}</span>
            </div>
            <img v-else :src="getImg(p)" :alt="p.name" loading="lazy" @error="onImgError(p.id)" />
            <span class="pcard-tag" v-if="p.category">{{ p.category.name }}</span>
          </div>
          <div class="pcard-body">
            <h3>{{ p.name }}</h3>
            <div class="pcard-stars">
              <span class="stars-fill">★★★★★</span>
              <span class="stars-count">({{ rating(p.id) }})</span>
            </div>
            <div class="pcard-foot">
              <b class="pcard-price">{{ fmtPrice(p.basePriceKgs) }}</b>
              <button class="nb nb-fill nb-sm" @click="addToCart(p)">+ Sepete Ekle</button>
            </div>
          </div>
        </div>
      </div>

      <p v-if="!productsLoading && displayProducts.length === 0" class="empty-note">Bu kategoride ürün bulunmamaktadır.</p>
    </div>
  </section>

  <!-- ====== TRUST BAR ====== -->
  <section class="sv-trust" v-if="siteSettings.trustBadges && siteSettings.trustBadges.filter(b => b.isActive).length > 0">
    <div class="wrap trust-row">
      <div v-for="badge in siteSettings.trustBadges.filter(b => b.isActive)" :key="badge.id" class="trust-pill">
        <span>{{ badge.icon }}</span>
        <div><b>{{ badge.title }}</b><small>{{ badge.desc }}</small></div>
      </div>
    </div>
  </section>

  <!-- ====== MARKETPLACE BANNER ====== -->
  <section class="sv-mp" v-if="siteSettings.partners && siteSettings.partners.filter(p => p.isActive).length > 0">
    <div class="wrap mp-inner">
      <small>ÇOK KANALLI ENTEGRE OPERASYON AĞI</small>
      <div class="mp-row">
        <template v-for="partner in siteSettings.partners.filter(p => p.isActive)" :key="partner.id">
          <a v-if="partner.link" :href="partner.link" target="_blank" class="partner-link">
            <img v-if="partner.logoUrl" :src="partner.logoUrl" :alt="partner.name" class="partner-logo" />
            <em v-else>{{ partner.name }}</em>
          </a>
          <div v-else class="partner-item">
            <img v-if="partner.logoUrl" :src="partner.logoUrl" :alt="partner.name" class="partner-logo" />
            <em v-else>{{ partner.name }}</em>
          </div>
        </template>
      </div>
    </div>
  </section>

  <!-- ====== OPPORTUNITY (MLM only) ====== -->
  <section class="sv-opp" id="opportunity" v-if="isMlmEnabled">
    <div class="wrap">
      <div class="sec-head">
        <h2>İş Fırsatı — Neden Power Vital?</h2>
        <p>Distribütör olun, ilk gününüzden itibaren kazanmaya başlayın.</p>
      </div>
      <div class="opp-grid">
        <div class="opp-card">
          <div class="opp-ico">⚡</div>
          <h3>Hızlı Nakit Akışı</h3>
          <p>Her satıştan anında <b>%50 perakende kârı</b>. Sipariş girildiği saniye hesaplanır.</p>
        </div>
        <div class="opp-card">
          <div class="opp-ico">🛡️</div>
          <h3>%30 Güvenlik Kilidi</h3>
          <p>Toplam gelir asla %30'u aşmaz. <b>Matematiksel garantiyle</b> sistem asla tıkanmaz.</p>
        </div>
        <div class="opp-card">
          <div class="opp-ico">♻️</div>
          <h3>Puan Devri (Carry-over)</h3>
          <p>Emeğiniz yanmaz. <b>Eşleşmeyen puanlar sonraki haftaya otomatik devredilir.</b></p>
        </div>
      </div>
      <div class="opp-cta"><router-link to="/register" class="nb nb-fill nb-lg">🚀 Hemen Distribütör Ol</router-link></div>
    </div>
  </section>

  <!-- ====== FOOTER ====== -->
  <footer class="sv-footer">
    <div class="wrap ft-grid">
      <div class="ft-col">
        <div class="ft-brand">Power<span>Vital</span></div>
        <p class="ft-tag">Otonom Sağlık & İş Fırsatı Platformu</p>
      </div>
      <div class="ft-col">
        <h4>Sayfalar</h4>
        <router-link to="/">Ana Sayfa</router-link>
        <router-link to="/about">Hakkımızda</router-link>
        <router-link to="/contact">İletişim</router-link>
      </div>
      <div class="ft-col">
        <h4>Hızlı Linkler</h4>
        <a v-for="link in siteSettings.footerLinks" :key="link.id" :href="link.url">{{ link.title }}</a>
      </div>
      <div class="ft-col">
        <h4>İletişim</h4>
        <span>📍 Bişkek, Kırgızistan</span>
        <span v-html="siteSettings.topbarPhone"></span>
        <span>✉️ info@powervital.kg</span>
      </div>
    </div>
    <div class="ft-bottom"><div class="wrap ft-bottom-row">{{ siteSettings.copyrightText }} <router-link to="/login" class="admin-icon" title="Yönetim">⚙</router-link></div></div>
  </footer>
</div>
</template>

<style scoped>
/* ══════════════════════════════════════════════════════════
   POWER VITAL — CLEAN COMMERCE (Antigravity / Shopify Grade)
   Ultra-lightweight: 0 JS animation libs, pure CSS transitions
   ══════════════════════════════════════════════════════════ */
.sv {
  --c-bg: #ffffff;
  --c-bg2: #f7f7f8;
  --c-bdr: #eaeaec;
  --c-txt: #18181b;
  --c-txt2: #52525b;
  --c-txt3: #a1a1aa;
  --c-grn: #16a34a;
  --c-grn-bg: #f0fdf4;
  --r: 10px;
  --sh: 0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.06);
  --tr: all .2s ease;
  min-height: 100vh; width: 100vw;
  background: var(--c-bg); color: var(--c-txt);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  overflow-x: hidden; overflow-y: auto;
  -webkit-font-smoothing: antialiased; line-height: 1.55;
}
.wrap { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

/* ── Buttons ── */
.nb { display: inline-flex; align-items: center; gap: 5px; padding: 9px 18px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; text-decoration: none; transition: var(--tr); white-space: nowrap; }
.nb-fill { background: var(--c-txt); color: #fff; }
.nb-fill:hover { background: var(--c-grn); }
.nb-outline { background: transparent; border: 1.5px solid var(--c-bdr); color: var(--c-txt); }
.nb-outline:hover { border-color: var(--c-txt); }
.nb-ghost { background: transparent; color: var(--c-txt2); }
.nb-ghost:hover { color: var(--c-txt); }
.nb-sm { padding: 7px 13px; font-size: 12px; }
.nb-lg { padding: 14px 30px; font-size: 15px; }

/* ── Ribbon ── */
.sv-ribbon { background: var(--c-txt); color: #fff; font-size: 12px; padding: 7px 0; }
.ribbon-inner { display: flex; justify-content: space-between; align-items: center; }
.ribbon-inner b { color: #fff; }
.ribbon-phone { opacity: .7; }

/* ── Navbar ── */
.sv-nav { position: sticky; top: 0; z-index: 200; background: rgba(255,255,255,.96); backdrop-filter: blur(10px); border-bottom: 1px solid var(--c-bdr); }
.nav-row { display: flex; align-items: center; justify-content: space-between; height: 62px; }
.nav-brand { text-decoration: none; font-size: 21px; font-weight: 800; color: var(--c-txt); letter-spacing: -.4px; }
.nav-brand span { color: var(--c-grn); }
.nav-logo-img { height: 36px; display: block; }
.nav-links { display: flex; gap: 26px; }
.nav-links a { color: var(--c-txt2); text-decoration: none; font-size: 14px; font-weight: 500; cursor: pointer; transition: color .15s; }
.nav-links a:hover { color: var(--c-txt); }
.nav-right { display: flex; align-items: center; gap: 8px; }
.nav-cart { position: relative; background: none; border: none; color: var(--c-txt); cursor: pointer; padding: 7px; }
.cart-dot { position: absolute; top: 0; right: -2px; min-width: 17px; height: 17px; background: var(--c-grn); color: #fff; font-size: 10px; font-weight: 700; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-style: normal; }

/* ── Hero ── */
.sv-hero { position: relative; width: 100%; max-height: 500px; height: 56vw; min-height: 320px; overflow: hidden; background: #e4e4e7; }
.hero-track { position: relative; width: 100%; height: 100%; }
.hero-item { position: absolute; inset: 0; opacity: 0; transition: opacity .7s ease; pointer-events: none; }
.hero-item.on { opacity: 1; z-index: 1; pointer-events: auto; }
.hero-bg { position: absolute; inset: 0; background-size: cover; background-position: center; }
.hero-body { position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; justify-content: center; max-width: 520px; color: #fff; }
.hero-body h1 { font-size: clamp(24px, 4.5vw, 42px); font-weight: 800; line-height: 1.15; margin-bottom: 14px; letter-spacing: -.3px; text-shadow: 0 2px 16px rgba(0,0,0,.18); }
.hero-body p { font-size: 15px; color: rgba(255,255,255,.88); margin-bottom: 24px; line-height: 1.6; }
.arr { position: absolute; top: 50%; transform: translateY(-50%); z-index: 10; width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,.85); border: none; font-size: 22px; color: #333; cursor: pointer; transition: var(--tr); box-shadow: var(--sh); }
.arr:hover { background: #fff; }
.arr-l { left: 16px; } .arr-r { right: 16px; }
.dots { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); z-index: 10; display: flex; gap: 7px; }
.dots button { width: 9px; height: 9px; border-radius: 50%; background: rgba(255,255,255,.45); border: none; cursor: pointer; transition: var(--tr); padding: 0; }
.dots button.on { background: #fff; transform: scale(1.35); }

/* ── Categories ── */
.sv-cats { padding: 20px 0; border-bottom: 1px solid var(--c-bdr); }
.cats-scroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; -ms-overflow-style: none; scrollbar-width: none; }
.cats-scroll::-webkit-scrollbar { display: none; }
.cat-chip { display: flex; align-items: center; gap: 5px; padding: 9px 18px; border-radius: 50px; border: 1.5px solid var(--c-bdr); background: var(--c-bg); font-size: 13px; font-weight: 500; cursor: pointer; transition: var(--tr); white-space: nowrap; color: var(--c-txt2); }
.cat-chip:hover { border-color: var(--c-txt3); color: var(--c-txt); }
.cat-chip.on { background: var(--c-txt); color: #fff; border-color: var(--c-txt); }

/* ── Section Headers ── */
.sec-head { text-align: center; margin-bottom: 36px; }
.sec-head h2 { font-size: clamp(20px, 3vw, 30px); font-weight: 700; letter-spacing: -.2px; margin-bottom: 6px; }
.sec-head p { font-size: 14px; color: var(--c-txt2); max-width: 480px; margin: 0 auto; }

/* ── Product Grid ── */
.sv-products { padding: 52px 0; }
.pgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 18px; }

/* Skeleton */
.skel-card { border: 1px solid var(--c-bdr); border-radius: var(--r); overflow: hidden; }
.skel { background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite; border-radius: 4px; }
.skel-img { aspect-ratio: 1/1; }
.skel-body { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.skel-line { height: 14px; }
.w70 { width: 70%; } .w40 { width: 40%; } .w50 { width: 50%; }
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* Product Card */
.pcard { border: 1px solid var(--c-bdr); border-radius: var(--r); overflow: hidden; background: var(--c-bg); transition: var(--tr); }
.pcard:hover { box-shadow: 0 6px 20px rgba(0,0,0,.07); transform: translateY(-3px); }
.pcard-img { position: relative; aspect-ratio: 1/1; overflow: hidden; background: var(--c-bg2); }
.pcard-img img { width: 100%; height: 100%; object-fit: cover; transition: transform .35s ease; display: block; }
.pcard:hover .pcard-img img { transform: scale(1.04); }
.pcard-img-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #d1fae5, #ecfdf5); }
.pcard-img-fallback span { font-size: 48px; font-weight: 800; color: var(--c-grn); opacity: .3; }
.pcard-tag { position: absolute; top: 10px; left: 10px; padding: 3px 10px; background: var(--c-grn-bg); color: var(--c-grn); font-size: 11px; font-weight: 600; border-radius: 4px; }
.pcard-body { padding: 14px 16px 16px; }
.pcard-body h3 { font-size: 14px; font-weight: 600; line-height: 1.4; margin-bottom: 6px; min-height: 39px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.pcard-stars { display: flex; align-items: center; gap: 5px; margin-bottom: 10px; }
.stars-fill { color: #f59e0b; font-size: 13px; letter-spacing: 1px; }
.stars-count { font-size: 12px; color: var(--c-txt3); }
.pcard-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.pcard-price { font-size: 17px; font-weight: 700; color: var(--c-txt); }
.empty-note { text-align: center; padding: 48px 0; color: var(--c-txt3); }

/* ── Trust Bar ── */
.sv-trust { padding: 36px 0; background: var(--c-bg2); border-top: 1px solid var(--c-bdr); border-bottom: 1px solid var(--c-bdr); }
.trust-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.trust-pill { display: flex; align-items: center; gap: 12px; }
.trust-pill > span { font-size: 26px; }
.trust-pill b { font-size: 13px; display: block; }
.trust-pill small { font-size: 12px; color: var(--c-txt3); }

/* ── Marketplace ── */
.sv-mp { padding: 28px 0; border-bottom: 1px solid var(--c-bdr); }
.mp-inner { text-align: center; }
.mp-inner small { font-size: 10px; letter-spacing: 2.5px; color: var(--c-txt3); font-weight: 600; }
.mp-row { display: flex; justify-content: center; align-items: center; gap: 36px; margin-top: 14px; flex-wrap: wrap; }
.mp-row em { font-style: normal; font-size: 17px; font-weight: 700; color: var(--c-bdr); letter-spacing: .5px; text-transform: uppercase; }
.partner-logo { max-height: 40px; max-width: 120px; object-fit: contain; filter: grayscale(100%) opacity(0.6); transition: var(--tr); }
.partner-link:hover .partner-logo { filter: grayscale(0%) opacity(1); }
.partner-link { text-decoration: none; display: flex; align-items: center; justify-content: center; }

/* ── Opportunity ── */
.sv-opp { padding: 64px 0; }
.opp-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap: 20px; margin-bottom: 36px; }
.opp-card { padding: 28px 22px; border: 1px solid var(--c-bdr); border-radius: var(--r); text-align: center; transition: var(--tr); }
.opp-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,.06); transform: translateY(-2px); }
.opp-ico { font-size: 34px; margin-bottom: 14px; }
.opp-card h3 { font-size: 17px; margin-bottom: 8px; }
.opp-card p { font-size: 13px; color: var(--c-txt2); line-height: 1.65; }
.opp-card b { color: var(--c-txt); }
.opp-cta { text-align: center; }

/* ── Footer ── */
.sv-footer { padding: 48px 0 0; background: var(--c-bg2); border-top: 1px solid var(--c-bdr); }
.ft-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1.5fr; gap: 32px; }
.ft-brand { font-size: 19px; font-weight: 800; margin-bottom: 6px; }
.ft-brand span { color: var(--c-grn); }
.ft-tag { font-size: 12px; color: var(--c-txt3); }
.ft-col h4 { font-size: 13px; font-weight: 700; margin-bottom: 12px; text-transform: uppercase; letter-spacing: .5px; color: var(--c-txt); }
.ft-col a, .ft-col span { display: block; font-size: 13px; color: var(--c-txt2); text-decoration: none; margin-bottom: 7px; transition: color .15s; }
.ft-col a:hover { color: var(--c-grn); }
.ft-bottom { margin-top: 32px; padding: 16px 0; border-top: 1px solid var(--c-bdr); text-align: center; font-size: 12px; color: var(--c-txt3); }

/* ── Responsive ── */
@media(max-width:768px){
  .ribbon-phone { display: none; }
  .nav-links { display: none; }
  .nav-right .nb { display: none; }
  .sv-hero { max-height: 360px; }
  .hero-body h1 { font-size: 22px; }
  .pgrid { grid-template-columns: repeat(2,1fr); gap: 10px; }
  .pcard-foot { flex-direction: column; align-items: stretch; }
  .pcard-price { text-align: center; }
  .pcard-foot .nb { width: 100%; justify-content: center; }
  .trust-row { grid-template-columns: repeat(2,1fr); }
  .ft-grid { grid-template-columns: 1fr 1fr; }
}
@media(max-width:480px){
  .pgrid { grid-template-columns: 1fr 1fr; gap: 8px; }
  .pcard-body { padding: 10px 12px 14px; }
  .pcard-body h3 { font-size: 12px; min-height: 34px; }
  .pcard-price { font-size: 14px; }
  .trust-row { grid-template-columns: 1fr; }
  .ft-grid { grid-template-columns: 1fr; }
}

/* Admin icon & footer bottom */
.ft-bottom-row { display: flex; justify-content: space-between; align-items: center; }
.admin-icon { text-decoration: none; font-size: 14px; color: var(--c-txt3); opacity: .35; transition: opacity .2s; }
.admin-icon:hover { opacity: .7; }
</style>
