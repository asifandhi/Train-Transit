import mongoose, { Schema } from 'mongoose';

const trainSchema = new Schema(
  {
    trainNumber: {
      type: String,
      required: [true, 'Train number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    trainName: {
      type: String,
      required: [true, 'Train name is required'],
      trim: true,
    },
    trainType: {
      type: String,
      enum: [
        'express',
        'superfast',
        'passenger',
        'rajdhani',
        'shatabdi',
        'vande_bharat',
        'duronto',
      ],
      required: [true, 'Train type is required'],
    },
    isSuperfast: {
      type: Boolean,
      default: false,
    },
    totalCoaches: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    operatingDays: {
      type: [String],
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    originStation: {
      type: Schema.Types.ObjectId,
      ref: 'Station',
      
    },
    destinationStation: {
      type: Schema.Types.ObjectId,
      ref: 'Station',
      
    },
  },
  { timestamps: true }
);

export const Train  =  mongoose.model('Train', trainSchema);
