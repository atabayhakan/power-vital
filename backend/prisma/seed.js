const { PrismaClient } = require('./generated/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Super Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@powervital.kg' },
    update: {},
    create: {
      email: 'admin@powervital.kg',
      name: 'Power Vital Admin',
      passwordHash: adminPassword,
      role: 'admin',
      walletBalanceKgs: 100000.00,
    },
  });
  console.log('Admin:', admin.email);

  // 2. Create a Distributor (Sponsor)
  const distPassword = await bcrypt.hash('dist123', 10);
  const distributor = await prisma.user.upsert({
    where: { email: 'distributor@powervital.kg' },
    update: {},
    create: {
      email: 'distributor@powervital.kg',
      name: 'Nurlan Distributor',
      passwordHash: distPassword,
      role: 'distributor',
      walletBalanceKgs: 5000.00,
    },
  });
  console.log('Distributor:', distributor.email);

  // 3. Create a Cashier
  const cashierPassword = await bcrypt.hash('cashier123', 10);
  const cashier = await prisma.user.upsert({
    where: { email: 'cashier@powervital.kg' },
    update: {},
    create: {
      email: 'cashier@powervital.kg',
      name: 'Mehmet Kasiyer',
      passwordHash: cashierPassword,
      role: 'cashier',
      walletBalanceKgs: 0,
    },
  });
  console.log('Cashier:', cashier.email);

  // 4. Categories
  const categories = [
    { name: 'Kolajen', slug: 'kolajen', iconEmoji: '💎', sortOrder: 1 },
    { name: 'Omega-3', slug: 'omega-3', iconEmoji: '🐟', sortOrder: 2 },
    { name: 'Vitaminler', slug: 'vitaminler', iconEmoji: '💊', sortOrder: 3 },
    { name: 'Mineraller', slug: 'mineraller', iconEmoji: '⚡', sortOrder: 4 },
  ];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }
  console.log('Categories:', categories.length);

  // 5. Products
  const products = [
    {
      barcode: 'PV-COLLAGEN-001',
      name: 'Power Vital Pure Collagen Peptides (300g)',
      description: 'Eklem, cilt ve saç sağlığı için birinci sınıf hidrolize kolajen tozu.',
      basePriceKgs: 3200.00,
      stockQuantity: 150,
      minStockAlert: 20,
    },
    {
      barcode: 'PV-OMEGA-002',
      name: 'Power Vital Omega-3 Balık Yağı (90 Kapsül)',
      description: 'Yüksek EPA/DHA oranlı, saf balık yağı.',
      basePriceKgs: 2100.00,
      stockQuantity: 200,
      minStockAlert: 30,
    },
    {
      barcode: 'PV-MULTIVIT-003',
      name: 'Power Vital Multivitamin Kompleks (60 Tablet)',
      description: 'Günlük enerji ve bağışıklık desteği için tam multivitamin.',
      basePriceKgs: 1850.00,
      stockQuantity: 120,
      minStockAlert: 25,
    },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { barcode: p.barcode },
      update: {},
      create: p,
    });
    const discountedKgs = Number(p.basePriceKgs) * 0.90;
    await prisma.priceRule.upsert({
      where: {
        productId_role: {
          productId: product.id,
          role: 'distributor',
        },
      },
      update: {},
      create: {
        productId: product.id,
        role: 'distributor',
        customPriceKgs: discountedKgs,
      },
    });
  }
  console.log('Products:', products.length);

  // 6. System Config
  const existingConfig = await prisma.systemConfig.findFirst();
  if (!existingConfig) {
    await prisma.systemConfig.create({ data: {} });
  }
  console.log('SystemConfig OK');

  // 8. Site Settings
  const existingSettings = await prisma.siteSettings.findFirst();
  if (!existingSettings) {
    await prisma.siteSettings.create({ data: {} });
  }
  console.log('SiteSettings OK');

  // 9. Hero Slide
  const slideCount = await prisma.heroSlide.count();
  if (slideCount === 0) {
    await prisma.heroSlide.create({
      data: {
        title: 'Power Vital Kırgızistan',
        subtitle: 'Premium Sağlık Takviyeleri',
        buttonText: 'Hemen Keşfet',
        buttonLink: '/katalog',
        imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=1600',
        displayMode: 'WITH_TEXT',
        overlayOpacity: 30,
        sortOrder: 0,
        isActive: true,
      },
    });
  }
  console.log('HeroSlides OK');

  // 10. Weekly Cycle
  const openCycle = await prisma.weeklyCycle.findFirst({ where: { isClosed: false } });
  if (!openCycle) {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    await prisma.weeklyCycle.create({
      data: {
        weekNumber,
        year: now.getFullYear(),
        startDate: now,
      },
    });
  }
  console.log('WeeklyCycle OK');

  console.log('--- SEEDING COMPLETE ---');
  console.log('Login:');
  console.log('  Admin:      admin@powervital.kg / admin123');
  console.log('  Distributor: distributor@powervital.kg / dist123');
  console.log('  Cashier:    cashier@powervital.kg / cashier123');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
