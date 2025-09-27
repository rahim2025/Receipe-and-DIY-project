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

// Middleware
app.use(cookieParser())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(cors({
    origin: [process.env.FRONTEND_URL ],
    credentials: true,
    optionsSuccessStatus: 200 // For legacy browser support
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

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    connectDB();
});