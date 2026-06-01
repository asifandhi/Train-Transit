import { asyncHandler } from '../utils/asyncHandler.js'
import apiError from '../utils/apiError.js'
import apiResponse from '../utils/apiResponse.js'
import { Booking } from '../models/booking.model.js'
import { COACH_CLASS_LIST } from '../constant.js'

export const verifyTicket = asyncHandler(async (req, res) => {
  const { PNR } = req.params

  const booking = await Booking.findOne({ pnr: PNR })
    .populate('train',    'trainName trainNumber trainType isSuperfast')
    .populate('fromStation', 'stationCode stationName city')
    .populate('toStation',   'stationCode stationName city')
    .populate('schedule', 'journeyDate departureDateTime arrivalDateTime status')
    .lean()

  if (!booking) throw new apiError(404, `No booking found for PNR: ${PNR}`)

  const passengers = (booking.passengers || []).map((p, idx) => ({
    index:          idx,
    name:           p.name,
    age:            p.age,
    gender:         p.gender,
    status:         p.status,
    seatNumber:     p.seatNumber     ?? null,
    coachNumber:    p.coachNumber    ?? null,
    berthType:      p.berthType      ?? null,
    racNumber:      p.racNumber      ?? null,
    waitlistNumber: p.waitlistNumber ?? null,
    discountType:   p.discountType   ?? null,
  }))

  return res.status(200).json(
    new apiResponse(200, {
      pnr:               booking.pnr,
      bookingStatus:     booking.bookingStatus,
      paymentStatus:     booking.paymentStatus,
      coachClass:        booking.coachClass,
      journeyDate:       booking.schedule?.journeyDate      ?? booking.journeyDate,
      departureDateTime: booking.schedule?.departureDateTime ?? null,
      arrivalDateTime:   booking.schedule?.arrivalDateTime   ?? null,
      train: {
        id:          booking.train?._id,
        name:        booking.train?.trainName,
        number:      booking.train?.trainNumber,
        type:        booking.train?.trainType,
        isSuperfast: booking.train?.isSuperfast,
      },
      fromStation: {
        code: booking.fromStation?.stationCode,
        name: booking.fromStation?.stationName,
        city: booking.fromStation?.city,
      },
      toStation: {
        code: booking.toStation?.stationCode,
        name: booking.toStation?.stationName,
        city: booking.toStation?.city,
      },
      passengers,
      totalPassengers: passengers.length,
    }, 'Ticket verified')
  )
})

export const markNoShow = asyncHandler(async (req, res) => {
  const { PNR } = req.params

  const booking = await Booking.findOne({ pnr: PNR })
  if (!booking) throw new apiError(404, `No booking found for PNR: ${PNR}`)

  if (booking.bookingStatus === 'cancelled') throw new apiError(400, 'Cannot mark no-show on cancelled booking')
  if (booking.bookingStatus === 'completed') throw new apiError(400, 'Booking already completed')

  let markedCount = 0
  booking.passengers = booking.passengers.map((p) => {
    if (p.status === 'confirmed' || p.status === 'RAC') {
      markedCount++
      const obj = p.toObject()
      obj.noShow = true
      return obj
    }
    return p
  })

  booking.bookingStatus = 'completed'
  booking.markModified('passengers')
  await booking.save({ validateBeforeSave: false })

  return res.status(200).json(
    new apiResponse(200, {
      pnr: PNR,
      bookingStatus: booking.bookingStatus,
      noShowMarked: markedCount,
    }, `No-show marked for ${markedCount} passenger(s)`)
  )
})

export const upgradePassenger = asyncHandler(async (req, res) => {
  const { PNR } = req.params
  const { passengerIndex, newCoachClass, newSeatNumber, newCoachNumber } = req.body

  if (passengerIndex === undefined || !newCoachClass || newSeatNumber === undefined || !newCoachNumber)
    throw new apiError(400, 'passengerIndex, newCoachClass, newSeatNumber, newCoachNumber are required')

  if (!COACH_CLASS_LIST.includes(newCoachClass))
    throw new apiError(400, `newCoachClass must be one of: ${COACH_CLASS_LIST.join(', ')}`)

  const booking = await Booking.findOne({ pnr: PNR })
  if (!booking) throw new apiError(404, `No booking found for PNR: ${PNR}`)

  if (booking.bookingStatus === 'cancelled') throw new apiError(400, 'Cannot upgrade cancelled booking')

  const idx = parseInt(passengerIndex)
  if (isNaN(idx) || idx < 0 || idx >= booking.passengers.length)
    throw new apiError(400, `passengerIndex must be 0–${booking.passengers.length - 1}`)

  const p = booking.passengers[idx].toObject()
  booking.passengers[idx] = {
    ...p,
    coachNumber:   newCoachNumber,
    seatNumber:    newSeatNumber,
    upgradedClass: newCoachClass,
    upgradedFrom:  p.upgradedClass ?? booking.coachClass,
    upgradedAt:    new Date(),
    upgradedBy:    req.user._id,
  }

  booking.markModified('passengers')
  await booking.save({ validateBeforeSave: false })

  return res.status(200).json(
    new apiResponse(200, {
      pnr: PNR,
      upgradedPassenger: booking.passengers[idx],
    }, `Passenger ${idx + 1} upgraded to ${newCoachClass}`)
  )
})