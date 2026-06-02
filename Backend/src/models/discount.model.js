import mongoose, { Schema } from 'mongoose';
import { COACH_CLASS_LIST } from '../constant.js';

const discountSchema = new Schema(
  {
    discountType: {
      type: String,
      enum: ['student', 'senior', 'pwd', 'military'],
      required: [true, 'Discount type is required'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    proofUrl: {
      type: String,
    },
    proofPublicId: {
      type: String,
    },
    discountPercent: {
      type: Number,
      required: [true, 'Discount percent is required'],
    },
    allowedClass: {
      type: [String],
      enum: COACH_CLASS_LIST,
      default: [],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    expiresAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Discount', discountSchema);