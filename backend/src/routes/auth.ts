import { Router, Request, Response } from 'express';
import { PrismaClient } from '../../prisma/generated/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateJWT } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient({});

// /api/v1/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, sponsorId, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // ═══ MLM KILL SWITCH CHECK ═══
    let isMlmEnabled = true;
    try {
      const config = await prisma.systemConfig.findFirst();
      if (config) isMlmEnabled = config.isMlmEnabled;
    } catch {}

    // Only allow customer or distributor registration explicitly
    let finalRole: 'customer' | 'distributor' = 'customer';
    let finalSponsorId: string | null = null;

    if (isMlmEnabled) {
      finalRole = (role === 'distributor') ? 'distributor' : 'customer';
      finalSponsorId = sponsorId || null;
    }
    // When MLM is OFF: force customer, no sponsor

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        sponsorId: finalSponsorId,
        role: finalRole,
      }
    });

    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'power_vital_super_secret_key_change_me_later',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalanceKgs: user.walletBalanceKgs,
        walletBalanceUsd: user.walletBalanceUsd
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// /api/v1/users/me
router.get('/me', authenticateJWT, async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        walletBalanceKgs: true,
        walletBalanceUsd: true,
        sponsorId: true,
        createdAt: true
      }
    });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/v1/auth/network - Fetch Distributor Downline (Network Tree)
router.get('/network', async (req: Request, res: Response) => {
  try {
    // For MVP, fetch the first distributor/admin as the root of the tree
    const rootUser = await prisma.user.findFirst({
      where: { OR: [{ role: 'admin' }, { role: 'distributor' }] },
      include: {
        sponsoredUsers: {
          select: {
            id: true,
            name: true,
            role: true,
            walletBalanceUsd: true
          }
        }
      }
    });

    if (!rootUser) {
      return res.status(404).json({ error: 'No root network found' });
    }

    res.json({
      id: rootUser.id,
      name: rootUser.name,
      role: rootUser.role,
      walletBalanceUsd: rootUser.walletBalanceUsd,
      children: rootUser.sponsoredUsers
    });

  } catch (error: any) {
    console.error('Fetch Network Error:', error);
    res.status(500).json({ error: 'Failed to fetch network tree' });
  }
});

export default router;
