
import { asyncHandler } from '../utils/asyncHandler.js'
import apiError from '../utils/apiError.js'
import apiResponse from '../utils/apiResponse.js'
import Coach from '../models/coach.model.js'
import { Train } from '../models/train.model.js'
import { Seat } from '../models/seat.model.js'
import { COACH_CLASS_LIST } from '../constant.js'

const getBerthType = (i, coachClass) => {
  if (coachClass === 'SL' || coachClass === '3A')
    return ['lower','middle','upper','lower','middle','upper','sideUpper','sideLower'][i % 8]
  if (coachClass === '2A')
    return ['lower','upper','lower','upper','sideUpper','sideLower'][i % 6]
  if (coachClass === '1A')
    return ['lower','upper','lower','upper'][i % 4]
  return 'seat' // CC, EC, GN
}

export const addCoach = asyncHandler(async (req, res) => {
  const {
    trainId, coachNumber, coachClass,
    totalSeats, totalRACBerths, maxWaitlist,
    amenities, hasPantry,
  } = req.body

  if (!trainId || !coachNumber || !coachClass || !totalSeats)
    throw new apiError(400, 'trainId, coachNumber, coachClass, totalSeats are required')

  if (!COACH_CLASS_LIST.includes(coachClass))
    throw new apiError(400, `coachClass must be one of: ${COACH_CLASS_LIST.join(', ')}`)

  const train = await Train.findById(trainId)
  if (!train) throw new apiError(404, 'Train not found')

  const duplicate = await Coach.findOne({ train: trainId, coachNumber })
  if (duplicate) throw new apiError(409, `Coach ${coachNumber} already exists on this train`)

  const coach = await Coach.create({
    train: trainId,
    coachNumber,
    coachClass,
    totalSeats,
    totalRACBerths: totalRACBerths ?? 0,
    maxWaitlist:    maxWaitlist    ?? 0,
    amenities:      amenities      ?? [],
    hasPantry:      hasPantry      ?? false,
  })

  const seatDocs = Array.from({ length: totalSeats }, (_, i) => ({
    coach:       coach._id,
    train:       trainId,
    seatNumber:  i + 1,
    berthType:   getBerthType(i, coachClass),
    isAvailable: true,
  }))

  await Seat.insertMany(seatDocs)
  await Train.findByIdAndUpdate(trainId, { $inc: { totalCoaches: 1 } })

  const populated = await Coach.findById(coach._id).populate('train', 'trainName trainNumber')

  return res.status(201).json(
    new apiResponse(201, { coach: populated, seatsCreated: totalSeats }, 'Coach added and seats generated')
  )
})

export const getCoachesByTrain = asyncHandler(async (req, res) => {
  const { trainId } = req.params

  const train = await Train.findById(trainId)
  if (!train) throw new apiError(404, 'Train not found')

  const coaches = await Coach.find({ train: trainId, isActive: true })
    .sort({ coachNumber: 1 })
    .populate('train', 'trainName trainNumber')

  return res.status(200).json(
    new apiResponse(200, { coaches, total: coaches.length }, 'Coaches fetched')
  )
})

export const deleteCoach = asyncHandler(async (req, res) => {
  const { id } = req.params

  const coach = await Coach.findByIdAndUpdate(id, { isActive: false }, { new: true })
  if (!coach) throw new apiError(404, 'Coach not found')

  await Seat.updateMany({ coach: id }, { isAvailable: false })
  await Train.findByIdAndUpdate(coach.train, { $inc: { totalCoaches: -1 } })

  return res.status(200).json(
    new apiResponse(200, { coachId: coach._id }, 'Coach deactivated')
  )
})

