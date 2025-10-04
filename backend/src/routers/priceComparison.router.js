import express from "express";
import { 
  searchItemsForComparison, 
  getItemPriceStats, 
  getPopularItems 
} from "../controllers/priceComparison.controller.js";
import { protectRoute } from "../middlewares/protectRoute.js";

const router = express.Router();

// Test endpoint
router.get("/test", (req, res) => {
  res.json({ success: true, message: "Price comparison routes working!" });
});

// Search for items across vendors for price comparison
router.get("/search", searchItemsForComparison);

// Get price statistics for a specific item
router.get("/stats", getItemPriceStats);

// Get popular items for comparison
router.get("/popular", getPopularItems);

export default router;