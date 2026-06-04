const fs = require('fs');
const { PrismaClient } = require('./prisma/generated/client');

const prisma = new PrismaClient();

async function importProducts() {
  try {
    const content = fs.readFileSync('C:\\Users\\ataba\\.gemini\\antigravity\\brain\\8fc1446d-21f0-4ceb-a066-2bd0cb44e41c\\.system_generated\\steps\\1142\\content.md', 'utf-8');
    
    // Extract the JSON-LD ItemList
    const match = content.match(/{"@context":"http:\/\/schema\.org","@type":"ItemList","itemListElement":\[.*?\]}/);
    if (!match) {
      throw new Error("Could not find product JSON data in the scraped content.");
    }
    
    const data = JSON.parse(match[0]);
    const items = data.itemListElement;
    
    console.log(`Found ${items.length} products. Inserting into database...`);
    
    for (let i = 0; i < items.length; i++) {
      const product = items[i].item;
      const name = product.name;
      const priceKgs = parseFloat(product.offers.price); // Using TRY price as KGS for MVP
      const priceUsd = priceKgs / 87.45; // Rough USD conversion
      const barcode = `PV-${(i + 1).toString().padStart(3, '0')}`;
      
      const exists = await prisma.product.findUnique({ where: { barcode } });
      if (!exists) {
        await prisma.product.create({
          data: {
            name: name,
            barcode: barcode,
            description: `Resmi siteden aktarıldı. Görsel: ${product.image}`,
            basePriceKgs: priceKgs,
            basePriceUsd: priceUsd,
            stockQuantity: 100,
            minStockAlert: 10
          }
        });
        console.log(`✅ Created: ${name} (${priceKgs} KGS)`);
      } else {
        console.log(`⚠️ Skipped (Already exists): ${name}`);
      }
    }
    
    console.log('All products imported successfully!');
  } catch (err) {
    console.error('Import Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

importProducts();
