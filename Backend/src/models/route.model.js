import mongoose, { Schema } from 'mongoose';

const stopSchema = new Schema(
  {
    station: {
      type: Schema.Types.ObjectId,
      ref: 'Station',
      required: [true, 'Station reference is required'],
    },
    stopNumber: {
      type: Number,
      required: [true, 'Stop number is required'],
      // WHY: 1=origin, 2=second stop... last=destination
      // Needed to find distance between any 2 stops for fare calculation
    },
    arrivalTime: {
      type: String,
      default: null,
      // HH:MM format — null for FIRST stop (train starts here, no arrival)
    },
    departureTime: {
      type: String,
      default: null,
      // HH:MM format — null for LAST stop (train ends here, no departure)
    },
    haltMinutes: {
      type: Number,
      default: 0,
      // WHY: how long train stops at this station — shown on ticket
    },
    distanceFromOrigin: {
      type: Number,
      required: [true, 'Distance from origin is required'],
      // WHY: CRITICAL for fare — fare = distance(from→to) × rate per km
      // distance(from→to) = stop[to].distanceFromOrigin - stop[from].distanceFromOrigin
    },
    platformNumber: {
      type: Number,
      default: 1,
    },

    // ── ADDED ──────────────────────────────────────────────────────────────
    dayOffset: {
      type: Number,
      default: 0,
      // WHY: train may cross midnight — Delhi departs day 0, Mumbai arrives day 1
      // dayOffset: 0 = same day as origin, 1 = next day, 2 = day after
      // Without this, arrival time "06:00" on day 1 looks BEFORE departure "22:00" on day 0
    },
    // ───────────────────────────────────────────────────────────────────────
  },
  { _id: false }
);

const routeSchema = new Schema(
  {
    train: {
      type: Schema.Types.ObjectId,
      ref: 'Train',
      required: [true, 'Train reference is required'],
    },
    stops: {
      type: [stopSchema],
      required: true,
      validate: {
        validator: (stops) => stops.length >= 2,
        message: 'A route must have at least 2 stops',
      },
    },
    totalDistance: {
      type: Number,
      required: [true, 'Total distance is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ── ADDED index ──────────────────────────────────────────────────────────────
// WHY: 1 train should have only 1 active route at a time
// This prevents accidentally creating 2 routes for same train
routeSchema.index({ train: 1, isActive: 1 });
// ─────────────────────────────────────────────────────────────────────────────

export default mongoose.model('Route', routeSchema);