import { asyncHandler } from '../utils/asyncHandler.js'
import apiError from '../utils/apiError.js'
import apiResponse from '../utils/apiResponse.js'
import { Booking } from '../models/booking.model.js'
import { Cancellation } from '../models/cancellation.model.js'
import { User } from '../models/user.model.js'
import { Train } from '../models/train.model.js'

export const getAllBookings = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
  const skip  = (page - 1) * limit

  const filter = {}
  if (req.query.status)        filter.bookingStatus = req.query.status
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus
  if (req.query.trainId)       filter.train         = req.query.trainId
  if (req.query.coachClass)    filter.coachClass     = req.query.coachClass

  if (req.query.date) {
    const date = new Date(req.query.date)
    if (isNaN(date)) throw new apiError(400, 'Invalid date format. Use YYYY-MM-DD')
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)
    filter.journeyDate = { $gte: date, $lt: nextDay }
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('user',        'name email phone')
      .populate('train',       'trainName trainNumber')
      .populate('fromStation', 'stationCode stationName city')
      .populate('toStation',   'stationCode stationName city')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ])

  return res.status(200).json(
    new apiResponse(200, { bookings, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } }, 'Bookings fetched')
  )
})

export const getRevenueStats = asyncHandler(async (req, res) => {
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
  twelveMonthsAgo.setDate(1)
  twelveMonthsAgo.setHours(0, 0, 0, 0)

  const monthlyRevenue = await Booking.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: twelveMonthsAgo } } },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$fare.totalFare' }, bookings: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $project: { _id: 0, year: '$_id.year', month: '$_id.month', revenue: { $round: ['$revenue', 2] }, bookings: 1 } },
  ])

  const [totalStats] = await Booking.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, totalRevenue: { $sum: '$fare.totalFare' }, totalBookings: { $sum: 1 } } },
  ])

  const totalCancellations = await Cancellation.countDocuments()

  return res.status(200).json(
    new apiResponse(200, {
      totalRevenue:       Math.round((totalStats?.totalRevenue  ?? 0) * 100) / 100,
      totalBookings:      totalStats?.totalBookings ?? 0,
      totalCancellations,
      monthlyRevenue,
    }, 'Revenue stats fetched')
  )
})

export const processRefund = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { refundRazorpayId } = req.body

  // Only update fields that exist in cancellation.model.js
  const updateData = { refundStatus: 'processed' }
  if (refundRazorpayId) updateData.refundRazorpayId = refundRazorpayId

  const cancellation = await Cancellation.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
    .populate('booking', 'pnr journeyDate coachClass fare')
    .populate('user',    'name email')

  if (!cancellation) throw new apiError(404, 'Cancellation record not found')

  return res.status(200).json(new apiResponse(200, { cancellation }, 'Refund marked as processed'))
})

export const getReports = asyncHandler(async (req, res) => {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)

  const [totalUsers, totalTrains, bookingsToday, revenueTodayData, topTrainsData] = await Promise.all([
    User.countDocuments({ isActive: true }),
    Train.countDocuments({ isActive: true }),
    Booking.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),

    Booking.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: todayStart, $lte: todayEnd } } },
      { $group: { _id: null, revenue: { $sum: '$fare.totalFare' } } },
    ]),

    Booking.aggregate([
      { $match: { bookingStatus: { $ne: 'cancelled' } } },
      { $group: { _id: '$train', totalBookings: { $sum: 1 }, totalRevenue: { $sum: '$fare.totalFare' } } },
      { $sort: { totalBookings: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'trains', localField: '_id', foreignField: '_id', as: 'trainDetails' } },
      { $project: {
        _id: 0,
        trainId:      '$_id',
        totalBookings: 1,
        totalRevenue: { $round: ['$totalRevenue', 2] },
        trainName:    { $arrayElemAt: ['$trainDetails.trainName',   0] },
        trainNumber:  { $arrayElemAt: ['$trainDetails.trainNumber', 0] },
      }},
    ]),
  ])

  return res.status(200).json(
    new apiResponse(200, {
      totalUsers,
      totalTrains,
      bookingsToday,
      revenueToday:        Math.round((revenueTodayData[0]?.revenue ?? 0) * 100) / 100,
      topTrainsByBookings: topTrainsData,
    }, 'Reports fetched')
  )
})