import express from 'express';
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import cors from "cors"

import authRouter from "./routers/auth.router.js"
import postRouter from "./routers/post.router.js"
import interactionRouter from "./routers/interaction.router.js"
import vendorRouter from "./routers/vendor.router.js"
import vendorItemRouter from "./routers/vendorItem.router.js"
import priceComparisonRouter from "./routers/priceComparison.router.js"
import { connectDB } from "./lib/db.js"

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const rawOrigins = [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URLS,
    process.env.FRONTEND_PREVIEW_URL
].filter(Boolean);

const allowedOrigins = [
    ...rawOrigins.flatMap((value) =>
        value.split(',').map((origin) => origin.trim()).filter(Boolean)
    ),
    'https://receipe-and-diy-project.vercel.app',
    'http://receipe-and-diy-project.vercel.app',
    'receipe-and-diy-project.vercel.app',
    'http://localhost:5173',
    'https://localhost:5173'
];

// Middleware
app.use(cookieParser())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    optionsSuccessStatus: 200
}))

// Routes
app.use("/api/auth", authRouter)
app.use("/api/posts", postRouter)
app.use("/api/interactions", interactionRouter)
app.use("/api/vendors", vendorRouter)
app.use("/api/vendor-items", vendorItemRouter)
app.use("/api/price-comparison", priceComparisonRouter)

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Recipe & DIY Hub API is running!',
        timestamp: new Date().toISOString(),
        env: {
            port: PORT,
            nodeEnv: process.env.NODE_ENV,
            jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Missing',
            mongoUri: process.env.MONGODB_URI ? 'Set' : 'Using default'
        }
    });
});

// Only start a local server when running outside Vercel serverless
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Server (local) running on port ${PORT}`);
        console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
        connectDB();
    });
}

export default app;