import { REFUND_RULES } from "../constant.js";

export function calculateRefund({ totalFare, departureDateTime }) {
  const nowMs = Date.now();
  let departureMs;

  if (departureDateTime instanceof Date) {
    
    departureMs = departureDateTime.getTime();
  } else {
    
    departureMs = departureDateTime;
  }

  const hoursBeforeDeparture = (departureMs - nowMs) / (1000 * 60 * 60);

  let refundPercent = 0;

  if (hoursBeforeDeparture > 0) {
    for (const rule of REFUND_RULES) {
      if (hoursBeforeDeparture >= rule.minHours) {
        refundPercent = rule.refundPercent;
        break;
      }
    }
  }
  const refundAmount = (totalFare * refundPercent) / 100;

  return {
    hoursBeforeDeparture: Math.floor(hoursBeforeDeparture),
    refundPercent,
    refundAmount: Math.round(refundAmount),
  };
}