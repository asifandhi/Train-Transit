import { Seat } from "../models/seat.model.js";

// ─────────────────────────────────────────────────────────────────────────────
// assignSeat()
//
// Finds an available seat from the Seat collection for a confirmed passenger.
//
// Parameters:
//   trainId     — the train's MongoDB ObjectId
//   coachClass  — e.g. "SL", "3A", "2A", "1A"
//   usedSeatIds — a Set of Seat _id strings already assigned in this booking
//                 (prevents two passengers in same booking getting same seat)
//
// Returns:
//   { seatNumber, coachNumber }  if a seat was found
//   null                         if no seat is available (graceful fallback)
// ─────────────────────────────────────────────────────────────────────────────
export async function assignSeat(trainId, coachClass, usedSeatIds = new Set()) {
  // Find one seat that:
  //   - belongs to the correct train
  //   - is in the correct coach class
  //   - is not an RAC berth
  //   - hasn't already been used in this booking
  const seat = await Seat.findOne({
    train:      trainId,
    coachClass: coachClass,
    isRAC:      false,
    _id:        { $nin: [...usedSeatIds] },
  }).populate("coach", "coachNumber"); // also get the coach's number (e.g. "S1", "B2")

  if (!seat) {
    // No seat found — gracefully return null.
    // Booking still goes through, seatNumber will just be null.
    return null;
  }

  // Mark this seat as used so no other passenger in this booking gets it
  usedSeatIds.add(seat._id.toString());

  return {
    seatNumber:  seat.seatNumber,
    coachNumber: seat.coach?.coachNumber ?? "N/A",
  };
}
