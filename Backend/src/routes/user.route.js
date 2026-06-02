import { Router } from "express";

import {
  register,
  login,
  logout,
  getMe,
  changePassword,
  refreshAccessToken,
  updateProfile,
} from "../controllers/user.controller.js";

import { sendOtp, verifyOtp } from "../controllers/otp.controller.js";
import {
  forgotPassword,
  resetPassword,
} from "../controllers/password.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";

const router = Router();

// ── OTP (Step 1 & 2 before register) ────────────────────
router.route("/send-otp").post(sendOtp);
router.route("/verify-otp").post(verifyOtp);

// ── Registration & Login ─────────────────────────────────
router.route("/register").post(upload.single("avatar"), register);
router.route("/login").post(login);
router.route("/refresh-token").get(refreshAccessToken);

// ── Forgot / Reset Password ──────────────────────────────
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);

// ── Protected routes (require JWT) ──────────────────────
router.route("/logout").get(verifyJWT, logout);
router.route("/me").get(verifyJWT, getMe);
router.route("/change-password").post(verifyJWT, changePassword);
router
  .route("/update-profile")
  .patch(verifyJWT, upload.single("avatar"), updateProfile);

export default router;
