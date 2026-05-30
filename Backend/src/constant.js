export const DB_NAME = "Train Transit";


// USER ROLES
export const ROLES = Object.freeze({
  PASSENGER: "passenger",
  ADMIN: "admin",
  TTE: "tte",
});

// COACH CLASSES
export const COACH_CLASSES = Object.freeze({
  GN: "GN", // General
  SL: "SL", // Sleeper
  THREE_A: "3A", // AC 3 Tier
  TWO_A: "2A", // AC 2 Tier
  ONE_A: "1A", // AC First Class
  CC: "CC", // Chair Car
  EC: "EC", // Executive Chair Car
});

// Array form — useful for Mongoose enum validators
export const COACH_CLASS_LIST = Object.values(COACH_CLASSES);


// BERTH TYPES

export const BERTH_TYPES = Object.freeze({
  LOWER: "lower",
  MIDDLE: "middle",
  UPPER: "upper",
  SIDE_UPPER: "sideUpper",
  SIDE_LOWER: "sideLower",
  SEAT: "seat", // CC / EC chairs
});

export const BERTH_TYPE_LIST = Object.values(BERTH_TYPES);


// PASSENGER / BOOKING / PAYMENT STATUSES

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


// FARE RATES (₹ per km per class)

export const RATE_PER_KM = Object.freeze({
  GN: 0.3,
  SL: 0.6,
  "3A": 1.2,
  "2A": 1.8,
  "1A": 3.0,
  CC: 1.0,
  EC: 2.0,
});


// RESERVATION CHARGES (₹ flat per booking per class)

export const RESERVATION_CHARGE = Object.freeze({
  GN: 0,
  SL: 20,
  "3A": 40,
  "2A": 50,
  "1A": 75,
  CC: 40,
  EC: 60,
});


// SUPERFAST SURCHARGE (₹ flat)

export const SUPERFAST_CHARGE = 45;


// GST RATE (percentage as decimal)

export const GST_RATE = 0.05; // 5%


// DISCOUNT TYPES & RULES

export const DISCOUNT_TYPES = Object.freeze({
  STUDENT: "student",
  SENIOR: "senior",
  PWD: "pwd",
  MILITARY: "military",
});

export const DISCOUNT_RULES = Object.freeze({
  // Student: 90% off — GN class ONLY — proof required
  student: {
    percentage: 90,
    allowedClasses: [COACH_CLASSES.GN],
    proofRequired: true,
    description: "Student concession — GN class only",
  },

  // Senior citizen: 40% off — all classes — no proof needed
  // Male > 60 yrs, Female > 58 yrs
  senior: {
    percentage: 40,
    allowedClasses: COACH_CLASS_LIST,
    proofRequired: false,
    maleMinAge: 60,
    femaleMinAge: 58,
    description: "Senior citizen concession — all classes",
  },

  // Person with Disability: 50% off — all classes — proof required
  pwd: {
    percentage: 50,
    allowedClasses: COACH_CLASS_LIST,
    proofRequired: true,
    description: "PWD concession — all classes",
  },

  // Military: 50% off — all classes — proof required
  military: {
    percentage: 50,
    allowedClasses: COACH_CLASS_LIST,
    proofRequired: true,
    description: "Military/Defence concession — all classes",
  },
});


// REFUND RULES (hours before departure → refund %)

export const REFUND_RULES = Object.freeze([
  { minHours: 48, refundPercent: 75 }, // > 48 hrs  → 75%
  { minHours: 24, refundPercent: 50 }, // 24–48 hrs → 50%
  { minHours: 0, refundPercent: 0 },   // < 24 hrs  → 0%
]);


// RAC CONFIGURATION

// Number of passengers that share one RAC berth
export const RAC_PASSENGERS_PER_BERTH = 2;


// PNR CONFIG

export const PNR_LENGTH = 10; // total digits in PNR


// COOKIE / TOKEN CONFIG

export const COOKIE_OPTIONS = Object.freeze({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
});

