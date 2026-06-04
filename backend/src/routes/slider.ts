import { Router, Request, Response } from 'express';
import { PrismaClient } from '../../prisma/generated/client';

const router = Router();
const prisma = new PrismaClient({});

// GET /api/v1/slides - List active slides ordered by sortOrder
router.get('/', async (req: Request, res: Response) => {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });
    res.json(slides);
  } catch (error) {
    console.error('Fetch Slides Error:', error);
    res.status(500).json({ error: 'Failed to fetch slides' });
  }
});

// GET /api/v1/slides/all - List ALL slides for admin
router.get('/all', async (req: Request, res: Response) => {
  try {
    const slides = await prisma.heroSlide.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    res.json(slides);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch slides' });
  }
});

// POST /api/v1/slides
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, subtitle, buttonText, buttonLink, imageUrl, sortOrder, isActive } = req.body;
    const slide = await prisma.heroSlide.create({
      data: { title, subtitle, buttonText, buttonLink, imageUrl, sortOrder: sortOrder || 0, isActive: isActive !== false }
    });
    res.status(201).json(slide);
  } catch (error) {
    console.error('Create Slide Error:', error);
    res.status(500).json({ error: 'Failed to create slide' });
  }
});

// PUT /api/v1/slides/:id
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { title, subtitle, buttonText, buttonLink, imageUrl, sortOrder, isActive } = req.body;
    const id = req.params.id as string;
    const slide = await prisma.heroSlide.update({
      where: { id },
      data: { title, subtitle, buttonText, buttonLink, imageUrl, sortOrder, isActive }
    });
    res.json(slide);
  } catch (error) {
    console.error('Update Slide Error:', error);
    res.status(500).json({ error: 'Failed to update slide' });
  }
});

// DELETE /api/v1/slides/:id
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.heroSlide.delete({ where: { id } });
    res.json({ message: 'Slide deleted' });
  } catch (error) {
    console.error('Delete Slide Error:', error);
    res.status(500).json({ error: 'Failed to delete slide' });
  }
});

export default router;
