import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRouter from '../src/routers/auth.router.js';
import postRouter from '../src/routers/post.router.js';
import interactionRouter from '../src/routers/interaction.router.js';
import vendorRouter from '../src/routers/vendor.router.js';
import vendorItemRouter from '../src/routers/vendorItem.router.js';
import priceComparisonRouter from '../src/routers/priceComparison.router.js';
import { connectDB } from '../src/lib/db.js';

let app; // Reuse between invocations

export default async function handler(req, res) {
  if (!app) {
    app = express();
    app.use(cookieParser());
    app.use(express.json({ limit: '2mb' }));
    app.use(express.urlencoded({ extended: true, limit: '2mb' }));
    app.use(cors({
      origin: [process.env.FRONTEND_URL],
      credentials: true,
      optionsSuccessStatus: 200
    }));

    // Connect DB once
    await connectDB();

    app.use('/api/auth', authRouter);
    app.use('/api/posts', postRouter);
    app.use('/api/interactions', interactionRouter);
    app.use('/api/vendors', vendorRouter);
    app.use('/api/vendor-items', vendorItemRouter);
    app.use('/api/price-comparison', priceComparisonRouter);

    app.get('/api/health', (req, res) => {
      res.json({ success: true, message: 'Serverless API healthy', ts: Date.now() });
    });
  }
  return app(req, res);
}
