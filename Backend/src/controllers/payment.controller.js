import Razorpay from 'razorpay'
import crypto from 'crypto'
import { asyncHandler } from '../utils/asyncHandler.js'
import apiError from '../utils/apiError.js'
import apiResponse from '../utils/apiResponse.js'
import { Booking } from '../models/booking.model.js'
import { sendBookingConfirmationEmail } from '../utils/email.util.js'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

export const initiatePayment = asyncHandler(async (req, res) => {
  const { pnr } = req.body

  if (!pnr) {
    throw new apiError(400, 'PNR is required')
  }

  const booking = await Booking.findOne({ pnr })
  if (!booking) {
    throw new apiError(404, 'Booking not found')
  }

  if (booking.user.toString() !== req.user._id.toString()) {
    throw new apiError(403, 'Not authorized')
  }

  if (booking.paymentStatus !== 'pending') {
    throw new apiError(400, `Payment status is already: ${booking.paymentStatus}`)
  }

  if (booking.bookingStatus === 'cancelled') {
    throw new apiError(400, 'Cannot pay for a cancelled booking')
  }

  const amountInPaise = Math.round(booking.fare.totalFare * 100)

  let order;
  try {
    order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: pnr,
    })
  } catch (err) {
    throw new apiError(502, `Razorpay error: ${err.message}`)
  }

  booking.razorpayOrderId = order.id;
  await booking.save({ validateBeforeSave: false })

  return res.status(200).json(
    new apiResponse(
      200,
      {
        orderId: order.id,
        amount: amountInPaise,
        currency: 'INR',
        key: process.env.RAZORPAY_KEY_ID,
        pnr,
      },
      'Payment initiated'
    )
  )
})

export const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, pnr } = req.body

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !pnr) {
    throw new apiError(400, 'All payment fields and pnr are required')
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  if (expectedSignature !== razorpay_signature) {
    throw new apiError(400, 'Invalid payment signature')
  }

  const booking = await Booking.findOne({ pnr })
  if (!booking) {
    throw new apiError(404, 'Booking not found')
  }

  if (booking.user.toString() !== req.user._id.toString()) {
    throw new apiError(403, 'Not authorized')
  }

  if (booking.razorpayOrderId !== razorpay_order_id) {
    throw new apiError(400, 'Order ID mismatch')
  }

  booking.paymentStatus = 'paid'
  booking.razorpayPaymentId = razorpay_payment_id
  booking.paidAt = new Date()
  await booking.save({ validateBeforeSave: false })

  const populated = await Booking.findById(booking._id)
    .populate('train', 'trainName trainNumber')
    .populate('fromStation', 'stationCode stationName city')
    .populate('toStation', 'stationCode stationName city')
    .populate('user', 'name email')

  try {
    await sendBookingConfirmationEmail(populated)
  } catch (err) {
    console.error('Confirmation email failed:', err.message)
  }

  return res.status(200).json(
    new apiResponse(
      200,
      {
        pnr,
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.bookingStatus,
        razorpayPaymentId: razorpay_payment_id,
      },
      'Payment verified'
    )
  )
})