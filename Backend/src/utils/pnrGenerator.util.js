import { Booking } from "../models/booking.model.js";

function buildPNRCandidate() {
  const year = new Date().getFullYear().toString(); 
  const randomPart = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');
  return year + randomPart; 
}

export async function generateUniquePNR() {
  const pnr = buildPNRCandidate();

  const existing = await Booking.findOne({ pnr }).lean();
  if (existing) {
    return generateUniquePNR();
  }

  return pnr;
}