import { asyncHandler } from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import { Booking } from "../models/booking.model.js";
import { Schedule } from "../models/schedule.model.js";
import { Station } from "../models/station.model.js";
import { Train } from "../models/train.model.js";
import { Route } from "../models/route.model.js";
import { calculateFare } from "../utils/fareCalc.util.js";
import { generateUniquePNR } from "../utils/pnrGenerator.util.js";
import { assignSeat } from "../utils/seatAssigner.util.js"; // ← seat assignment

// ── Internal helper: figure out passenger status (confirmed / RAC / waitlist)
const assignPassengerStatus = (snap, coachClass) => {
  const confirmedLeft = snap.availableSeats[coachClass] || 0;

  if (confirmedLeft > 0) {
    snap.availableSeats[coachClass] = confirmedLeft - 1;
    return { status: "confirmed", racNumber: null, waitlistNumber: null };
  }

  const racLeft = snap.availableRAC[coachClass] || 0;

  if (racLeft > 0) {
    snap.availableRAC[coachClass] = racLeft - 1;

    snap._racCounter[coachClass] = (snap._racCounter[coachClass] || 0) + 1;
    const racNumber = snap._racCounter[coachClass];

    return { status: "RAC", racNumber, waitlistNumber: null };
  }

  const currentWL = snap.waitlistCount[coachClass] || 0;
  const maxWL     = snap.maxWaitlist[coachClass] || 0;

  if (currentWL < maxWL) {
    snap.waitlistCount[coachClass] = currentWL + 1;
    const waitlistNumber = snap.waitlistCount[coachClass];

    return { status: "waitlist", racNumber: null, waitlistNumber };
  }

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/bookings
// Body: { scheduleId, fromStationId, toStationId, coachClass, passengers[] }
// ─────────────────────────────────────────────────────────────────────────────
export const createBooking = asyncHandler(async (req, res) => {
  const { scheduleId, fromStationId, toStationId, coachClass, passengers } =
    req.body;

  if (
    !scheduleId ||
    !fromStationId ||
    !toStationId ||
    !coachClass ||
    !passengers
  ) {
    throw new apiError(
      400,
      "scheduleId, fromStationId, toStationId, coachClass, passengers are required"
    );
  }

  if (!Array.isArray(passengers) || passengers.length === 0) {
    throw new apiError(400, "passengers must be a non-empty array");
  }

  if (passengers.length > 6) {
    throw new apiError(400, "Maximum 6 passengers allowed per booking");
  }

  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) throw new apiError(404, "Schedule not found");

  if (schedule.status !== "scheduled") {
    throw new apiError(
      400,
      `Booking not allowed — schedule status is '${schedule.status}'`
    );
  }

  const [fromStation, toStation] = await Promise.all([
    Station.findById(fromStationId),
    Station.findById(toStationId),
  ]);
  if (!fromStation) throw new apiError(404, "From station not found");
  if (!toStation) throw new apiError(404, "To station not found");

  const route = await Route.findOne({ train: schedule.train });
  if (!route) throw new apiError(404, "Route not found for this train");

  const fromStop = route.stops.find(
    (s) => s.station.toString() === fromStationId.toString()
  );
  const toStop = route.stops.find(
    (s) => s.station.toString() === toStationId.toString()
  );

  if (!fromStop || !toStop) {
    throw new apiError(
      400,
      "One or both stations are not part of this train's route"
    );
  }

  if (fromStop.stopNumber >= toStop.stopNumber) {
    throw new apiError(
      400,
      "From station must come before to station on this route"
    );
  }

  const distanceKm = Math.max(
    1,
    toStop.distanceFromOrigin - fromStop.distanceFromOrigin
  );

  const train = await Train.findById(schedule.train);
  if (!train) throw new apiError(404, "Train not found");

  // Snapshot of seat availability (so we modify without touching DB yet)
  const snap = {
    availableSeats: { ...schedule.availableSeats.toObject() },
    availableRAC:   { ...schedule.availableRAC.toObject() },
    waitlistCount:  { ...schedule.waitlistCount.toObject() },
    maxWaitlist:    { ...schedule.maxWaitlist.toObject() },
    _racCounter:    {},
  };

  const passengerDetails = [];

  // Track which seat IDs we've already assigned in this booking
  // (prevents two passengers from getting the same seat)
  const usedSeatIds = new Set();

  for (let i = 0; i < passengers.length; i++) {
    const p = passengers[i];

    if (!p.name || !p.age || !p.gender) {
      throw new apiError(
        400,
        `Passenger ${i + 1}: name, age, gender are required`
      );
    }

    const assignment = assignPassengerStatus(snap, coachClass);

    if (!assignment) {
      throw new apiError(
        400,
        `Passenger ${i + 1}: no seats, RAC, or waitlist available in ${coachClass}`
      );
    }

    const fare = calculateFare({
      distanceKm,
      coachClass,
      isSuperfast:     train.isSuperfast,
      discountType:    p.discountType || null,
      discountPercent: p.discountPercent || 0,
      mealCost:        0,
    });

    // ── Seat Assignment ──────────────────────────────────
    // Only confirmed passengers get an actual seat.
    // RAC and waitlist passengers get null (as before).
    let seatNumber  = null;
    let coachNumber = null;

    if (assignment.status === "confirmed") {
      const seatResult = await assignSeat(schedule.train, coachClass, usedSeatIds);
      if (seatResult) {
        seatNumber  = seatResult.seatNumber;
        coachNumber = seatResult.coachNumber;
      }
    }
    // ────────────────────────────────────────────────────

    passengerDetails.push({
      name:            p.name.trim(),
      age:             parseInt(p.age),
      gender:          p.gender,
      idType:          p.idType || null,
      idNumber:        p.idNumber || null,
      berth:           p.berth || null,
      discountType:    p.discountType || null,
      discountPercent: p.discountPercent || 0,
      proofUrl:        p.proofUrl || null,
      status:          assignment.status,
      racNumber:       assignment.racNumber,
      waitlistNumber:  assignment.waitlistNumber,
      seatNumber,    // ← real seat now (or null for RAC/waitlist)
      coachNumber,   // ← real coach now (or null for RAC/waitlist)
      meals:           [],
      fare,
    });
  }

  const totalBaseFare = passengerDetails.reduce(
    (sum, p) => sum + p.fare.baseFare,
    0
  );
  const totalGST = passengerDetails.reduce((sum, p) => sum + p.fare.gst, 0);
  const totalMealCost = passengerDetails.reduce(
    (sum, p) => sum + (p.fare.mealCost || 0),
    0
  );
  const totalDiscount = passengerDetails.reduce(
    (sum, p) => sum + (p.fare.discountAmount || 0),
    0
  );
  const totalFare = passengerDetails.reduce(
    (sum, p) => sum + p.fare.totalFare,
    0
  );

  const pnr = await generateUniquePNR();

  const booking = await Booking.create({
    pnr,
    user:         req.user._id,
    train:        schedule.train,
    schedule:     scheduleId,
    fromStation:  fromStationId,
    toStation:    toStationId,
    journeyDate:  schedule.journeyDate,
    coachClass,
    passengers:   passengerDetails,
    fare: {
      baseFare:       totalBaseFare,
      gst:            totalGST,
      mealCost:       totalMealCost,
      discountAmount: totalDiscount,
      totalFare,
    },
    bookingStatus: passengerDetails.every((p) => p.status === "waitlist")
      ? "waitlist"
      : "confirmed",
    paymentStatus: "pending",
  });

  // Update the schedule's seat counts in DB
  const scheduleUpdate = {};

  Object.keys(snap.availableSeats).forEach((cls) => {
    if (snap.availableSeats[cls] !== schedule.availableSeats[cls]) {
      scheduleUpdate[`availableSeats.${cls}`] = snap.availableSeats[cls];
    }
  });

  Object.keys(snap.availableRAC).forEach((cls) => {
    if (snap.availableRAC[cls] !== schedule.availableRAC[cls]) {
      scheduleUpdate[`availableRAC.${cls}`] = snap.availableRAC[cls];
    }
  });

  Object.keys(snap.waitlistCount).forEach((cls) => {
    if (snap.waitlistCount[cls] !== schedule.waitlistCount[cls]) {
      scheduleUpdate[`waitlistCount.${cls}`] = snap.waitlistCount[cls];
    }
  });

  if (Object.keys(scheduleUpdate).length > 0) {
    await Schedule.findByIdAndUpdate(scheduleId, { $set: scheduleUpdate });
  }

  const populatedBooking = await Booking.findById(booking._id)
    .populate("train", "trainName trainNumber trainType isSuperfast")
    .populate("fromStation", "stationCode stationName city state")
    .populate("toStation", "stationCode stationName city state")
    .populate(
      "schedule",
      "journeyDate departureDatetime arrivalDatetime status"
    );

  return res
    .status(201)
    .json(
      new apiResponse(201, populatedBooking, "Booking created successfully")
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/bookings  (protected)
// Query: ?page=1&limit=10&status=confirmed
// ─────────────────────────────────────────────────────────────────────────────
export const getMyBookings = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
  const skip  = (page - 1) * limit;

  const filter = { user: req.user._id };

  if (req.query.status) {
    filter.bookingStatus = req.query.status;
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate("train", "trainName trainNumber trainType isSuperfast")
      .populate("fromStation", "stationCode stationName city")
      .populate("toStation", "stationCode stationName city")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  return res.status(200).json(
    new apiResponse(
      200,
      {
        bookings,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      "Bookings fetched successfully"
    )
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/bookings/:PNR  (protected)
// ─────────────────────────────────────────────────────────────────────────────
export const getBookingByPNR = asyncHandler(async (req, res) => {
  const { PNR } = req.params;

  const booking = await Booking.findOne({ pnr: PNR })
    .populate("train", "trainName trainNumber trainType isSuperfast")
    .populate("fromStation", "stationCode stationName city state")
    .populate("toStation", "stationCode stationName city state")
    .populate("user", "name email phone")
    .populate(
      "schedule",
      "journeyDate departureDatetime arrivalDatetime status"
    );

  if (!booking) throw new apiError(404, "No booking found for this PNR");

  const isOwner = booking.user._id.toString() === req.user._id.toString();
  const isStaff = req.user.role === "admin" || req.user.role === "tte";

  if (!isOwner && !isStaff) {
    throw new apiError(403, "You are not authorized to view this booking");
  }

  return res
    .status(200)
    .json(new apiResponse(200, booking, "Booking fetched successfully"));
});
