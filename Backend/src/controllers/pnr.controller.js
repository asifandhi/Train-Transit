import { asyncHandler } from '../utils/asyncHandler.js'
import apiError from '../utils/apiError.js'
import apiResponse from '../utils/apiResponse.js'
import { Booking } from '../models/booking.model.js'

export const checkPNRStatus = asyncHandler(async (req, res) => {
  const { pnr } = req.params

  if (!pnr || !/^\d{10}$/.test(pnr))
    throw new apiError(400, 'PNR must be a 10-digit number')

  const booking = await Booking.findOne({ pnr })
    .populate('train',       'trainName trainNumber trainType isSuperfast')
    .populate('fromStation', 'stationCode stationName city')
    .populate('toStation',   'stationCode stationName city')
    .select('pnr journeyDate coachClass bookingStatus paymentStatus passengers train fromStation toStation')
    .lean()

  if (!booking) throw new apiError(404, 'PNR not found')

  const passengers = (booking.passengers || []).map((p) => ({
    name:           p.name,
    status:         p.status,
    seatNumber:     p.seatNumber     ?? null,
    coachNumber:    p.coachNumber    ?? null,
    berthType:      p.berthType      ?? null,
    waitlistNumber: p.waitlistNumber ?? null,
    racNumber:      p.racNumber      ?? null,
  }))

  return res.status(200).json(
    new apiResponse(200, {
      pnr:           booking.pnr,
      trainName:     booking.train?.trainName    ?? null,
      trainNumber:   booking.train?.trainNumber  ?? null,
      trainType:     booking.train?.trainType    ?? null,
      isSuperfast:   booking.train?.isSuperfast  ?? false,
      fromStation: {
        code: booking.fromStation?.stationCode ?? null,
        name: booking.fromStation?.stationName ?? null,
        city: booking.fromStation?.city        ?? null,
      },
      toStation: {
        code: booking.toStation?.stationCode ?? null,
        name: booking.toStation?.stationName ?? null,
        city: booking.toStation?.city        ?? null,
      },
      journeyDate:   booking.journeyDate,
      coachClass:    booking.coachClass,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      passengers,
    }, 'PNR status fetched')
  )
})