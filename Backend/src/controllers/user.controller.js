import { asyncHandler } from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { COOKIE_OPTIONS } from "../constant.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const generateTokens = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new apiError(500, "User not found during token generation");

  const accessToken  = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};








export const register = asyncHandler(async (req, res) => {
  try {
    const { name, email, password, phone, gender, dob } = req.body;

    if (!name || !email || !password || !phone || !gender || !dob) {
      throw new apiError(
        400,
        "All fields are required: name, email, password, phone, gender, dob"
      );
    }

    
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    
    if (!existingUser) {
      throw new apiError(
        403,
        "Please verify your email with OTP before registering"
      );
    }

    
    if (!existingUser.isVerified) {
      throw new apiError(
        403,
        "Email not verified. Please complete the OTP verification step first."
      );
    }

    
    if (existingUser.isVerified && existingUser.name !== "pending") {
      throw new apiError(409, "User already exists with this email");
    }

    
    const avatarUrl = req.file?.path;
    if (!avatarUrl) {
      throw new apiError(400, "Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarUrl);
    if (!avatar) {
      throw new apiError(400, "Avatar upload to Cloudinary failed");
    }

    
    existingUser.name     = name.trim();
    existingUser.email    = email.toLowerCase().trim();
    existingUser.password = password;           
    existingUser.phone    = phone.trim();
    existingUser.gender   = gender;
    existingUser.dob      = new Date(dob);
    existingUser.avatar   = avatar.url;
    await existingUser.save();

    const createdUser = await User.findById(existingUser._id).select(
      "-password -refreshToken -otpToken -otpExpiry -passwordResetToken -passwordResetExpiry"
    );

    if (!createdUser) {
      throw new apiError(500, "Something went wrong while registering the user");
    }

    return res
      .status(201)
      .json(new apiResponse(201, createdUser, "User registered successfully"));
  } catch (error) {
    
    if (error.statusCode) throw error;
    console.log(":::: Something went wrong in Register ::::", error);
    throw new apiError(500, error.message || "Registration failed");
  }
});





export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new apiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw new apiError(404, "No account found with this email");

  if (!user.isActive)
    throw new apiError(403, "Account deactivated. Contact support.");

  
  if (!user.isVerified) {
    throw new apiError(403, "Please verify your email with OTP before logging in.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new apiError(401, "Invalid credentials");

  const { accessToken, refreshToken } = await generateTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -otpToken -otpExpiry -passwordResetToken -passwordResetExpiry"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, COOKIE_OPTIONS)
    .cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
    .json(
      new apiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "Logged in successfully"
      )
    );
});




export const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("accessToken", COOKIE_OPTIONS)
    .clearCookie("refreshToken", COOKIE_OPTIONS)
    .json(new apiResponse(200, {}, "Logged out successfully"));
});




export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken)
    throw new apiError(401, "Refresh token is required");

  let decoded;
  try {
    decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  } catch {
    throw new apiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(decoded._id);
  if (!user) throw new apiError(401, "User not found for this refresh token");

  if (incomingRefreshToken !== user.refreshToken) {
    throw new apiError(401, "Refresh token is expired or already used");
  }

  const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
    user._id
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, COOKIE_OPTIONS)
    .cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS)
    .json(
      new apiResponse(
        200,
        { accessToken, refreshToken: newRefreshToken },
        "Access token refreshed"
      )
    );
});




export const getMe = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new apiResponse(200, req.user, "Current user fetched successfully"));
});





export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword)
    throw new apiError(400, "Both old and new password are required");
  if (oldPassword === newPassword)
    throw new apiError(400, "New password must differ from old");
  if (newPassword.length < 8)
    throw new apiError(400, "New password must be at least 8 characters");

  const user = await User.findById(req.user._id).select("+password");
  if (!user) throw new apiError(404, "User not found");

  const isOldPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isOldPasswordValid) throw new apiError(401, "Old password is incorrect");

  user.password = newPassword;
  await user.save();

  return res
    .status(200)
    .json(new apiResponse(200, {}, "Password changed successfully"));
});







export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, gender, dob } = req.body;

  
  const updateFields = {};

  if (name)   updateFields.name   = name.trim();
  if (phone)  updateFields.phone  = phone.trim();
  if (gender) updateFields.gender = gender;
  if (dob)    updateFields.dob    = new Date(dob);

  
  if (req.file?.path) {
    const uploaded = await uploadOnCloudinary(req.file.path);
    if (uploaded?.url) {
      updateFields.avatar = uploaded.url;
    }
  }

  if (Object.keys(updateFields).length === 0) {
    throw new apiError(400, "No fields provided to update");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updateFields },
    { new: true, runValidators: true }
  ).select(
    "-password -refreshToken -otpToken -otpExpiry -passwordResetToken -passwordResetExpiry"
  );

  if (!updatedUser) throw new apiError(404, "User not found");

  return res
    .status(200)
    .json(new apiResponse(200, updatedUser, "Profile updated successfully"));
});