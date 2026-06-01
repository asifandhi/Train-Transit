import mongoose, { Schema } from 'mongoose';

const cancellationSchema = new Schema(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required'],
    },
    pnr: {
      type: String,
      required: [true, 'PNR is required'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    cancelledAt: {
      type: Date,
      default: Date.now,
    },
    hoursBeforeDeparture: {
      type: Number,
      required: [true, 'Hours before departure is required'],
    },
    refundPercent: {
      type: Number,
      required: [true, 'Refund percent is required'],
    },
    refundAmount: {
      type: Number,
      required: [true, 'Refund amount is required'],
    },
    originalFare: {
      type: Number,
      required: [true, 'Original fare is required'],
    },
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
    },
    refundRazorpayId: {
      type: String,
    },
    reason: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Cancellation = mongoose.model('Cancellation', cancellationSchema);
