import express from "express";
import { protectRoute } from "../middlewares/protectRoute.js";
import {
  createVendor,
  getVendorsByLocation,
  getVendorById,
  searchVendors,
  toggleFollowVendor,
  testGeocode
} from "../controllers/vendor.controller.js";

const router = express.Router();

// ============ VENDOR ROUTES ============
router.post("/", protectRoute, createVendor);
router.get("/", getVendorsByLocation); // Default route for getting vendors
router.get("/search", searchVendors);
router.get("/nearby", getVendorsByLocation);
router.post("/test-geocode", testGeocode); // Test geocoding endpoint
router.get("/:vendorId", getVendorById);
router.post("/:vendorId/follow", protectRoute, toggleFollowVendor);

export default router;