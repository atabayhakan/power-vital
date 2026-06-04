"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    // 1. Create Super Admin
    const adminPassword = await bcryptjs_1.default.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@powervital.kg' },
        update: {},
        create: {
            email: 'admin@powervital.kg',
            name: 'Power Vital Admin',
            passwordHash: adminPassword,
            role: client_1.Role.admin,
            walletBalanceKgs: 100000.00,
        },
    });
    // 2. Create a Distributor (Sponsor)
    const distPassword = await bcryptjs_1.default.hash('dist123', 10);
    const distributor = await prisma.user.upsert({
        where: { email: 'distributor@powervital.kg' },
        update: {},
        create: {
            email: 'distributor@powervital.kg',
            name: 'Nurlan Distributor',
            passwordHash: distPassword,
            role: client_1.Role.distributor,
            walletBalanceKgs: 5000.00,
        },
    });
    // 3. Create sample Products
    const products = [
        {
            barcode: 'PV-COLLAGEN-001',
            name: 'Power Vital Pure Collagen Peptides (300g)',
            description: 'Eklem, cilt ve saç sağlığı için birinci sınıf hidrolize kolajen tozu.',
            basePriceKgs: 3200.00,
            basePriceUsd: 38.00,
            stockQuantity: 150,
            minStockAlert: 20
        },
        {
            barcode: 'PV-OMEGA-002',
            name: 'Power Vital Omega-3 Balık Yağı (90 Kapsül)',
            description: 'Yüksek EPA/DHA oranlı, saf balık yağı.',
            basePriceKgs: 2100.00,
            basePriceUsd: 25.00,
            stockQuantity: 200,
            minStockAlert: 30
        }
    ];
    for (const p of products) {
        const product = await prisma.product.upsert({
            where: { barcode: p.barcode },
            update: {},
            create: p,
        });
        // Create special price rule for Distributor (10% discount roughly)
        const discountedKgs = Number(p.basePriceKgs) * 0.90;
        await prisma.priceRule.upsert({
            where: {
                productId_role: {
                    productId: product.id,
                    role: client_1.Role.distributor
                }
            },
            update: {},
            create: {
                productId: product.id,
                role: client_1.Role.distributor,
                customPriceKgs: discountedKgs
            }
        });
    }
    console.log('Seeding complete!');
    console.log('Admin Email:', admin.email);
    console.log('Distributor Email:', distributor.email);
}
main()
    .catch((e) => {
    console.error(e);
})
    .finally(async () => {
    await prisma.$disconnect();
});
