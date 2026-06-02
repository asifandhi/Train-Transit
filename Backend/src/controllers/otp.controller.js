import { asyncHandler } from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { sendOTPEmail } from "../utils/email.util.js";


function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}







export const sendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new apiError(400, "Email is required");
  }

  
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing && existing.isVerified && existing.name !== "pending") {
    throw new apiError(409, "An account already exists with this email. Please login.");
  }

  const otp       = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); 

  
  
  await User.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    {
      $set: {
        otpToken:  otp,
        otpExpiry: otpExpiry,
        isVerified: false,
      },
      
      $setOnInsert: {
        email:    email.toLowerCase().trim(),
        name:     "pending",
        password: "pending_password_not_used",
        phone:    "9999999999",
        gender:   "other",
        dob:      new Date("2000-01-01"),
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  
  await sendOTPEmail({ to: email, otp });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "OTP sent to your email. It is valid for 10 minutes."));
});






export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new apiError(400, "Email and OTP are both required");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    throw new apiError(404, "No OTP request found for this email. Please request OTP first.");
  }

  if (!user.otpToken || !user.otpExpiry) {
    throw new apiError(400, "No active OTP found. Please request a new OTP.");
  }

  if (new Date() > user.otpExpiry) {
    throw new apiError(400, "OTP has expired. Please request a new one.");
  }

  if (user.otpToken !== otp) {
    throw new apiError(401, "Incorrect OTP. Please try again.");
  }

  
  user.otpToken   = undefined;
  user.otpExpiry  = undefined;
  user.isVerified = true;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Email verified successfully. You can now complete registration."));
});