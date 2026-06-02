import crypto from "crypto";
import { asyncHandler } from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { sendPasswordResetEmail } from "../utils/email.util.js";









export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new apiError(400, "Email is required");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  
  if (!user) {
    return res
      .status(200)
      .json(new apiResponse(200, {}, "If this email is registered, a reset link has been sent."));
  }

  
  const plainToken  = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(plainToken).digest("hex");
  const expiry      = new Date(Date.now() + 15 * 60 * 1000); 

  
  user.passwordResetToken  = hashedToken;
  user.passwordResetExpiry = expiry;
  await user.save({ validateBeforeSave: false });

  
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










export const resetPassword = asyncHandler(async (req, res) => {
  const { token, email, newPassword } = req.body;

  if (!token || !email || !newPassword) {
    throw new apiError(400, "token, email, and newPassword are all required");
  }

  if (newPassword.length < 8) {
    throw new apiError(400, "New password must be at least 8 characters");
  }

  
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  
  
  
  
  const user = await User.findOne({
    email:               email.toLowerCase().trim(),
    passwordResetToken:  hashedToken,
    passwordResetExpiry: { $gt: new Date() }, 
  });

  if (!user) {
    throw new apiError(400, "Invalid or expired reset link. Please request a new one.");
  }

  
  user.password            = newPassword;
  user.passwordResetToken  = undefined;
  user.passwordResetExpiry = undefined;
  await user.save();

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password reset successfully. Please login with your new password."));
});
