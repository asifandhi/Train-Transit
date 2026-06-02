import mongoose, { Schema } from 'mongoose';
import { COACH_CLASS_LIST } from '../constant.js';

const coachSchema = new Schema(
  {
    train: {
      type: Schema.Types.ObjectId,
      ref: 'Train',
      required: [true, 'Train reference is required'],
    },
    coachNumber: {
      type: String,
      required: [true, 'Coach number is required'],
      trim: true,
    },
    coachClass: {
      type: String,
      enum: COACH_CLASS_LIST,
      required: [true, 'Coach class is required'],
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats count is required'],
    },
    totalRACBerths: {
      type: Number,
      default: 0,
    },
    maxWaitlist: {
      type: Number,
      default: 0,
    },
    amenities: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    hasPantry: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

coachSchema.index({ train: 1, coachNumber: 1 }, { unique: true });

export default mongoose.model('Coach', coachSchema);