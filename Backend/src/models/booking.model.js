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

    // ── ADDED ──────────────────────────────────────────────────────────────
    idType: {
      type: String,
      enum: ['aadhar', 'passport', 'driving_license'],
      // WHY: TTE verifies passenger identity on train — legally required
    },
    idNumber: {
      type: String,
      trim: true,
      // WHY: stored so TTE can cross-check without asking passenger each time
    },
    // ───────────────────────────────────────────────────────────────────────

    berth: {
      type: String,
      enum: BERTH_TYPE_LIST,
      // WHY: this is PREFERENCE only — actual berth assigned by system
      // passenger says "I want lower berth" — system tries to honour it
    },
    seatNumber: {
      type: Number,
      // WHY: assigned AFTER booking is confirmed — not set during initial save
    },
    coachNumber: {
      type: String,
      // WHY: e.g. "S4" — which physical coach passenger should board
    },
    status: {
      type: String,
      enum: ['confirmed', 'RAC', 'waitlist'],
      default: 'waitlist',
      // WHY: starts as waitlist — upgraded to RAC or confirmed based on availability
    },
    waitlistNumber: {
      type: Number,
      // WHY: WL/3 means 3rd in queue — if 3 people cancel, this passenger gets confirmed
    },
    racNumber: {
      type: Number,
      // WHY: RAC/2 means sharing berth with RAC/1 — if RAC/1 cancels, RAC/2 gets own berth
    },
    discountType: {
      type: String,
      // e.g. 'student', 'senior', 'pwd', 'military'
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    proofUrl: {
      type: String,
      // WHY: Cloudinary URL of student ID / disability certificate
      // Required for student (90% off GN only), PWD, military discounts
    },

    // ── ADDED ──────────────────────────────────────────────────────────────
    meals: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Meal',
        // WHY: meals moved from booking level to PASSENGER level
        // Reason: passenger A may want veg, passenger B may want non-veg
        // At booking level you couldn't track which meal belongs to whom
      },
    ],
    // ───────────────────────────────────────────────────────────────────────
  },
  { _id: true }
);

const fareSchema = new Schema(
  {
    baseFare: {
      type: Number,
      required: [true, 'Base fare is required'],
      // WHY: distanceKm × ratePerKm[class] + reservationCharge
    },
    gst: {
      type: Number,
      default: 0,
      // WHY: 5% GST on baseFare — stored separately for invoice/PDF
    },
    mealCost: {
      type: Number,
      default: 0,
      // WHY: total meal cost for all passengers — added to final fare
    },
    discountAmount: {
      type: Number,
      default: 0,
      // WHY: how much was deducted — shown on ticket for transparency
    },
    totalFare: {
      type: Number,
      required: [true, 'Total fare is required'],
      // = baseFare + gst + mealCost - discountAmount
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
      // WHY: 10-digit unique number — passenger uses this to check status, cancel, board
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
      // WHY: links to SPECIFIC run of train on specific date
      // Train 12345 runs daily — each day is a different schedule document
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
        // WHY: IRCTC rule — max 6 passengers per PNR
      },
    },

    // meals REMOVED from here — moved into passengerSchema above

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
      // WHY: created by Razorpay BEFORE payment — needed to open payment popup on frontend
    },
    razorpayPaymentId: {
      type: String,
      // WHY: returned by Razorpay AFTER payment — used to verify payment is genuine
    },
    bookedAt: {
      type: Date,
      default: Date.now,
    },

    // ── ADDED ──────────────────────────────────────────────────────────────
    ticketPdfUrl: {
      type: String,
      // WHY: Cloudinary URL of generated PDF ticket — sent to user by email
    },
    // ───────────────────────────────────────────────────────────────────────
  },
  { timestamps: true }
);

export const Booking =  mongoose.model('Booking', bookingSchema);