import { Seat } from "../models/seat.model.js";
















export async function assignSeat(trainId, coachClass, usedSeatIds = new Set()) {
  
  
  
  
  
  const seat = await Seat.findOne({
    train:      trainId,
    coachClass: coachClass,
    isRAC:      false,
    _id:        { $nin: [...usedSeatIds] },
  }).populate("coach", "coachNumber"); 

  if (!seat) {
    
    
    return null;
  }

  
  usedSeatIds.add(seat._id.toString());

  return {
    seatNumber:  seat.seatNumber,
    coachNumber: seat.coach?.coachNumber ?? "N/A",
  };
}
