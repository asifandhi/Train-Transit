import mongoose, { Schema } from 'mongoose';
import { COACH_CLASS_LIST, BERTH_TYPE_LIST } from '../constant.js';

const seatSchema = new Schema(
  {
    coach: {
      type: Schema.Types.ObjectId,
      ref: 'Coach',
      required: [true, 'Coach reference is required'],
    },
    train: {
      type: Schema.Types.ObjectId,
      ref: 'Train',
      required: [true, 'Train reference is required'],
    },
    seatNumber: {
      type: Number,
      required: [true, 'Seat number is required'],
    },
    berthType: {
      type: String,
      enum: BERTH_TYPE_LIST,
      required: [true, 'Berth type is required'],
    },
    coachClass: {
      type: String,
      enum: COACH_CLASS_LIST,
      required: [true, 'Coach class is required'],
    },
    isRAC: {
      type: Boolean,
      default: false,
    },
    racPosition: {
      type: Number,
      default: null, 
    },
  },
  { timestamps: true }
);

export const Seat =  mongoose.model('Seat', seatSchema);
