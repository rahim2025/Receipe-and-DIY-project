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

// Protected routes
router.use(protectRoute);

// Post CRUD operations
router.post("/", createPost);
router.put("/:id", updatePost);
router.patch("/:id/publish", publishPost);
router.delete("/:id", deletePost);

// Media upload
router.post("/upload", upload.single('media'), handleUploadError, uploadMedia);

// Post interactions
router.post("/:id/like", likePost);

// Draft management
router.get("/user/drafts", getUserDrafts);

export default router;