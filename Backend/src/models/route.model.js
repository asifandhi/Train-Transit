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
    },
    arrivalTime: {
      type: String,
      default: null,
      
    },
    departureTime: {
      type: String,
      default: null,
      
    },
    haltMinutes: {
      type: Number,
      default: 0,
      
    },
    distanceFromOrigin: {
      type: Number,
      required: [true, 'Distance from origin is required'],
      
      
    },
    platformNumber: {
      type: Number,
      default: 1,
    },

    
    dayOffset: {
      type: Number,
      default: 0,
      
      
      
    },
    
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




routeSchema.index({ train: 1, isActive: 1 });


export const Route =  mongoose.model('Route', routeSchema);