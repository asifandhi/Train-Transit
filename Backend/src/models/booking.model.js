import mongoose, { Schema } from 'mongoose';
import { COACH_CLASS_LIST, BERTH_TYPE_LIST } from '../constant.js';

const passengerSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Passenger name is required'],
    },
    age: {
      type: Number,
      required: [true, 'Passenger age is required'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Passenger gender is required'],
    },

    
    idType: {
      type: String,
      enum: ['aadhar', 'passport', 'driving_license'],
    },
    idNumber: {
      type: String,
      trim: true,
    },

    berth: {
      type: String,
      enum: BERTH_TYPE_LIST,
    },
    seatNumber: {
      type: Number,
    },
    coachNumber: {
      type: String,
    },
    status: {
      type: String,
      enum: ['confirmed', 'RAC', 'waitlist'],
      default: 'waitlist',
    },
    waitlistNumber: {
      type: Number,
    },
    racNumber: {
      type: Number,
    },
    discountType: {
      type: String,
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    proofUrl: {
      type: String,
    },

    meals: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Meal',
      },
    ],
  },
  { _id: true }
);

const fareSchema = new Schema(
  {
    baseFare: {
      type: Number,
      required: [true, 'Base fare is required'],
    },
    gst: {
      type: Number,
      default: 0,
    },
    mealCost: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalFare: {
      type: Number,
      required: [true, 'Total fare is required'],
    },
  },
  { _id: false }
);

const bookingSchema = new Schema(
  {
    pnr: {
      type: String,
      required: [true, 'PNR is required'],
      unique: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    schedule: {
      type: Schema.Types.ObjectId,
      ref: 'Schedule',
      required: [true, 'Schedule reference is required'],
    },
    train: {
      type: Schema.Types.ObjectId,
      ref: 'Train',
      required: [true, 'Train reference is required'],
    },
    fromStation: {
      type: Schema.Types.ObjectId,
      ref: 'Station',
      required: [true, 'From station reference is required'],
    },
    toStation: {
      type: Schema.Types.ObjectId,
      ref: 'Station',
      required: [true, 'To station reference is required'],
    },
    journeyDate: {
      type: Date,
      required: [true, 'Journey date is required'],
    },
    coachClass: {
      type: String,
      enum: COACH_CLASS_LIST,
      required: [true, 'Coach class is required'],
    },
    passengers: {
      type: [passengerSchema],
      required: true,
      validate: {
        validator: (passengers) => passengers.length >= 1 && passengers.length <= 6,
        message: 'Booking must have 1 to 6 passengers',
      },
    },


    fare: {
      type: fareSchema,
      required: true,
    },
    bookingStatus: {
      type: String,
      enum: ['confirmed', 'cancelled', 'completed'],
      default: 'confirmed',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    bookedAt: {
      type: Date,
      default: Date.now,
    },

    ticketPdfUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Booking =  mongoose.model('Booking', bookingSchema);