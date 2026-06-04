const { PrismaClient } = require('./prisma/generated/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding Clean Commerce data...');

  // 1. Categories
  const categories = [
    { name: 'Takviye Gıda', slug: 'takviye-gida', iconEmoji: '💊', sortOrder: 1 },
    { name: 'Cilt Bakım', slug: 'cilt-bakim', iconEmoji: '✨', sortOrder: 2 },
    { name: 'Saç Bakım', slug: 'sac-bakim', iconEmoji: '💇', sortOrder: 3 },
    { name: 'Multivitamin', slug: 'multivitamin', iconEmoji: '🏋️', sortOrder: 4 },
  ];
  
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat
    });
  }
  console.log('✅ Categories seeded');

  // 2. Assign categories to existing products
  const catMap = {};
  const allCats = await prisma.category.findMany();
  for (const c of allCats) { catMap[c.slug] = c.id; }

  const productCategoryMap = {
    'PV-001': 'takviye-gida',    // Magnezyum
    'PV-002': 'takviye-gida',    // Karadut
    'PV-003': 'takviye-gida',    // Omega 3
    'PV-004': 'takviye-gida',    // Kolajen Peptit
    'PV-005': 'takviye-gida',    // Çörek Otu Yağı
    'PV-006': 'cilt-bakim',      // Kolajen Serum
    'PV-007': 'sac-bakim',       // Şampuan
    'PV-008': 'multivitamin',    // Men Care
    'PV-009': 'multivitamin',    // Women Care
  };

  for (const [barcode, catSlug] of Object.entries(productCategoryMap)) {
    try {
      await prisma.product.update({
        where: { barcode },
        data: { categoryId: catMap[catSlug] }
      });
    } catch (e) { /* skip if product missing */ }
  }
  console.log('✅ Products assigned to categories');

  // 3. Add product images
  const productImageMap = {
    'PV-001': ['https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/b0668799-333b-4bd0-9c9b-508ed5ed5ff3/1080/magnezyum-calisma-yuzeyi-1.webp'],
    'PV-002': ['https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/abdf396c-433e-4dc4-ae67-5c43f805b42d/1080/karadut-01.webp'],
    'PV-003': ['https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/33ad56e8-87bc-4af9-b202-1a893bdea410/1080/omega30.webp'],
    'PV-004': ['https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/ed4f5687-ff5d-44bc-b225-5dd384d7f20b/1080/yynlkmcyhujkqszb-jpg.webp'],
    'PV-005': ['https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/17011374-c4da-4a0f-aa6c-7719c32fe704/1080/corekotu-calisma-yuzeyi-1.webp'],
    'PV-006': ['https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/a3353538-88ec-4644-a34d-85b7f2d0296b/1080/kolajen-calisma-yuzeyi-1.webp'],
    'PV-007': ['https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/89c5c8bc-e202-4830-8de5-633e973aed21/1080/kolajen-ardis-sampuan.webp'],
    'PV-008': ['https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/274e1ec7-1f90-4c42-9741-9762b4038f8b/1080/men-care-1.webp'],
    'PV-009': ['https://cdn.myikas.com/images/c7afacdb-7cce-47a1-8553-35d2c163884c/37d23687-6abb-4cf3-9ce2-1bc46818be42/1080/women-care-1.webp'],
  };

  for (const [barcode, urls] of Object.entries(productImageMap)) {
    try {
      const product = await prisma.product.findUnique({ where: { barcode } });
      if (!product) continue;
      const existing = await prisma.productImage.count({ where: { productId: product.id } });
      if (existing > 0) continue; // Don't duplicate
      for (let i = 0; i < urls.length; i++) {
        await prisma.productImage.create({
          data: { productId: product.id, imageUrl: urls[i], sortOrder: i }
        });
      }
    } catch (e) { /* skip */ }
  }
  console.log('✅ Product images seeded');

  // 4. Hero Slides
  const existingSlides = await prisma.heroSlide.count();
  if (existingSlides === 0) {
    await prisma.heroSlide.createMany({
      data: [
        {
          title: 'Sağlığınıza Yatırım Yapın',
          subtitle: 'Bilim destekli premium takviye gıdalar ile daha güçlü bir yaşam.',
          buttonText: 'Ürünleri Keşfet',
          buttonLink: '#products',
          imageUrl: 'https://images.unsplash.com/photo-1505576399279-0d754cf06d1d?w=1400&q=80',
          sortOrder: 0,
        },
        {
          title: 'İş Fırsatını Kaçırmayın',
          subtitle: 'Power Vital distribütörü olun, anında kazanmaya başlayın.',
          buttonText: 'Distribütör Ol',
          buttonLink: '/register',
          imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1400&q=80',
          sortOrder: 1,
        },
        {
          title: 'Doğanın Gücü, Bilimin Işığı',
          subtitle: 'Omega 3, Magnezyum, Kolajen — vücudunuzun ihtiyacı olan her şey.',
          buttonText: 'Hemen Alışveriş Yap',
          buttonLink: '#products',
          imageUrl: 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?w=1400&q=80',
          sortOrder: 2,
        },
      ]
    });
    console.log('✅ Hero slides seeded');
  }

  // 5. Site Settings
  const existingSettings = await prisma.siteSettings.findFirst();
  if (!existingSettings) {
    await prisma.siteSettings.create({
      data: {
        companyName: 'Power Vital',
        address: 'Bişkek, Kırgızistan — Çüy Prospekti 123',
        phone: '+996 312 123 456',
        email: 'info@powervital.com.tr',
        mapIframeCode: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2926.123!2d74.5878!3d42.8746!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDLCsDUyJzI4LjUiTiA3NMKwMzUnMTYuMSJF!5e0!3m2!1str!2skg!4v1600000000000" width="100%" height="400" style="border:0;" allowfullscreen="" loading="lazy"></iframe>'
      }
    });
    console.log('✅ Site settings seeded');
  }

  console.log('🎉 All seed data completed!');
  await prisma.$disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
