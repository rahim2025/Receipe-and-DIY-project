import express from "express";
import { protectRoute } from "../middlewares/protectRoute.js";
import { getAISuggestions, getRecipeAssistance, getRecipeDetail } from "../controllers/ai.controller.js";

const router = express.Router();

// Protected AI routes - require authentication
router.post("/suggestions", protectRoute, getAISuggestions);
router.post("/recipe-detail", protectRoute, getRecipeDetail);
router.post("/recipe-assistance", protectRoute, getRecipeAssistance);

export default router;
