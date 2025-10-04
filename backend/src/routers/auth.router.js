import express from "express";
import { signup,login,logout,updateProfile,checkAuth,verifyEmail,resendVerificationEmail } from "../controllers/auth.controller.js";
import {validate} from "../middlewares/userValidate.middleware.js"
import {protectRoute} from "../middlewares/protectRoute.js"  // check user logged in or not


const router = express.Router();

router.post("/signup",signup)  // Manual validation in controller
router.post("/login",login)
router.post("/logout",logout)
router.put("/update-profile",protectRoute,updateProfile) //update profile picture
router.get("/check",protectRoute,checkAuth);
router.post("/verify-email", verifyEmail); // Verify email with token
router.post("/resend-verification", resendVerificationEmail); // Resend verification email  




export default router;