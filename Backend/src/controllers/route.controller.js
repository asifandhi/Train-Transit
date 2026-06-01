import { asyncHandler } from '../utils/asyncHandler.js'
import apiError from '../utils/apiError.js'
import apiResponse from '../utils/apiResponse.js'
import { Route } from '../models/route.model.js'
import { Train } from '../models/train.model.js'

export const createRoute = asyncHandler(async (req, res) => {
  const { trainId, stops, totalDistance } = req.body

  if (!trainId || !Array.isArray(stops) || stops.length < 2 || !totalDistance)
    throw new apiError(400, 'trainId, stops (min 2), totalDistance are required')

  if (totalDistance <= 0) throw new apiError(400, 'totalDistance must be positive')

  const train = await Train.findById(trainId)
  if (!train) throw new apiError(404, 'Train not found')

  const existing = await Route.findOne({ train: trainId, isActive: true })
  if (existing) throw new apiError(409, 'Route already exists for this train. Use PUT to update.')

  stops.forEach((stop, i) => {
    if (!stop.stationId)                      throw new apiError(400, `Stop ${i}: stationId required`)
    if (stop.stopNumber === undefined)        throw new apiError(400, `Stop ${i}: stopNumber required`)
    if (stop.distanceFromOrigin === undefined) throw new apiError(400, `Stop ${i}: distanceFromOrigin required`)
  })

  const formattedStops = stops
    .map((s) => ({
      station:            s.stationId,
      stopNumber:         s.stopNumber,
      arrivalTime:        s.arrivalTime   || null,
      departureTime:      s.departureTime || null,
      haltMinutes:        s.haltMinutes   || 0,
      distanceFromOrigin: s.distanceFromOrigin,
      platformNumber:     s.platformNumber || 1,
      dayOffset:          s.dayOffset      || 0,
    }))
    .sort((a, b) => a.stopNumber - b.stopNumber)

  const route = await Route.create({ train: trainId, stops: formattedStops, totalDistance })

  return res.status(201).json(new apiResponse(201, { route }, 'Route created'))
})

export const getRouteByTrain = asyncHandler(async (req, res) => {
  const { trainId } = req.params

  const route = await Route.findOne({ train: trainId, isActive: true })
    .populate('train', 'trainName trainNumber trainType isSuperfast')
    .populate('stops.station', 'stationCode stationName city state')

  if (!route) throw new apiError(404, 'Route not found for this train')

  return res.status(200).json(new apiResponse(200, { route }, 'Route fetched'))
})

export const updateRoute = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { stops, totalDistance } = req.body

  const route = await Route.findById(id)
  if (!route) throw new apiError(404, 'Route not found')

  if (stops !== undefined) {
    if (!Array.isArray(stops) || stops.length < 2)
      throw new apiError(400, 'stops must have at least 2 entries')

    route.stops = stops
      .map((s) => ({
        station:            s.stationId,
        stopNumber:         s.stopNumber,
        arrivalTime:        s.arrivalTime   || null,
        departureTime:      s.departureTime || null,
        haltMinutes:        s.haltMinutes   || 0,
        distanceFromOrigin: s.distanceFromOrigin,
        platformNumber:     s.platformNumber || 1,
        dayOffset:          s.dayOffset      || 0,
      }))
      .sort((a, b) => a.stopNumber - b.stopNumber)
  }

  if (totalDistance !== undefined) {
    if (totalDistance <= 0) throw new apiError(400, 'totalDistance must be positive')
    route.totalDistance = totalDistance
  }

  await route.save()

  const updated = await Route.findById(id)
    .populate('train', 'trainName trainNumber')
    .populate('stops.station', 'stationCode stationName city state')

  return res.status(200).json(new apiResponse(200, { route: updated }, 'Route updated'))
})