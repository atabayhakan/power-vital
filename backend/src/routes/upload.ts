import { Router, Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const router = Router();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.memoryStorage(); // Keep in memory for sharp processing
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } }); // 8MB max

// POST /api/v1/upload — Universal image upload with WebP conversion
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
    const outputPath = path.join(uploadDir, filename);

    // Convert to WebP, max 800px wide, 80% quality
    await sharp(req.file.buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath);

    const url = `/uploads/${filename}`;
    res.json({ url, filename, message: 'Image uploaded and optimized' });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// POST /api/v1/upload/hires — High-res upload for sliders (max 1400px)
router.post('/hires', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const filename = `hero-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
    const outputPath = path.join(uploadDir, filename);

    await sharp(req.file.buffer)
      .resize({ width: 1400, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(outputPath);

    const url = `/uploads/${filename}`;
    res.json({ url, filename });
  } catch (error) {
    console.error('HiRes Upload Error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

export default router;
