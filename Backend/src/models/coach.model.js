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
      // e.g. "S1", "S2", "B1", "A1" — Sleeper/AC Berth/AC First
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
      // WHY: SL coach typically has 8 side-lower berths as RAC slots
      // 2 passengers share 1 berth until cancellation promotes them
    },
    maxWaitlist: {
      type: Number,
      default: 0,
      // WHY: waitlist is capped — IRCTC allows ~50 per coach class
      // After this limit, booking is REJECTED (no more waitlist)
    },
    amenities: {
      type: [String],
      default: [],
      // e.g. ["charging point", "reading light", "blanket"]
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // ── ADDED ────────────────────────────────────────────────────────────────
    hasPantry: {
      type: Boolean,
      default: false,
      // WHY: only pantry coaches can serve meals — needed for meal ordering logic
    },
    // ─────────────────────────────────────────────────────────────────────────
  },
  { timestamps: true }
);

// ── ADDED index ──────────────────────────────────────────────────────────────
// WHY: train S1 coach should be unique per train — prevent duplicate coach numbers
coachSchema.index({ train: 1, coachNumber: 1 }, { unique: true });
// ─────────────────────────────────────────────────────────────────────────────

export default mongoose.model('Coach', coachSchema);