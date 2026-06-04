import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import productRoutes from './routes/product';
import financeRoutes from './routes/finance';
import orderRoutes from './routes/order';
import systemRoutes from './routes/system';
import sliderRoutes from './routes/slider';
import categoryRoutes from './routes/category';
import settingsRoutes from './routes/settings';
import checkoutRoutes from './routes/checkout';
import uploadRoutes from './routes/upload';
import adminRoutes from './routes/admin';
import path from 'path';

// Background Workers & Services
import './workers/bonusWorker'; 
import { updateExchangeRates } from './services/exchangeRate';

dotenv.config();

// Fetch exchange rates on startup, and set interval to fetch every 24 hours
updateExchangeRates().catch(err => console.error("Initial exchange rate fetch failed:", err.message));
setInterval(() => {
  updateExchangeRates().catch(err => console.error("Periodic exchange rate fetch failed:", err.message));
}, 24 * 60 * 60 * 1000);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Basic healthcheck route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Power Vital Hybrid Core is running (Antigravity mode)' });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/system', systemRoutes);
app.use('/api/v1/slides', sliderRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/checkout', checkoutRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/admin', adminRoutes);

// Serve uploaded receipts
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
