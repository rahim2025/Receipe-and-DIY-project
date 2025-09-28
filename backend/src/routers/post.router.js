import express from "express";
import { protectRoute } from "../middlewares/protectRoute.js";
import {
  createPost,
  updatePost,
  publishPost,
  getPosts,
  getPostById,
  deletePost,
  uploadMedia,
  likePost,
  getUserDrafts,
  getPostsByLocation
} from "../controllers/post.controller.js";
import upload, { handleUploadError } from "../lib/multer.js";

const router = express.Router();

// Public routes
router.get("/", getPosts);
router.get("/location", getPostsByLocation);
router.get("/:id", getPostById);

// Protected routes - apply protection individually to avoid conflicts
// Post CRUD operations
router.post("/", protectRoute, createPost);
router.put("/:id", protectRoute, updatePost);
router.patch("/:id/publish", protectRoute, publishPost);
router.delete("/:id", protectRoute, deletePost);

// Media upload - explicitly protect this route
router.post("/upload", protectRoute, upload.single('media'), handleUploadError, uploadMedia);

// Post interactions
router.post("/:id/like", protectRoute, likePost);

// Draft management
router.get("/user/drafts", protectRoute, getUserDrafts);

export default router;