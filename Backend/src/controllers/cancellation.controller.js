import { asyncHandler } from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import { Booking } from "../models/booking.model.js";
import { Cancellation } from "../models/cancellation.model.js";
import { Schedule } from "../models/schedule.model.js";
import { calculateRefund } from "../utils/refundCalc.util.js";
import { promoteWaitlist } from "../utils/waitlistPromotion.util.js";
import { sendCancellationEmail } from "../utils/email.util.js";

export const cancelBooking = asyncHandler(async (req, res) => {
  const { PNR } = req.params;
  const { reason } = req.body;

  const booking = await Booking.findOne({ pnr: PNR })
    .populate("train", "trainName trainNumber")
    .populate("fromStation", "stationCode stationName city")
    .populate("toStation", "stationCode stationName city")
    .populate("user", "name email phone")
    .populate("schedule");

  if (!booking) throw new apiError(404, "Booking not found for this PNR");

  const isOwner = booking.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin)
    throw new apiError(403, "Not authorized to cancel this booking");

  if (booking.bookingStatus === "cancelled")
    throw new apiError(400, "Booking already cancelled");
  if (booking.bookingStatus === "completed")
    throw new apiError(400, "Cannot cancel a completed journey");

  const schedule = booking.schedule;
  if (!schedule) throw new apiError(500, "Associated schedule not found");

  const now = new Date();
  const departureDatetime = new Date(schedule.departureDatetime);

  if (now >= departureDatetime)
    throw new apiError(400, "Cannot cancel after train has departed");

  const { refundPercent, refundAmount, hoursBeforeDeparture } = calculateRefund(
    booking.fare.totalFare,
    departureDatetime
  );

  const cancellation = await Cancellation.create({
    booking: booking._id,
    pnr: PNR,
    user: req.user._id,
    cancelledAt: now,
    hoursBeforeDeparture,
    refundPercent,
    refundAmount,
    originalFare: booking.fare.totalFare,
    refundStatus: booking.paymentStatus === "paid" ? "pending" : "processed",
    reason: reason || "Not specified",
  });

  const cls = booking.coachClass;
  const counts = { confirmed: 0, RAC: 0, waitlist: 0 };
  booking.passengers.forEach((p) => {
    if (p.status === "confirmed") counts.confirmed += 1;
    else if (p.status === "RAC") counts.RAC += 1;
    else if (p.status === "waitlist") counts.waitlist += 1;
  });

  const incUpdate = {};
  if (counts.confirmed > 0)
    incUpdate[`availableSeats.${cls}`] = counts.confirmed;
  if (counts.RAC > 0) incUpdate[`availableRAC.${cls}`] = counts.RAC;
  if (counts.waitlist > 0) incUpdate[`waitlistCount.${cls}`] = -counts.waitlist;

  if (Object.keys(incUpdate).length > 0) {
    await Schedule.findByIdAndUpdate(schedule._id, { $inc: incUpdate });
  }

  booking.bookingStatus = "cancelled";
  if (booking.paymentStatus === "paid") booking.paymentStatus = "refunded";
  await booking.save({ validateBeforeSave: false });

  try {
    await promoteWaitlist(schedule._id, cls);
  } catch (err) {
    console.error("Waitlist promotion failed:", err.message);
  }

  try {
    await sendCancellationEmail(booking, cancellation);
  } catch (err) {
    console.error("Cancellation email failed:", err.message);
  }

  return res.status(200).json(
    new apiResponse(
      200,
      {
        pnr: PNR,
        bookingStatus: "cancelled",
        refundPercent,
        refundAmount: cancellation.refundAmount,
        hoursBeforeDeparture,
        refundStatus: cancellation.refundStatus,
        cancellationId: cancellation._id,
      },
      "Booking cancelled successfully"
    )
  );
});

export const getRefundStatus = asyncHandler(async (req, res) => {
  const { PNR } = req.params;

  const cancellation = await Cancellation.findOne({ pnr: PNR })
    .populate("booking", "pnr journeyDate coachClass fare bookingStatus")
    .populate("user", "name email");

  if (!cancellation)
    throw new apiError(404, "No cancellation record found for this PNR");

  const isOwner = cancellation.user._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin)
    throw new apiError(403, "Not authorized to view this refund");

  return res.status(200).json(
    new apiResponse(
      200,
      {
        pnr: PNR,
        refundPercent: cancellation.refundPercent,
        refundAmount: cancellation.refundAmount,
        refundStatus: cancellation.refundStatus,
        originalFare: cancellation.originalFare,
        hoursBeforeDeparture: cancellation.hoursBeforeDeparture,
        cancelledAt: cancellation.cancelledAt,
        reason: cancellation.reason,
        refundRazorpayId: cancellation.refundRazorpayId || null,
      },
      "Refund status fetched"
    )
  );
});
