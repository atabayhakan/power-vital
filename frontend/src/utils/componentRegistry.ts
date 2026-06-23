import { defineAsyncComponent, h, type Component } from 'vue';

const ErrorComponent = {
  render: () => h('div', {
    class: 'component-missing',
    style: 'padding:20px; text-align:center; color:#ef4444; border:1px dashed #ef4444;'
  }, 'Bileşen Yüklenemedi')
};

const LoadingComponent = {
  render: () => h('div', { class: 'skeleton', style: 'height:150px; width:100%; border-radius:12px;' })
};

const safeAsync = (loader: () => Promise<any>, blockType: string) => defineAsyncComponent({
  loader,
  loadingComponent: LoadingComponent,
  errorComponent: ErrorComponent,
  delay: blockType === 'hero_slider_block' ? 0 : 200,
  timeout: 15000,
  suspensible: false
});

// CartSettings alias'ı için placeholder bileşen (Sepet ayarları CMS paneli)
// Gerçek SideCart settings buraya bağlanabilir; MVP için bilgilendirme kartı gösterir
const CartSettingsBlock = {
  name: 'CartSettingsBlock',
  render: () => h('div', {
    class: 'cart-settings-placeholder clay-surface',
    style: 'padding:32px; text-align:center;'
  }, [
    h('h3', { style: 'margin:0 0 8px 0; color:#BC4A3C;' }, '🛒 Sepet (SideCart) Ayarları'),
    h('p', { style: 'color:#52525b; margin:0; font-size:14px;' }, 'Bu blok aktif. Yan panelden ayarları düzenleyin (free shipping limit, upsell önerisi vb.)')
  ])
};

export const componentRegistry: Record<string, Component> = {
  'hero_slider': safeAsync(() => import('../components/blocks/HeroSliderBlock.vue'), 'hero_slider'),
  'hero_slider_block': safeAsync(() => import('../components/blocks/HeroSliderBlock.vue'), 'hero_slider_block'),
  'categories': safeAsync(() => import('../components/blocks/CategoryGridBlock.vue'), 'categories'),
  'categorygridblock': safeAsync(() => import('../components/blocks/CategoryGridBlock.vue'), 'categorygridblock'),
  'featured_products': safeAsync(() => import('../components/blocks/ProductGridBlock.vue'), 'featured_products'),
  'productgridblock': safeAsync(() => import('../components/blocks/ProductGridBlock.vue'), 'productgridblock'),
  'deal_of_the_day': safeAsync(() => import('../components/blocks/PromoBanner.vue'), 'deal_of_the_day'),
  'promobanner': safeAsync(() => import('../components/blocks/PromoBanner.vue'), 'promobanner'),
  'trust_badges': safeAsync(() => import('../components/blocks/ReviewSection.vue'), 'trust_badges'),
  'testimonials': safeAsync(() => import('../components/blocks/ReviewSection.vue'), 'testimonials'),
  'reviewsection': safeAsync(() => import('../components/blocks/ReviewSection.vue'), 'reviewsection'),
  'navbar': safeAsync(() => import('../components/GlobalNavbar.vue'), 'navbar'),
  'globalnavbar': safeAsync(() => import('../components/GlobalNavbar.vue'), 'globalnavbar'),
  'cross_sell': safeAsync(() => import('../components/blocks/CrossSellGrid.vue'), 'cross_sell'),
  'crosssellgrid': safeAsync(() => import('../components/blocks/CrossSellGrid.vue'), 'crosssellgrid'),
  'product_showcase': safeAsync(() => import('../components/blocks/ProductShowcase.vue'), 'product_showcase'),
  'productshowcase': safeAsync(() => import('../components/blocks/ProductShowcase.vue'), 'productshowcase'),
  'certificates': safeAsync(() => import('../components/blocks/CertificatesBlock.vue'), 'certificates'),
  'sertifikalar': safeAsync(() => import('../components/blocks/CertificatesBlock.vue'), 'sertifikalar'),
  'certificatesblock': safeAsync(() => import('../components/blocks/CertificatesBlock.vue'), 'certificatesblock'),

  'partners': safeAsync(() => import('../components/blocks/PartnersBlock.vue'), 'partners'),
  'partnersblock': safeAsync(() => import('../components/blocks/PartnersBlock.vue'), 'partnersblock'),

  // 🛒 CART_SETTINGS FIX — PascalCase + kebab-case + snake-case alias'lar
  'CartSettings': CartSettingsBlock,
  'cart_settings': CartSettingsBlock,
  'cartsettings': CartSettingsBlock,
  'sidecart': CartSettingsBlock,
  'side_cart': CartSettingsBlock
};

const _warnedIds = new Set<string>();
export const resolveComponent = (id: string) => {
  if (!id) return null;
  const normalizedId = id.toLowerCase().replace(/-/g, '_');
  const resolved = componentRegistry[normalizedId] || null;

  if (!resolved && !_warnedIds.has(id)) {
    console.warn(`[ComponentRegistry] Missing component: "${id}" (normalized: "${normalizedId}")`);
    _warnedIds.add(id);
  }

  return resolved;
};
