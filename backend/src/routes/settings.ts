import { Router, Request, Response } from 'express';
import { PrismaClient } from '../../prisma/generated/client';

const router = Router();
const prisma = new PrismaClient({});

// GET /api/v1/settings
router.get('/', async (req: Request, res: Response) => {
  try {
    let settings = await prisma.siteSettings.findFirst();
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: {} });
    }
    res.json(settings);
  } catch (error) {
    console.error('Fetch Settings Error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/v1/settings
router.put('/', async (req: Request, res: Response) => {
  try {
    const { 
      companyName, address, phone, email, mapIframeCode, logoUrl,
      topbarShippingMsg, topbarPhone, trustBadges, partners, footerLinks, copyrightText 
    } = req.body;
    
    let settings = await prisma.siteSettings.findFirst();
    
    const dataToSave = { 
      companyName, address, phone, email, mapIframeCode, logoUrl,
      topbarShippingMsg, topbarPhone, trustBadges, partners, footerLinks, copyrightText
    };

    if (!settings) {
      settings = await prisma.siteSettings.create({ data: dataToSave });
    } else {
      settings = await prisma.siteSettings.update({
        where: { id: settings.id },
        data: dataToSave
      });
    }
    res.json(settings);
  } catch (error) {
    console.error('Update Settings Error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
