import mongoose, { Schema } from 'mongoose';

const scheduleSchema = new Schema(
  {
    train: {
      type: Schema.Types.ObjectId,
      ref: 'Train',
      required: [true, 'Train reference is required'],
    },
    route: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      required: [true, 'Route reference is required'],
    },
    journeyDate: {
      type: Date,
      required: [true, 'Journey date is required'],
    },
    departureDateTime: {
      type: Date,
      required: [true, 'Departure datetime is required'],
    },
    arrivalDateTime: {
      type: Date,
      required: [true, 'Arrival datetime is required'],
    },
    // Map of coach class → available confirmed seat count
    // e.g. { SL: 320, '3A': 64, '2A': 46 }
    availableSeats: {
      type: Schema.Types.Mixed,
      default: {},
    },
    // Map of coach class → available RAC berth count
    availableRAC: {
      type: Schema.Types.Mixed,
      default: {},
    },
    // Map of coach class → current waitlist position count
    waitlistCount: {
      type: Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['scheduled', 'running', 'delayed', 'cancelled', 'completed'],
      default: 'scheduled',
    },
    delayMinutes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound index to efficiently query schedules by train and date
scheduleSchema.index({ train: 1, journeyDate: 1 });

export const Schedule =  mongoose.model('Schedule', scheduleSchema);
