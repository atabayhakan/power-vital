const { PrismaClient } = require('./prisma/generated/client');
const p = new PrismaClient();

async function update() {
  const r = await p.siteSettings.updateMany({ data: { email: 'info@powervital.kg' } });
  console.log('Updated site email:', r);
  await p.$disconnect();
}
update();
