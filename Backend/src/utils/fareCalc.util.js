import { RATE_PER_KM,RESERVATION_CHARGE,SUPERFAST_CHARGE,GST_RATE } from "../constant.js";

export function calculateFare({
  distanceKm,
  coachClass,
  isSuperfast,
  mealCost = 0,
  discountPercent = 0,
}) {
  
  const baseDistance = distanceKm * RATE_PER_KM[coachClass];

  
  const reservationFee = RESERVATION_CHARGE[coachClass];

  
  const superfastCharge = isSuperfast ? SUPERFAST_CHARGE : 0;

  
  const preGST = baseDistance + reservationFee + superfastCharge;

  
  const gst = preGST * GST_RATE;

  
  const discountAmount = (preGST * discountPercent) / 100;

  
  const totalFare = preGST + gst + mealCost - discountAmount;

  return {
    baseFare: Math.round(preGST),          
    gst: Math.round(gst),
    mealCost,
    discountAmount: Math.round(discountAmount),
    totalFare: Math.round(totalFare),
  };
}