import { PrismaClient } from './generated/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding God Mode Admin...');

  const adminEmail = 'atabayhakan@outlook.com';
  const adminPassword = 'PowerVital_Admin2026!';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: passwordHash,
      role: 'admin',
      name: 'Hakan Atabay'
    },
    create: {
      email: adminEmail,
      name: 'Hakan Atabay',
      passwordHash: passwordHash,
      role: 'admin',
      walletBalanceKgs: 999999.00
    },
  });

  console.log(`Success! God Mode Admin created/updated: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
