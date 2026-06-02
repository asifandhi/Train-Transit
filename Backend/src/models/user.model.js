import mongoose, { Schema } from "mongoose";

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const savedPassengerSchema = new Schema(
  {
    name:     { type: String, required: true, trim: true },
    age:      { type: Number, required: true },
    gender:   { type: String, enum: ["male", "female", "other"], required: true },
    idType:   { type: String, enum: ["aadhar", "passport", "driving_license"] },
    idNumber: { type: String, trim: true },
  },
  { _id: true }
);
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^[6-9]\d{9}$/, "Please enter a valid Indian mobile number"],
    },
    role: {
      type: String,
      enum: ["passenger", "admin", "tte"],
      default: "passenger",
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: [true, "Gender is required"],
    },
    dob: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    avatar: {
      type: String,
      default: "",
    },
    refreshToken: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    savedPassengers: {
      type: [savedPassengerSchema],
      default: [],
    },
    passwordResetToken: {
      type: String,
      
    },
    passwordResetExpiry: {
      type: Date,
      
    },
  },
  { timestamps: true }
);



userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
   
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    }
  );
};

export const User = mongoose.model("User",userSchema);
