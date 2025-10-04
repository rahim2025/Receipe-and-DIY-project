import express from "express";
import { protectRoute } from "../middlewares/protectRoute.js";
import {
  toggleLike,
  addComment,
  getComments,
  toggleCommentLike,
  editComment,
  deleteComment,
  toggleBookmark,
  getUserBookmarks,
  sharePost,
  getPostEngagement,
  incrementPostViews
} from "../controllers/interaction.controller.js";

const router = express.Router();

// ============ LIKES ROUTES ============
router.post("/:postId/like", protectRoute, toggleLike);

// ============ COMMENTS ROUTES ============
router.post("/:postId/comments", protectRoute, addComment);
router.get("/:postId/comments", getComments);
router.post("/comments/:commentId/like", protectRoute, toggleCommentLike);
router.put("/comments/:commentId", protectRoute, editComment);
router.delete("/comments/:commentId", protectRoute, deleteComment);

// ============ BOOKMARKS ROUTES ============
router.post("/:postId/bookmark", protectRoute, toggleBookmark);
router.get("/bookmarks", protectRoute, getUserBookmarks);

// ============ SHARING ROUTES ============
router.post("/:postId/share", protectRoute, sharePost);

// ============ ANALYTICS ROUTES ============
router.post("/:postId/view", incrementPostViews);
router.get("/:postId/engagement", getPostEngagement);

export default router;