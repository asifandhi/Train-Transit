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
    
    
    availableSeats: {
      type: Schema.Types.Mixed,
      default: {},
    },
    
    availableRAC: {
      type: Schema.Types.Mixed,
      default: {},
    },
    
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


scheduleSchema.index({ train: 1, journeyDate: 1 });

export const Schedule =  mongoose.model('Schedule', scheduleSchema);
