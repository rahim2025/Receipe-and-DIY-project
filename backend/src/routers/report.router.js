import express from "express";
import { protectRoute } from "../middlewares/protectRoute.js";
import { checkIfBlocked } from "../middlewares/adminCheck.js";
import {
    createReport,
    getMyReports,
    getReportById
} from "../controllers/report.controller.js";

const router = express.Router();

// All routes require authentication and non-blocked status
router.use(protectRoute, checkIfBlocked);

// Report routes
router.post("/", createReport);
router.get("/my-reports", getMyReports);
router.get("/:reportId", getReportById);

export default router;
