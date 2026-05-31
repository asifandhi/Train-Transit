import { RATE_PER_KM,RESERVATION_CHARGE,SUPERFAST_CHARGE,GST_RATE } from "../constant.js";

export function calculateFare({
  distanceKm,
  coachClass,
  isSuperfast,
  mealCost = 0,
  discountPercent = 0,
}) {
  // Distance-based component
  const baseDistance = distanceKm * RATE_PER_KM[coachClass];

  // Flat reservation fee for this class
  const reservationFee = RESERVATION_CHARGE[coachClass];

  // Superfast surcharge (flat ₹45 if applicable)
  const superfastCharge = isSuperfast ? SUPERFAST_CHARGE : 0;

  // Sum before GST and discounts
  const preGST = baseDistance + reservationFee + superfastCharge;

  // 5 % GST on pre-GST amount
  const gst = preGST * GST_RATE;

  // Discount applied on pre-GST amount
  const discountAmount = (preGST * discountPercent) / 100;

  // Final payable amount
  const totalFare = preGST + gst + mealCost - discountAmount;

  return {
    baseFare: Math.round(preGST),          // pre-GST base (rounded for display)
    gst: Math.round(gst),
    mealCost,
    discountAmount: Math.round(discountAmount),
    totalFare: Math.round(totalFare),
  };
}