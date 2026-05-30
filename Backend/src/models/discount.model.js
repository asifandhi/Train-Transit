import mongoose, { Schema } from 'mongoose';
// FIX: was '../constants/index.js' — wrong path, all other models use '../constant.js'
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
      // WHY: Cloudinary URL of uploaded student ID / disability certificate photo
    },
    proofPublicId: {
      type: String,
      // WHY: Cloudinary public_id — needed to DELETE or REPLACE the image later
      // Without this you cannot remove old proof when user uploads a new one
    },
    discountPercent: {
      type: Number,
      required: [true, 'Discount percent is required'],
      // student=90, senior=40, pwd=50, military=50
    },
    allowedClass: {
      type: [String],
      enum: COACH_CLASS_LIST,
      default: [],
      // WHY: student discount is GN ONLY — this field enforces that rule
      // e.g. student → ["GN"],  senior → all classes
    },
    isVerified: {
      type: Boolean,
      default: false,
      // WHY: admin must manually verify student/PWD proof before discount activates
      // Prevents fake proofs — discount only applies after admin approves
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      // WHY: audit trail — which admin approved this discount
    },
    expiresAt: {
      type: Date,
      // WHY: student ID expires every year — discount should expire too
      // System auto-rejects expired discounts even if isVerified=true
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Discount', discountSchema);