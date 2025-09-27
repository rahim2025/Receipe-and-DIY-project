import express from "express";
import { protectRoute } from "../middlewares/protectRoute.js";
import {
  addVendorItem,
  getVendorItems,
  getVendorItem,
  updateVendorItem,
  deleteVendorItem,
  rateVendorItem,
  searchVendorItems,
  getItemCategories
} from "../controllers/vendorItem.controller.js";

const router = express.Router();

// ============ VENDOR ITEM ROUTES ============

// Search items across all vendors
router.get("/search", searchVendorItems);

// Get categories
router.get("/categories", getItemCategories);

// Vendor-specific item routes
router.post("/vendor/:vendorId/items", protectRoute, addVendorItem);
router.get("/vendor/:vendorId/items", getVendorItems);

// Individual item routes
router.get("/items/:itemId", getVendorItem);
router.put("/items/:itemId", protectRoute, updateVendorItem);
router.delete("/items/:itemId", protectRoute, deleteVendorItem);
router.post("/items/:itemId/rate", protectRoute, rateVendorItem);

export default router;