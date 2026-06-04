import { Router, Request, Response } from 'express';
import { PrismaClient } from '../../prisma/generated/client';

const router = Router();
const prisma = new PrismaClient({});

// GET /api/v1/categories
router.get('/', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } }
    });
    res.json(categories);
  } catch (error) {
    console.error('Fetch Categories Error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/v1/categories
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, slug, iconEmoji, imageUrl, sortOrder } = req.body;
    const category = await prisma.category.create({
      data: { name, slug, iconEmoji, imageUrl, sortOrder: sortOrder || 0 }
    });
    res.status(201).json(category);
  } catch (error) {
    console.error('Create Category Error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/v1/categories/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, slug, iconEmoji, imageUrl, sortOrder, isActive } = req.body;
    const id = req.params.id as string;
    const category = await prisma.category.update({
      where: { id },
      data: { name, slug, iconEmoji, imageUrl, sortOrder, isActive }
    });
    res.json(category);
  } catch (error) {
    console.error('Update Category Error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/v1/categories/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error('Delete Category Error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
