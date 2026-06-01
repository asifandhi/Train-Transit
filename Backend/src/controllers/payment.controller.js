/**
 * 
 * remaining to understand 
 */
import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiError } from '../utils/apiError.js'
import apiResponse from '../utils/apiResponse.js'
import crypto from 'crypto'
import Booking from '../models/booking.model.js'
import { sendBookingConfirmationEmail } from '../services/email.service.js'

// ─────────────────────────────────────────────
// HELPER: lazy-init Razorpay instance
// ─────────────────────────────────────────────
const getRazorpayInstance = () => {
  const Razorpay = (await import('razorpay')).default
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

// ─────────────────────────────────────────────
// POST /api/payment/initiate  (auth)
// ─────────────────────────────────────────────
export const initiatePayment = asyncHandler(async (req, res) => {
  const { pnr } = req.body

  if (!pnr) {
    throw new ApiError(400, 'PNR is required')
  }

  const booking = await Booking.findOne({ pnr })
  if (!booking) {
    throw new ApiError(404, 'Booking not found for this PNR')
  }

  // Verify owner
  if (booking.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to pay for this booking')
  }

  if (booking.paymentStatus !== 'pending') {
    throw new ApiError(
      400,
      `Payment cannot be initiated. Current status: '${booking.paymentStatus}'`
    )
  }

  if (booking.bookingStatus === 'cancelled') {
    throw new ApiError(400, 'Cannot initiate payment for a cancelled booking')
  }

  // Validate Razorpay credentials
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new ApiError(500, 'Payment gateway not configured')
  }

  // Lazy-load Razorpay to avoid startup errors
  let Razorpay;
  try {
    Razorpay = (await import('razorpay')).default
  } catch {
    throw new ApiError(500, 'Payment gateway module not available')
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })

  const amountInPaise = Math.round(booking.fare.totalFare * 100)

  let order
  try {
    order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: pnr,
      notes: {
        pnr,
        userId: req.user._id.toString(),
      },
    })
  } catch (err) {
    throw new ApiError(502, `Razorpay order creation failed: ${err.message}`)
  }

  // Save Razorpay order ID to booking
  booking.razorpayOrderId = order.id
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
        bookingId: booking._id,
      },
      'Payment initiated successfully'
    )
  )
})

// ─────────────────────────────────────────────
// POST /api/payment/verify  (auth)
// ─────────────────────────────────────────────
export const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    pnr,
  } = req.body

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !pnr) {
    throw new ApiError(
      400,
      'razorpay_order_id, razorpay_payment_id, razorpay_signature, and pnr are required'
    )
  }

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, 'Payment verification failed: invalid signature')
  }

  // Find booking
  const booking = await Booking.findOne({ pnr })
  if (!booking) {
    throw new ApiError(404, 'Booking not found for this PNR')
  }

  // Verify owner
  if (booking.user.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to verify this payment')
  }

  if (booking.razorpayOrderId !== razorpay_order_id) {
    throw new ApiError(400, 'Order ID mismatch')
  }

  // Update booking payment details
  booking.paymentStatus = 'paid'
  booking.razorpayPaymentId = razorpay_payment_id
  booking.razorpaySignature = razorpay_signature
  booking.paidAt = new Date()

  await booking.save({ validateBeforeSave: false })

  // Populate booking for email
  const populatedBooking = await Booking.findById(booking._id)
    .populate('train', 'trainName trainNumber')
    .populate('fromStation', 'stationCode stationName city')
    .populate('toStation', 'stationCode stationName city')
    .populate('user', 'name email')

  // Send confirmation email (non-blocking)
  try {
    await sendBookingConfirmationEmail(populatedBooking)
  } catch (emailErr) {
    // Log but do not fail the request
    console.error('Email sending failed:', emailErr.message)
  }

  return res.status(200).json(
    new apiResponse(
      200,
      {
        success: true,
        pnr,
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        razorpayPaymentId: razorpay_payment_id,
      },
      'Payment verified and booking confirmed successfully'
    )
  )
})
