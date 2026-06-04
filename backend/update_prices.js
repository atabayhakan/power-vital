const { PrismaClient } = require('./prisma/generated/client');
const prisma = new PrismaClient();

async function updatePrices() {
  await prisma.product.updateMany({
    data: {
      basePriceKgs: 2000,
      basePriceUsd: 2000 / 87.45
    }
  });
  console.log('All product prices updated to 2000 KGS!');
}

updatePrices().finally(() => prisma.$disconnect());
