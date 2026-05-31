import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/user.model.js';

export const verifyJWT = asyncHandler(async (req, _, next) => {
  const token =
    req.cookies?.accessToken ||
    req.headers['authorization']?.replace('Bearer ', '');

  if (!token) {
    throw new ApiError(401, 'Unauthorized request');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired access token');
  }

  const user = await User.findById(decoded._id).select('-password -refreshToken');

  if (!user) {
    throw new ApiError(401, 'Invalid access token');
  }

  req.user = user;
  next();
});
