export const DB_NAME = "TrainTransit";

export const ROLES = Object.freeze({
  PASSENGER: "passenger",
  ADMIN: "admin",
  TTE: "tte",
});

export const COACH_CLASSES = Object.freeze({
  GN: "GN",
  SL: "SL",
  THREE_A: "3A",
  TWO_A: "2A",
  ONE_A: "1A",
  CC: "CC",
  EC: "EC",
});

export const COACH_CLASS_LIST = Object.values(COACH_CLASSES);

export const BERTH_TYPES = Object.freeze({
  LOWER: "lower",
  MIDDLE: "middle",
  UPPER: "upper",
  SIDE_UPPER: "sideUpper",
  SIDE_LOWER: "sideLower",
  SEAT: "seat",
});

export const BERTH_TYPE_LIST = Object.values(BERTH_TYPES);

export const PASSENGER_STATUS = Object.freeze({
  CONFIRMED: "confirmed",
  RAC: "RAC",
  WAITLIST: "waitlist",
});

export const BOOKING_STATUS = Object.freeze({
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: "pending",
  PAID: "paid",
  REFUNDED: "refunded",
});

export const RATE_PER_KM = Object.freeze({
  GN: 0.3,
  SL: 0.6,
  "3A": 1.2,
  "2A": 1.8,
  "1A": 3.0,
  CC: 1.0,
  EC: 2.0,
});

export const RESERVATION_CHARGE = Object.freeze({
  GN: 0,
  SL: 20,
  "3A": 40,
  "2A": 50,
  "1A": 75,
  CC: 40,
  EC: 60,
});

export const SUPERFAST_CHARGE = 45;

export const GST_RATE = 0.05;

export const DISCOUNT_TYPES = Object.freeze({
  STUDENT: "student",
  SENIOR: "senior",
  PWD: "pwd",
  MILITARY: "military",
});

export const DISCOUNT_RULES = Object.freeze({
  student: {
    percentage: 90,
    allowedClasses: [COACH_CLASSES.GN],
    proofRequired: true,
    description: "Student concession — GN class only",
  },

  senior: {
    percentage: 40,
    allowedClasses: COACH_CLASS_LIST,
    proofRequired: false,
    maleMinAge: 60,
    femaleMinAge: 58,
    description: "Senior citizen concession — all classes",
  },

  pwd: {
    percentage: 50,
    allowedClasses: COACH_CLASS_LIST,
    proofRequired: true,
    description: "PWD concession — all classes",
  },

  military: {
    percentage: 50,
    allowedClasses: COACH_CLASS_LIST,
    proofRequired: true,
    description: "Military/Defence concession — all classes",
  },
});

export const REFUND_RULES = Object.freeze([
  { minHours: 48, refundPercent: 75 },
  { minHours: 24, refundPercent: 50 },
  { minHours: 0, refundPercent: 0 },
]);

export const RAC_PASSENGERS_PER_BERTH = 2;

export const PNR_LENGTH = 10;

export const COOKIE_OPTIONS = Object.freeze({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
});
