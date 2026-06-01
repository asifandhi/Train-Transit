import { asyncHandler } from '../utils/asyncHandler.js'
import apiError from '../utils/apiError.js'
import apiResponse from '../utils/apiResponse.js'
import { Schedule } from '../models/schedule.model.js'
import { Route } from '../models/route.model.js'
import { Train } from '../models/train.model.js'
import Coach from '../models/coach.model.js'

const buildDateTime = (baseDate, timeStr, dayOffset = 0) => {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':').map(Number)
  const dt = new Date(baseDate)
  dt.setDate(dt.getDate() + dayOffset)
  dt.setHours(h, m, 0, 0)
  return dt
}

function* dateRange(start, end) {
  const cur = new Date(start)
  cur.setHours(0, 0, 0, 0)
  const last = new Date(end)
  last.setHours(0, 0, 0, 0)
  while (cur <= last) {
    yield new Date(cur)
    cur.setDate(cur.getDate() + 1)
  }
}

export const generateSchedules = asyncHandler(async (req, res) => {
  const { trainId, startDate, endDate } = req.body

  if (!trainId || !startDate || !endDate)
    throw new apiError(400, 'trainId, startDate, endDate are required')

  const start = new Date(startDate)
  const end   = new Date(endDate)

  if (isNaN(start) || isNaN(end)) throw new apiError(400, 'Invalid date format. Use YYYY-MM-DD')
  if (start > end)                throw new apiError(400, 'startDate must be before endDate')

  const daysDiff = (end - start) / (1000 * 60 * 60 * 24)
  if (daysDiff > 365) throw new apiError(400, 'Cannot generate more than 365 days at once')

  const train = await Train.findById(trainId)
  if (!train) throw new apiError(404, 'Train not found')

  const route = await Route.findOne({ train: trainId, isActive: true })
    .populate('stops.station', 'stationCode stationName')
  if (!route || route.stops.length < 2)
    throw new apiError(404, 'No active route with 2+ stops found for this train')

  const coaches = await Coach.find({ train: trainId, isActive: true })
  if (!coaches.length) throw new apiError(404, 'No active coaches found for this train')

  // Aggregate seat/RAC counts per class
  const seatsPerClass = {}
  const racPerClass   = {}

  coaches.forEach((c) => {
    seatsPerClass[c.coachClass] = (seatsPerClass[c.coachClass] || 0) + c.totalSeats
    racPerClass[c.coachClass]   = (racPerClass[c.coachClass]   || 0) + (c.totalRACBerths || 0)
  })

  const sortedStops  = [...route.stops].sort((a, b) => a.stopNumber - b.stopNumber)
  const originStop   = sortedStops[0]
  const destStop     = sortedStops[sortedStops.length - 1]

  let createdCount = 0
  let skippedCount = 0

  for (const journeyDate of dateRange(start, end)) {
    const existing = await Schedule.findOne({ train: trainId, journeyDate })
    if (existing) { skippedCount++; continue }

    const departureDateTime = buildDateTime(journeyDate, originStop.departureTime, originStop.dayOffset || 0)
    const arrivalDateTime   = buildDateTime(journeyDate, destStop.arrivalTime,     destStop.dayOffset   || 0)

    await Schedule.create({
      train:           trainId,
      route:           route._id,
      journeyDate,
      departureDateTime,
      arrivalDateTime,
      availableSeats:  { ...seatsPerClass },
      availableRAC:    { ...racPerClass },
      waitlistCount:   Object.fromEntries(Object.keys(seatsPerClass).map((cls) => [cls, 0])),
      status:          'scheduled',
    })

    createdCount++
  }

  return res.status(201).json(
    new apiResponse(201, { created: createdCount, skipped: skippedCount, trainId, startDate, endDate },
      `Schedules generated: ${createdCount} created, ${skippedCount} skipped`)
  )
})

export const getScheduleByTrainAndDate = asyncHandler(async (req, res) => {
  const { trainId, date } = req.params

  const journeyDate = new Date(date)
  if (isNaN(journeyDate)) throw new apiError(400, 'Invalid date format. Use YYYY-MM-DD')
  journeyDate.setHours(0, 0, 0, 0)

  const nextDay = new Date(journeyDate)
  nextDay.setDate(nextDay.getDate() + 1)

  const schedule = await Schedule.findOne({
    train: trainId,
    journeyDate: { $gte: journeyDate, $lt: nextDay },
  })
    .populate('train', 'trainName trainNumber trainType isSuperfast')
    .populate('route')

  if (!schedule) throw new apiError(404, `No schedule found for this train on ${date}`)

  return res.status(200).json(new apiResponse(200, { schedule }, 'Schedule fetched'))
})