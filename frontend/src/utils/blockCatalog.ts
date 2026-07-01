// ────────────────────────────────────────────────────────────────────────────
// Block Catalog — single source of truth for the Page Builder's block library.
//
// Each entry describes an *addable* storefront block: its canonical type,
// human-readable name, one-line description, a Feather-style icon (array of SVG
// path `d` strings), the page contexts it belongs to, and the default `data`
// payload used when a fresh instance is added to the canvas.
// ────────────────────────────────────────────────────────────────────────────

export type BuilderPage = 'storefront' | 'product' | 'cart';

export interface BlockDef {
  type: string;            // canonical (normalized) block type
  name: string;            // human-readable name shown in the UI
  description: string;     // one-line explanation
  icon: string[];          // array of SVG <path d="…"> strings (24×24, stroke)
  pages: BuilderPage[];    // which page contexts this block can be added to
  defaultData: Record<string, any>;
  singleton?: boolean;     // if true, only one instance allowed per page
}

export const BLOCK_CATALOG: BlockDef[] = [
  {
    type: 'hero_slider_block',
    name: 'Ana Manşet (Slider)',
    description: 'Tam genişlikte sinematik görsel kaydırıcı',
    icon: [
      'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z',
      'M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
      'M21 15l-5-5L5 21',
    ],
    pages: ['storefront'],
    defaultData: { bgColor: '#16120E' },
    singleton: true,
  },
  {
    type: 'categorygridblock',
    name: 'Kategori Izgarası',
    description: 'Tıklanabilir kategori kartları ızgarası',
    icon: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z'],
    pages: ['storefront'],
    defaultData: { showCategoryText: 'true' },
  },
  {
    type: 'productgridblock',
    name: 'Ürün Izgarası',
    description: 'Çok satan / öne çıkan ürünleri listeler',
    icon: [
      'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
      'M3.27 6.96 12 12.01l8.73-5.05',
      'M12 22.08V12',
    ],
    pages: ['storefront', 'product'],
    defaultData: { title: 'Çok Satan Ürünler', limit: '8', categoryId: '' },
  },
  {
    type: 'promobanner',
    name: 'Promosyon Bandı',
    description: 'Geri sayımlı tek ürün / kampanya bandı (Günün Fırsatı)',
    icon: [
      'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z',
      'M7 7h.01',
    ],
    pages: ['storefront', 'product'],
    defaultData: {
      productName: '', oldPrice: '', newPrice: '', imageUrl: '',
      countdownHours: '24', buttonText: 'Fırsatı Yakala',
    },
  },
  {
    type: 'productshowcase',
    name: 'Ürün Vitrini',
    description: 'Tek ürünü görsel + metinle öne çıkaran bölüm',
    icon: ['M3 3h18v18H3z', 'M3 9h18', 'M9 21V9'],
    pages: ['storefront', 'product'],
    defaultData: { productId: '', productName: '' },
  },
  {
    type: 'crosssellgrid',
    name: 'Çapraz Satış',
    description: 'Birlikte alınan / önerilen ürünler şeridi',
    icon: ['M16 3h5v5', 'M4 20 21 3', 'M21 16v5h-5', 'M15 15l6 6', 'M4 4l5 5'],
    pages: ['storefront', 'product'],
    defaultData: { title: 'Çok Satanlar', limit: '4', categoryId: '' },
  },
  {
    type: 'reviewsection',
    name: 'Müşteri Yorumları',
    description: 'Puanlar ve değerlendirmelerle sosyal kanıt',
    icon: ['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'],
    pages: ['storefront', 'product'],
    defaultData: { allowNew: 'true' },
  },
  {
    type: 'certificatesblock',
    name: 'Sertifikalar',
    description: 'ISO / Helal / FDA gibi güven rozetleri',
    icon: ['M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z', 'M9 12l2 2 4-4'],
    pages: ['storefront', 'product'],
    defaultData: {},
  },
  {
    type: 'partnersblock',
    name: 'Çözüm Ortakları',
    description: 'İş ortağı / marka logoları şeridi',
    icon: [
      'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2',
      'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
      'M23 21v-2a4 4 0 0 0-3-3.87',
      'M16 3.13a4 4 0 0 1 0 7.75',
    ],
    pages: ['storefront'],
    defaultData: {},
  },
  {
    type: 'cart_settings',
    name: 'Sepet Ayarları (Öneri Ürünü)',
    description: 'Yan sepette gösterilecek önerilen ürünü seç',
    icon: [
      'M9 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
      'M20 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
      'M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6',
    ],
    pages: ['cart'],
    defaultData: { upsellProductId: '', upsellProductName: '', upsellProductPrice: '', upsellProductImage: '' },
    singleton: true,
  },
];

// Normalize any stored type alias (kebab/snake/legacy) to its catalog entry.
const ALIASES: Record<string, string> = {
  hero_slider: 'hero_slider_block',
  categories: 'categorygridblock',
  featured_products: 'productgridblock',
  deal_of_the_day: 'promobanner',
  product_showcase: 'productshowcase',
  cross_sell: 'crosssellgrid',
  testimonials: 'reviewsection',
  trust_badges: 'reviewsection',
  certificates: 'certificatesblock',
  sertifikalar: 'certificatesblock',
  partners: 'partnersblock',
  cartsettings: 'cart_settings',
  sidecart: 'cart_settings',
  side_cart: 'cart_settings',
};

export const canonicalType = (type: string): string => {
  const key = (type || '').toLowerCase().replace(/-/g, '_');
  return ALIASES[key] || key;
};

export const getBlockDef = (type: string): BlockDef | undefined => {
  const canon = canonicalType(type);
  return BLOCK_CATALOG.find(b => b.type === canon);
};

export const getBlockName = (type: string): string =>
  getBlockDef(type)?.name || type;

export const getBlockIcon = (type: string): string[] =>
  getBlockDef(type)?.icon || ['M4 4h16v16H4z'];

export const blocksForPage = (page: BuilderPage): BlockDef[] =>
  BLOCK_CATALOG.filter(b => b.pages.includes(page));
