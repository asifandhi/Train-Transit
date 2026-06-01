// File: src/controllers/booking.controller.js
// Status: 33 of 57

import { asyncHandler } from '../utils/asyncHandler.js'
import apiError from '../utils/apiError.js'
import apiResponse from '../utils/apiResponse.js'
import { Booking } from '../models/booking.model.js'
import { Schedule } from '../models/schedule.model.js'
import { Station } from '../models/station.model.js'
import { Train } from '../models/train.model.js'
import { Route } from '../models/route.model.js'
import { calculateFare } from '../utils/fareCalc.util.js'
import { generateUniquePNR } from '../utils/pnrGenerator.util.js'


// ─────────────────────────────────────────────────────────────────────────────
// HELPER: assignPassengerStatus
//
// WHY THIS EXISTS:
//   Each passenger in a booking goes through confirmed → RAC → waitlist in order.
//   We work on a plain JS "snap" object (copy of schedule counts) so we can
//   assign all passengers in one loop BEFORE hitting the DB.
//   Only after all assignments succeed do we persist the updated counts.
//
// HOW IT WORKS:
//   1. confirmed seats remaining?  → assign confirmed, decrement confirmed count
//   2. RAC slots remaining?        → assign RAC, decrement RAC count, track RAC number
//   3. waitlist below max?         → assign waitlist, increment waitlist count
//   4. none available?             → return null (caller throws 400)
//
// PARAMS:
//   snap       — plain JS object with availableSeats, availableRAC, waitlistCount,
//                maxWaitlist, _racCounter (all mutable, keyed by coachClass)
//   coachClass — e.g. 'SL', '3A', '2A'
//
// RETURNS: { status, racNumber, waitlistNumber }  OR  null if no slot available
// ─────────────────────────────────────────────────────────────────────────────
const assignPassengerStatus = (snap, coachClass) => {
  const confirmedLeft = snap.availableSeats[coachClass] || 0

  // STEP 1 — confirmed seat available
  if (confirmedLeft > 0) {
    snap.availableSeats[coachClass] = confirmedLeft - 1
    // racNumber and waitlistNumber are null because passenger is confirmed
    return { status: 'confirmed', racNumber: null, waitlistNumber: null }
  }

  const racLeft = snap.availableRAC[coachClass] || 0

  // STEP 2 — RAC berth available
  // RAC = Reservation Against Cancellation
  // 2 passengers share 1 berth; if either cancels the other gets full berth
  if (racLeft > 0) {
    snap.availableRAC[coachClass] = racLeft - 1

    // _racCounter tracks the RAC queue number for this class
    // e.g. first RAC passenger gets racNumber=1, next gets 2, etc.
    snap._racCounter[coachClass] = (snap._racCounter[coachClass] || 0) + 1
    const racNumber = snap._racCounter[coachClass]

    return { status: 'RAC', racNumber, waitlistNumber: null }
  }

  const currentWL = snap.waitlistCount[coachClass] || 0
  const maxWL = snap.maxWaitlist[coachClass] || 0

  // STEP 3 — waitlist slot available
  // WL/1 = first in queue, will get RAC if someone cancels
  if (currentWL < maxWL) {
    snap.waitlistCount[coachClass] = currentWL + 1
    const waitlistNumber = snap.waitlistCount[coachClass]

    return { status: 'waitlist', racNumber: null, waitlistNumber }
  }

  // STEP 4 — completely full, no accommodation possible
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/bookings
// Auth: passenger (verifyJWT middleware applied in route)
//
// FLOW:
//   1. Validate request body
//   2. Validate schedule exists and is bookable
//   3. Validate both stations exist
//   4. Find route → locate fromStop and toStop → calculate distanceKm
//   5. Get train (needed for isSuperfast flag in fare calc)
//   6. Build snap (copy of schedule seat counts) — work in memory, not DB
//   7. Loop over each passenger:
//      a. validate required fields
//      b. assign status via assignPassengerStatus()
//      c. calculate individual fare via calculateFare()
//   8. Sum up total fare components
//   9. Generate unique PNR
//  10. Create Booking document in DB
//  11. Push updated seat counts back to Schedule (only changed fields)
//  12. Return populated booking
// ─────────────────────────────────────────────────────────────────────────────
export const createBooking = asyncHandler(async (req, res) => {
  const { scheduleId, fromStationId, toStationId, coachClass, passengers } = req.body

  // Basic presence check — all 5 fields are mandatory
  if (!scheduleId || !fromStationId || !toStationId || !coachClass || !passengers) {
    throw new apiError(400, 'scheduleId, fromStationId, toStationId, coachClass, passengers are required')
  }

  if (!Array.isArray(passengers) || passengers.length === 0) {
    throw new apiError(400, 'passengers must be a non-empty array')
  }

  // IRCTC rule: max 6 passengers per PNR
  if (passengers.length > 6) {
    throw new apiError(400, 'Maximum 6 passengers allowed per booking')
  }

  // ── SCHEDULE VALIDATION ────────────────────────────────────────────────────
  const schedule = await Schedule.findById(scheduleId)
  if (!schedule) throw new apiError(404, 'Schedule not found')

  // Only allow booking on scheduled trains — not cancelled/completed ones
  if (schedule.status !== 'scheduled') {
    throw new apiError(400, `Booking not allowed — schedule status is '${schedule.status}'`)
  }

  // ── STATION VALIDATION ─────────────────────────────────────────────────────
  // Fetch both stations in parallel — faster than sequential awaits
  const [fromStation, toStation] = await Promise.all([
    Station.findById(fromStationId),
    Station.findById(toStationId),
  ])
  if (!fromStation) throw new apiError(404, 'From station not found')
  if (!toStation) throw new apiError(404, 'To station not found')

  // ── ROUTE + DISTANCE ───────────────────────────────────────────────────────
  // Route holds the ordered list of stops with distanceFromOrigin for each
  const route = await Route.findOne({ train: schedule.train })
  if (!route) throw new apiError(404, 'Route not found for this train')

  // Find the stop objects matching our from/to stations
  const fromStop = route.stops.find(s => s.station.toString() === fromStationId.toString())
  const toStop   = route.stops.find(s => s.station.toString() === toStationId.toString())

  if (!fromStop || !toStop) {
    throw new apiError(400, 'One or both stations are not part of this train\'s route')
  }

  // stopNumber enforces direction — fromStop must come before toStop
  if (fromStop.stopNumber >= toStop.stopNumber) {
    throw new apiError(400, 'From station must come before to station on this route')
  }

  // distanceKm = difference in distances from origin — minimum 1km to avoid zero fare
  const distanceKm = Math.max(1, toStop.distanceFromOrigin - fromStop.distanceFromOrigin)

  // ── TRAIN ──────────────────────────────────────────────────────────────────
  // Need isSuperfast flag — superfast trains add ₹45 to fare
  const train = await Train.findById(schedule.train)
  if (!train) throw new apiError(404, 'Train not found')

  // ── SEAT SNAPSHOT ──────────────────────────────────────────────────────────
  // WHY SNAPSHOT:
  //   If we did DB update per passenger, and passenger 3 fails validation,
  //   passengers 1 and 2 would already have decremented counts — inconsistent state.
  //   Instead we work on a plain JS copy, assign all passengers, then persist once.
  //
  // schedule.availableSeats is a Map/Object keyed by coachClass e.g. { SL: 120, 3A: 64 }
  const snap = {
    availableSeats:  { ...schedule.availableSeats.toObject() },
    availableRAC:    { ...schedule.availableRAC.toObject() },
    waitlistCount:   { ...schedule.waitlistCount.toObject() },
    maxWaitlist:     { ...schedule.maxWaitlist.toObject() },
    _racCounter:     {}, // tracks RAC queue number per class — not stored in DB directly
  }

  // ── PASSENGER LOOP ─────────────────────────────────────────────────────────
  const passengerDetails = []

  for (let i = 0; i < passengers.length; i++) {
    const p = passengers[i]

    // name, age, gender are required per passengerSchema
    if (!p.name || !p.age || !p.gender) {
      throw new apiError(400, `Passenger ${i + 1}: name, age, gender are required`)
    }

    // Assign confirmed / RAC / waitlist based on current snap counts
    const assignment = assignPassengerStatus(snap, coachClass)

    // null means train is completely full for this class
    if (!assignment) {
      throw new apiError(400, `Passenger ${i + 1}: no seats, RAC, or waitlist available in ${coachClass}`)
    }

    // Calculate fare for this individual passenger
    // discountType and discountPercent come from frontend (validated separately by discount route)
    const fare = calculateFare({
      distanceKm,
      coachClass,
      isSuperfast: train.isSuperfast,
      discountType:    p.discountType    || null,
      discountPercent: p.discountPercent || 0,
      mealCost: 0, // meal cost added later via POST /api/bookings/:PNR/meals
    })

    passengerDetails.push({
      name:            p.name.trim(),
      age:             parseInt(p.age),
      gender:          p.gender,
      idType:          p.idType    || null,  // aadhar / passport / driving_license
      idNumber:        p.idNumber  || null,  // for TTE verification
      berth:           p.berth     || null,  // PREFERENCE only — not guaranteed
      discountType:    p.discountType    || null,
      discountPercent: p.discountPercent || 0,
      proofUrl:        p.proofUrl  || null,  // Cloudinary URL uploaded separately
      status:          assignment.status,
      racNumber:       assignment.racNumber,       // null if not RAC
      waitlistNumber:  assignment.waitlistNumber,  // null if not waitlist
      seatNumber:      null,  // assigned at boarding by TTE / admin
      coachNumber:     null,  // assigned at boarding
      meals:           [],    // populated later via meal order endpoint
      fare,                   // individual fare object from calculateFare
    })
  }

  // ── FARE TOTALS ────────────────────────────────────────────────────────────
  // Sum across all passengers for the booking-level fare document
  const totalBaseFare     = passengerDetails.reduce((sum, p) => sum + p.fare.baseFare, 0)
  const totalGST          = passengerDetails.reduce((sum, p) => sum + p.fare.gst, 0)
  const totalMealCost     = passengerDetails.reduce((sum, p) => sum + (p.fare.mealCost || 0), 0)
  const totalDiscount     = passengerDetails.reduce((sum, p) => sum + (p.fare.discountAmount || 0), 0)
  const totalFare         = passengerDetails.reduce((sum, p) => sum + p.fare.totalFare, 0)

  // ── PNR GENERATION ─────────────────────────────────────────────────────────
  // 10-digit, year-prefixed, unique — pnrGenerator checks DB for collisions
  const pnr = await generateUniquePNR()

  // ── CREATE BOOKING ─────────────────────────────────────────────────────────
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
    bookingStatus: 'confirmed', // booking exists — payment is still pending
    paymentStatus: 'pending',   // Razorpay payment not initiated yet
  })

  // ── UPDATE SCHEDULE SEAT COUNTS ────────────────────────────────────────────
  // Only write fields that actually changed (diff snap vs original schedule)
  // Using $set with dot-notation paths updates only specific class keys
  // e.g. { 'availableSeats.SL': 119 } — does NOT touch availableSeats.3A
  const scheduleUpdate = {}

  Object.keys(snap.availableSeats).forEach(cls => {
    if (snap.availableSeats[cls] !== schedule.availableSeats[cls]) {
      scheduleUpdate[`availableSeats.${cls}`] = snap.availableSeats[cls]
    }
  })

  Object.keys(snap.availableRAC).forEach(cls => {
    if (snap.availableRAC[cls] !== schedule.availableRAC[cls]) {
      scheduleUpdate[`availableRAC.${cls}`] = snap.availableRAC[cls]
    }
  })

  Object.keys(snap.waitlistCount).forEach(cls => {
    if (snap.waitlistCount[cls] !== schedule.waitlistCount[cls]) {
      scheduleUpdate[`waitlistCount.${cls}`] = snap.waitlistCount[cls]
    }
  })

  // Only hit DB if something actually changed
  if (Object.keys(scheduleUpdate).length > 0) {
    await Schedule.findByIdAndUpdate(scheduleId, { $set: scheduleUpdate })
  }

  // ── POPULATE & RETURN ──────────────────────────────────────────────────────
  const populatedBooking = await Booking.findById(booking._id)
    .populate('train',       'trainName trainNumber trainType isSuperfast')
    .populate('fromStation', 'stationCode stationName city state')
    .populate('toStation',   'stationCode stationName city state')
    .populate('schedule',    'journeyDate departureDatetime arrivalDatetime status')

  return res
    .status(201)
    .json(new apiResponse(201, populatedBooking, 'Booking created successfully'))
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bookings/my
// Auth: passenger
//
// Returns paginated list of the logged-in user's bookings.
// Supports ?status=confirmed|cancelled|completed and ?page= ?limit= query params.
// ─────────────────────────────────────────────────────────────────────────────
export const getMyBookings = asyncHandler(async (req, res) => {
  // Clamp page to minimum 1, limit between 1 and 50
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10))
  const skip  = (page - 1) * limit

  // Always filter by current user — passenger can only see their own bookings
  const filter = { user: req.user._id }

  // Optional status filter — e.g. GET /api/bookings/my?status=cancelled
  if (req.query.status) {
    filter.bookingStatus = req.query.status
  }

  // Run count and find in parallel — saves one round-trip
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('train',       'trainName trainNumber trainType isSuperfast')
      .populate('fromStation', 'stationCode stationName city')
      .populate('toStation',   'stationCode stationName city')
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ])

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
      'Bookings fetched successfully'
    )
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/bookings/:PNR
// Auth: passenger (own booking only) | admin | tte
//
// PNR is the 10-digit booking reference — case-sensitive string match.
// Passengers can only see their own booking.
// Admin and TTE can see any booking (for verification and management).
// ─────────────────────────────────────────────────────────────────────────────
export const getBookingByPNR = asyncHandler(async (req, res) => {
  const { PNR } = req.params

  const booking = await Booking.findOne({ pnr: PNR })
    .populate('train',       'trainName trainNumber trainType isSuperfast')
    .populate('fromStation', 'stationCode stationName city state')
    .populate('toStation',   'stationCode stationName city state')
    .populate('user',        'name email phone')
    .populate('schedule',    'journeyDate departureDatetime arrivalDatetime status')

  if (!booking) throw new apiError(404, 'No booking found for this PNR')

  // Authorization check:
  // - booking.user._id  = who made the booking
  // - req.user._id      = who is making this request
  // - admin/tte bypass the ownership check
  const isOwner = booking.user._id.toString() === req.user._id.toString()
  const isStaff = req.user.role === 'admin' || req.user.role === 'tte'

  if (!isOwner && !isStaff) {
    throw new apiError(403, 'You are not authorized to view this booking')
  }

  return res
    .status(200)
    .json(new apiResponse(200, booking, 'Booking fetched successfully'))
})

// ✅ Done. Next: src/controllers/meal.controller.js