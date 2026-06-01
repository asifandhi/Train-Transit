import { asyncHandler } from '../utils/asyncHandler.js'
import apiError from '../utils/apiError.js'
import apiResponse from '../utils/apiResponse.js'
import { Station } from '../models/station.model.js'

export const createStation = asyncHandler(async (req, res) => {
  const { stationCode, stationName, city, state, zone, latitude, longitude } = req.body

  if (!stationCode || !stationName || !city || !state)
    throw new apiError(400, 'stationCode, stationName, city, state are required')

  const existing = await Station.findOne({ stationCode: stationCode.toUpperCase().trim() })
  if (existing) throw new apiError(409, `Station ${stationCode.toUpperCase()} already exists`)

  const station = await Station.create({
    stationCode: stationCode.toUpperCase().trim(),
    stationName: stationName.trim(),
    city:        city.trim(),
    state:       state.trim(),
    zone:        zone      || undefined,
    latitude:    latitude  !== undefined ? parseFloat(latitude)  : undefined,
    longitude:   longitude !== undefined ? parseFloat(longitude) : undefined,
  })

  return res.status(201).json(new apiResponse(201, { station }, 'Station created'))
})

export const getAllStations = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50))
  const skip  = (page - 1) * limit

  const filter = { isActive: true }

  if (req.query.search) {
    const re = { $regex: req.query.search, $options: 'i' }
    filter.$or = [{ stationName: re }, { stationCode: re }, { city: re }]
  }
  if (req.query.zone)  filter.zone  = req.query.zone
  if (req.query.state) filter.state = { $regex: req.query.state, $options: 'i' }

  const [stations, total] = await Promise.all([
    Station.find(filter).sort({ stationCode: 1 }).skip(skip).limit(limit),
    Station.countDocuments(filter),
  ])

  return res.status(200).json(
    new apiResponse(200, { stations, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } }, 'Stations fetched')
  )
})

export const getStationById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const station = await Station.findOne({
    $or: [
      ...(id.match(/^[a-f\d]{24}$/i) ? [{ _id: id }] : []),
      { stationCode: id.toUpperCase() },
    ],
  })

  if (!station) throw new apiError(404, 'Station not found')

  return res.status(200).json(new apiResponse(200, { station }, 'Station fetched'))
})

export const updateStation = asyncHandler(async (req, res) => {
  const { id } = req.params
  const allowed = ['stationName', 'city', 'state', 'zone', 'isActive', 'latitude', 'longitude']

  const updateData = {}
  allowed.forEach((f) => { if (req.body[f] !== undefined) updateData[f] = req.body[f] })

  if (!Object.keys(updateData).length)
    throw new apiError(400, 'No valid fields to update')

  const station = await Station.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
  if (!station) throw new apiError(404, 'Station not found')

  return res.status(200).json(new apiResponse(200, { station }, 'Station updated'))
})