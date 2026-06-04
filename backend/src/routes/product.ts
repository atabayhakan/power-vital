import { Router, Request, Response } from 'express';
import { PrismaClient } from '../../prisma/generated/client';

const router = Router();
const prisma = new PrismaClient({});

// GET /api/v1/products - List all products with images and category
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 100;
    const search = req.query.search as string | undefined;
    const categoryId = req.query.categoryId as string | undefined;

    let where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true
      }
    });
    res.json(products);
  } catch (error) {
    console.error('Fetch Products Error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /api/v1/products - Create a new product
router.post('/', async (req: Request, res: Response) => {
  try {
    const { barcode, name, description, basePriceUsd, stockQuantity, categoryId, imageUrls } = req.body;
    
    const exchangeRate = await prisma.exchangeRate.findUnique({
      where: { currency: 'USD' }
    });
    const rateToKgs = exchangeRate ? Number(exchangeRate.rateToKgs) : 89.50;

    const basePriceKgs = Number(basePriceUsd) * rateToKgs;

    const product = await prisma.product.create({
      data: {
        barcode,
        name,
        description,
        basePriceUsd,
        basePriceKgs,
        stockQuantity: stockQuantity || 0,
        categoryId: categoryId || null,
        images: imageUrls ? {
          create: (imageUrls as string[]).map((url: string, i: number) => ({
            imageUrl: url,
            sortOrder: i
          }))
        } : undefined
      },
      include: { images: true, category: true }
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create Product Error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/v1/products/:id - Update product
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { barcode, name, description, basePriceUsd, stockQuantity, categoryId, imageUrls } = req.body;

    const exchangeRate = await prisma.exchangeRate.findUnique({
      where: { currency: 'USD' }
    });
    const rateToKgs = exchangeRate ? Number(exchangeRate.rateToKgs) : 89.50;
    const basePriceKgs = Number(basePriceUsd) * rateToKgs;

    // If imageUrls provided, replace all images
    if (imageUrls) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      await prisma.productImage.createMany({
        data: (imageUrls as string[]).map((url: string, i: number) => ({
          productId: id,
          imageUrl: url,
          sortOrder: i
        }))
      });
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        barcode,
        name,
        description,
        basePriceUsd,
        basePriceKgs,
        stockQuantity,
        categoryId: categoryId || null
      },
      include: { images: true, category: true }
    });

    res.json(product);
  } catch (error) {
    console.error('Update Product Error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/v1/products/:id - Delete product
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete Product Error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
