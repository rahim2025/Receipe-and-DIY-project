import express from "express";
import { protectRoute } from "../middlewares/protectRoute.js";
import { isAdmin } from "../middlewares/adminCheck.js";
import {
    getAllReports,
    getReportsStats,
    updateReportStatus,
    blockUser,
    unblockUser,
    getAllUsers,
    getUserDetails,
    deleteUser
} from "../controllers/admin.controller.js";

const router = express.Router();

// All routes require authentication and admin privileges
router.use(protectRoute, isAdmin);

// Reports management
router.get("/reports", getAllReports);
router.get("/reports/stats", getReportsStats);
router.put("/reports/:reportId", updateReportStatus);

// User management
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserDetails);
router.post("/users/:userId/block", blockUser);
router.post("/users/:userId/unblock", unblockUser);
router.delete("/users/:userId", deleteUser);

export default router;
