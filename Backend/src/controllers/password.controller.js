import crypto from "crypto";
import { asyncHandler } from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { sendPasswordResetEmail } from "../utils/email.util.js";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/forgot-password
// Body: { email }
// What it does:
//   1. Finds user by email
//   2. Creates a secure reset token (hashed before storing in DB)
//   3. Sends an email with a reset link (token in URL)
// ─────────────────────────────────────────────────────────────────────────────
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new apiError(400, "Email is required");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // We always return 200 even if user not found — to not leak info
  if (!user) {
    return res
      .status(200)
      .json(new apiResponse(200, {}, "If this email is registered, a reset link has been sent."));
  }

  // Generate a plain token (sent in email URL) and a hashed version (stored in DB)
  const plainToken  = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(plainToken).digest("hex");
  const expiry      = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Save hashed token + expiry to user (these fields already exist in user.model.js)
  user.passwordResetToken  = hashedToken;
  user.passwordResetExpiry = expiry;
  await user.save({ validateBeforeSave: false });

  // Build the reset link — your frontend will read token + email from URL params
  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${plainToken}&email=${encodeURIComponent(email)}`;

  await sendPasswordResetEmail({
    to:        email,
    userName:  user.name,
    resetLink: resetLink,
  });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "If this email is registered, a reset link has been sent."));
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/auth/reset-password
// Body: { token, email, newPassword }
// What it does:
//   1. Hashes the incoming token and looks up user with matching token + email
//   2. Checks token is not expired
//   3. Updates the password (bcrypt hashing happens in pre-save hook)
//   4. Clears the reset token fields
// ─────────────────────────────────────────────────────────────────────────────
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, email, newPassword } = req.body;

  if (!token || !email || !newPassword) {
    throw new apiError(400, "token, email, and newPassword are all required");
  }

  if (newPassword.length < 8) {
    throw new apiError(400, "New password must be at least 8 characters");
  }

  // Hash the token from URL to compare with what's stored in DB
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user where:
  //   - email matches
  //   - stored hashed token matches
  //   - token is not yet expired
  const user = await User.findOne({
    email:               email.toLowerCase().trim(),
    passwordResetToken:  hashedToken,
    passwordResetExpiry: { $gt: new Date() }, // $gt means "greater than now" = not expired
  });

  if (!user) {
    throw new apiError(400, "Invalid or expired reset link. Please request a new one.");
  }

  // Set new password — the pre-save hook in user.model.js will hash it automatically
  user.password            = newPassword;
  user.passwordResetToken  = undefined;
  user.passwordResetExpiry = undefined;
  await user.save();

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password reset successfully. Please login with your new password."));
});
