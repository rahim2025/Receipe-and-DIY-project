import express from "express";
import { protectRoute } from "../middlewares/protectRoute.js";
import {
  createReview,
  getVendorReviews,
  updateReview,
  deleteReview,
  toggleHelpfulVote,
  addVendorResponse,
  getUserReview
} from "../controllers/vendorReview.controller.js";

const router = express.Router();

// ============ VENDOR REVIEW ROUTES ============
router.post("/vendor/:vendorId", protectRoute, createReview);
router.get("/vendor/:vendorId", getVendorReviews);
router.get("/vendor/:vendorId/user", protectRoute, getUserReview);
router.put("/:reviewId", protectRoute, updateReview);
router.delete("/:reviewId", protectRoute, deleteReview);
router.post("/:reviewId/helpful", protectRoute, toggleHelpfulVote);
router.post("/:reviewId/response", protectRoute, addVendorResponse);

export default router;
