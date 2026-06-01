import { asyncHandler } from '../utils/asyncHandler.js'
import apiError from '../utils/apiError.js'
import apiResponse from '../utils/apiResponse.js'
import { Train } from '../models/train.model.js'

export const createTrain = asyncHandler(async (req, res) => {
  const { trainNumber, trainName, trainType, isSuperfast, operatingDays } = req.body

  if (!trainNumber || !trainName || !trainType)
    throw new apiError(400, 'trainNumber, trainName, trainType are required')

  const existing = await Train.findOne({ trainNumber: trainNumber.toUpperCase().trim() })
  if (existing) throw new apiError(409, `Train ${trainNumber} already exists`)

  const train = await Train.create({
    trainNumber:   trainNumber.toUpperCase().trim(),
    trainName:     trainName.trim(),
    trainType,
    isSuperfast:   isSuperfast   ?? false,
    operatingDays: operatingDays ?? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  })

  return res.status(201).json(new apiResponse(201, { train }, 'Train created'))
})

export const getAllTrains = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
  const skip  = (page - 1) * limit

  const filter = { isActive: true }
  if (req.query.trainType)   filter.trainType   = req.query.trainType
  if (req.query.isSuperfast) filter.isSuperfast = req.query.isSuperfast === 'true'
  if (req.query.search) {
    const re = { $regex: req.query.search, $options: 'i' }
    filter.$or = [{ trainName: re }, { trainNumber: re }]
  }

  const [trains, total] = await Promise.all([
    Train.find(filter).sort({ trainNumber: 1 }).skip(skip).limit(limit),
    Train.countDocuments(filter),
  ])

  return res.status(200).json(
    new apiResponse(200, { trains, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } }, 'Trains fetched')
  )
})

export const getTrainById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const train = await Train.findOne({
    $or: [
      ...(id.match(/^[a-f\d]{24}$/i) ? [{ _id: id }] : []),
      { trainNumber: id.toUpperCase() },
    ],
  })

  if (!train) throw new apiError(404, 'Train not found')

  return res.status(200).json(new apiResponse(200, { train }, 'Train fetched'))
})

export const updateTrain = asyncHandler(async (req, res) => {
  const { id } = req.params
  const allowed = ['trainName', 'trainType', 'isSuperfast', 'isActive', 'operatingDays']

  const updateData = {}
  allowed.forEach((f) => { if (req.body[f] !== undefined) updateData[f] = req.body[f] })

  if (!Object.keys(updateData).length)
    throw new apiError(400, 'No valid fields to update')

  const train = await Train.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
  if (!train) throw new apiError(404, 'Train not found')

  return res.status(200).json(new apiResponse(200, { train }, 'Train updated'))
})

export const deleteTrain = asyncHandler(async (req, res) => {
  const { id } = req.params

  const train = await Train.findByIdAndUpdate(id, { isActive: false }, { new: true })
  if (!train) throw new apiError(404, 'Train not found')

  return res.status(200).json(new apiResponse(200, { trainId: train._id }, 'Train deactivated'))
})