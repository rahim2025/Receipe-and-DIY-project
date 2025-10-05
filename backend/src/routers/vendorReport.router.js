import express from "express";
import { protectRoute } from "../middlewares/protectRoute.js";
import { isAdmin } from "../middlewares/adminCheck.js";
import {
    createVendorReport,
    getVendorReports,
    getVendorReportById,
    updateVendorReportStatus,
    deleteVendor,
    getVendorReportStats
} from "../controllers/vendorReport.controller.js";

const router = express.Router();

// User routes
router.post("/", protectRoute, createVendorReport);

// Admin routes
router.get("/", protectRoute, isAdmin, getVendorReports);
router.get("/stats", protectRoute, isAdmin, getVendorReportStats);
router.get("/:reportId", protectRoute, isAdmin, getVendorReportById);
router.put("/:reportId", protectRoute, isAdmin, updateVendorReportStatus);
router.delete("/vendor/:vendorId", protectRoute, isAdmin, deleteVendor);

export default router;
