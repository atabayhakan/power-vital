import { Router, Request, Response } from 'express';
import { authenticateJWT, requireRole } from '../middleware/auth';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';
import { validate, MediaFolderCreateSchema, MediaMoveSchema, IdParamSchema } from '../validators';
import { optimizeUploadedImage } from '../services/imageService';
import { logger } from '../utils/logger';


const router = Router();

// Use a stable absolute path (not relative to compiled __dirname which can vary)
// Resolve to /var/www/power-vital/uploads in production, ./uploads in dev
const uploadDir = process.env.UPLOAD_DIR || (
  process.env.NODE_ENV === 'production'
    ? '/var/www/power-vital/uploads'
    : path.join(__dirname, '../../uploads')
);
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
logger.info(`[upload] uploadDir = ${uploadDir}`);

const storage = multer.memoryStorage(); // Keep in memory for sharp processing
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024, files: 20 } // 25MB per file, max 20 files
});

// GET /api/v1/upload/folders — List all folders
router.get('/folders', async (req: Request, res: Response) => {
  try {
    const folders = await prisma.mediaFolder.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(folders);
  } catch (error) {
    logger.error({ err: error }, 'List Folders Error:');
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// POST /api/v1/upload/folders — Create new folder
router.post('/folders', authenticateJWT, requireRole('admin'), validate({ body: MediaFolderCreateSchema }), async (req: Request, res: Response) => {
  try {
    const { name } = req.body as { name: string };
    const folder = await prisma.mediaFolder.create({
      data: { name: name.trim() }
    });
    res.json(folder);
  } catch (error: any) {
    logger.error({ err: error }, 'Create Folder Error:');
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Folder already exists' });
    }
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// DELETE /api/v1/upload/folders/:id — Delete folder
router.delete('/folders/:id', authenticateJWT, requireRole('admin'), validate({ params: IdParamSchema }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    await prisma.mediaFolder.delete({ where: { id } });
    // Note: Associated media are set to folderId=null (Genel) if schema sets onDelete SetNull, but our schema doesn't have it explicitly.
    // Wait, by default Prisma restricts deletion if relations exist unless onDelete: SetNull is defined.
    // Let's manually update media to null first to be safe.
    await prisma.media.updateMany({
      where: { folderId: id },
      data: { folderId: null }
    });
    res.json({ success: true, message: 'Folder deleted' });
  } catch (error) {
    logger.error({ err: error }, 'Delete Folder Error:');
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// POST /api/v1/upload — Universal image upload (multi-file support)
const processAndSaveFile = async (file: Express.Multer.File, folderId: string | null) => {
  // Stage 1: Write the original as-is to disk so imageService can read it
  //          and produce variants from it. Filename is webp already for
  //          new uploads; we still pass it through the optimizer.
  const basename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tempName = `${basename}.webp`;
  const tempPath = path.join(uploadDir, tempName);

  // Initial encode: WebP 1920w, quality 85 (visually lossless, ~30% smaller than JPEG)
  await sharp(file.buffer)
    .rotate() // honour EXIF orientation
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(tempPath);

  // Stage 2: Produce AVIF + responsive variants (600/1024/1920) in parallel
  let optimization;
  try {
    optimization = await optimizeUploadedImage({
      uploadDir,
      originalFilename: tempName,
      urlBase: '/uploads',
      quality: 85,
      widths: [600, 1024, 1920],
      formats: ['webp', 'avif']
    });
  } catch (err: any) {
    logger.error({ err: err?.message }, 'image optimization failed; falling back to single WebP');
    // Fall back to single WebP — original file already on disk at tempPath
    const metadata = await sharp(tempPath).metadata();
    optimization = {
      master: { width: 1920, format: 'webp', filename: tempName, url: `/uploads/${tempName}`, bytes: metadata.size || 0 },
      variants: [],
      totalBytes: metadata.size || 0
    };
  }

  const filename = optimization.master.filename;
  const url = optimization.master.url;
  const size = optimization.master.bytes || 0;

  // Preserve original filename for display; strip any path prefix
  const originalName = file.originalname ? file.originalname.split(/[\\/]/).pop() || 'image' : 'image';

  const media = await prisma.media.create({
    data: {
      filename,
      originalName,
      url,
      mimeType: 'image/webp',
      size,
      folderId
    }
  });

  return { media, optimization };
};

router.post('/', authenticateJWT, requireRole('admin'), upload.array('files', 20), async (req: Request, res: Response) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) return res.status(400).json({ error: 'No files provided' });

    const folderId = req.body.folderId && req.body.folderId !== 'null' ? req.body.folderId : null;

    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const { media, optimization } = await processAndSaveFile(file, folderId);
        results.push({
          url: media.url,
          filename: media.filename,
          originalName: media.originalName,
          media,
          variants: optimization.variants
        });
      } catch (err: any) {
        logger.error({ err: err?.message, originalName: file.originalname }, 'file processing failed');
        errors.push({ originalName: file.originalname, error: 'İşleme hatası' });
      }
    }

    res.json({
      uploaded: results.length,
      failed: errors.length,
      results,
      errors,
      message: `${results.length} dosya yüklendi${errors.length > 0 ? `, ${errors.length} hata` : ''}`
    });
  } catch (error) {
    logger.error({ err: error }, 'Upload Error:');
    res.status(500).json({ error: 'Upload failed' });
  }
});

// POST /api/v1/upload/hires — High-res upload (multi-file)
router.post('/hires', authenticateJWT, requireRole('admin'), upload.array('files', 20), async (req: Request, res: Response) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length === 0) return res.status(400).json({ error: 'No files provided' });

    const folderId = req.body.folderId && req.body.folderId !== 'null' ? req.body.folderId : null;
    const results = [];

    for (const file of files) {
      const basename = `hero-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const tempName = `${basename}.webp`;
      const tempPath = path.join(uploadDir, tempName);

      // Hi-res hero: cap 2560w (4K displays), quality 90 (visually lossless for big screens)
      await sharp(file.buffer)
        .rotate()
        .resize({ width: 2560, withoutEnlargement: true })
        .webp({ quality: 90 })
        .toFile(tempPath);

      let optimization;
      try {
        optimization = await optimizeUploadedImage({
          uploadDir,
          originalFilename: tempName,
          urlBase: '/uploads',
          quality: 88,
          widths: [1024, 1920, 2560],
          formats: ['webp', 'avif']
        });
      } catch (err: any) {
        logger.error({ err: err?.message }, 'hi-res optimization failed; using master');
        const metadata = await sharp(tempPath).metadata();
        optimization = {
          master: { width: 2560, format: 'webp', filename: tempName, url: `/uploads/${tempName}`, bytes: metadata.size || 0 },
          variants: [],
          totalBytes: metadata.size || 0
        };
      }

      const filename = optimization.master.filename;
      const url = optimization.master.url;
      const size = optimization.master.bytes || 0;
      const originalName = file.originalname ? file.originalname.split(/[\\/]/).pop() || 'image' : 'image';

      const media = await prisma.media.create({
        data: { filename, originalName, url, mimeType: 'image/webp', size, folderId }
      });
      results.push({ url, filename, originalName, media, variants: optimization.variants });
    }

    res.json({ uploaded: results.length, results });
  } catch (error) {
    logger.error({ err: error }, 'HiRes Upload Error:');
    res.status(500).json({ error: 'Upload failed' });
  }
});

// GET /api/v1/upload — List all media
router.get('/', async (req: Request, res: Response) => {
  try {
    const media = await prisma.media.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(media);
  } catch (error) {
    logger.error({ err: error }, 'List Media Error:');
    res.status(500).json({ error: 'Failed to fetch media list' });
  }
});

// PUT /api/v1/upload/:id/move — Move media to a folder
router.put('/:id/move', authenticateJWT, requireRole('admin'), validate({ body: MediaMoveSchema, params: IdParamSchema }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const { folderId } = req.body as { folderId?: string | null };

    const media = await prisma.media.update({
      where: { id },
      data: { folderId: folderId || null }
    });
    res.json({ success: true, media });
  } catch (error) {
    logger.error({ err: error }, 'Move Media Error:');
    res.status(500).json({ error: 'Failed to move media' });
  }
});

// DELETE /api/v1/upload/:id — Delete media
router.delete('/:id', authenticateJWT, requireRole('admin'), validate({ params: IdParamSchema }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params as { id: string };
    const media = await prisma.media.findUnique({ where: { id: id as string } });
    
    if (!media) return res.status(404).json({ error: 'Media not found' });

    // Delete file
    const filePath = path.join(uploadDir, media.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete DB record
    await prisma.media.delete({ where: { id } });

    res.json({ success: true, message: 'Media deleted' });
  } catch (error) {
    logger.error({ err: error }, 'Delete Media Error:');
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

export default router;
