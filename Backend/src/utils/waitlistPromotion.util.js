import { Booking } from "../models/booking.model.js";
import { Schedule } from "../models/schedule.model.js";

export async function promoteWaitlist({ scheduleId, coachClass, cancelledPassengerCount }) {
  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) {
    
    return { promotedToConfirmed: 0, promotedToRAC: 0 };
  }

  let promotedToConfirmed = 0;
  let promotedToRAC = 0;

  
  const bookingsToSave = [];

  for (let i = 0; i < cancelledPassengerCount; i++) {
    
    const racBooking = await Booking.findOne({
      schedule: scheduleId,
      coachClass,
      status: 'RAC',
    }).sort({ racNumber: 1 });

    if (racBooking) {
      
      
      const passenger = racBooking.passengers.find((p) => p.status === 'RAC');
      if (passenger) {
        passenger.status = 'confirmed';
        
        const seatInfo = allocateNextSeat(schedule, coachClass);
        if (seatInfo) {
          passenger.coachNumber = seatInfo.coachNumber;
          passenger.seatNumber = seatInfo.seatNumber;
          passenger.berthType = seatInfo.berthType;
        }
        passenger.racNumber = undefined;
      }

      racBooking.status = 'confirmed';
      racBooking.racNumber = undefined;

      
      if (schedule.availableRAC && schedule.availableRAC.get) {
        const currentRAC = schedule.availableRAC.get(coachClass) ?? 0;
        schedule.availableRAC.set(coachClass, currentRAC + 1); 
      } else if (schedule.availableRAC) {
        schedule.availableRAC[coachClass] = (schedule.availableRAC[coachClass] ?? 0) + 1;
      }

      bookingsToSave.push(racBooking);
      promotedToConfirmed += 1;

      
      const waitlistBooking = await Booking.findOne({
        schedule: scheduleId,
        coachClass,
        status: 'waitlist',
      }).sort({ waitlistNumber: 1 });

      if (waitlistBooking) {
        const wPassenger = waitlistBooking.passengers.find((p) => p.status === 'waitlist');
        if (wPassenger) {
          
          const nextRACNumber = await getNextRACNumber(scheduleId, coachClass);
          wPassenger.status = 'RAC';
          wPassenger.racNumber = nextRACNumber;
          wPassenger.waitlistNumber = undefined;
        }

        waitlistBooking.status = 'RAC';
        waitlistBooking.racNumber = waitlistBooking.passengers.find((p) => p.status === 'RAC')?.racNumber;
        waitlistBooking.waitlistNumber = undefined;

        
        if (schedule.waitlistCount && schedule.waitlistCount.get) {
          const currentWL = schedule.waitlistCount.get(coachClass) ?? 0;
          schedule.waitlistCount.set(coachClass, Math.max(0, currentWL - 1));
        } else if (schedule.waitlistCount) {
          schedule.waitlistCount[coachClass] = Math.max(
            0,
            (schedule.waitlistCount[coachClass] ?? 0) - 1
          );
        }

        bookingsToSave.push(waitlistBooking);
        promotedToRAC += 1;
      }
    }
  }

  
  await Promise.all([
    schedule.save(),
    ...bookingsToSave.map((b) => b.save()),
  ]);

  return { promotedToConfirmed, promotedToRAC };
}

async function getNextRACNumber(scheduleId, coachClass) {
  const lastRAC = await Booking.findOne({
    schedule: scheduleId,
    coachClass,
    status: 'RAC',
  })
    .sort({ racNumber: -1 })
    .select('racNumber')
    .lean();

  return (lastRAC?.racNumber ?? 0) + 1;
}

function allocateNextSeat(schedule, coachClass) {
  
  if (!schedule.coaches) return null;

  const coaches = schedule.coaches.filter((c) => c.coachClass === coachClass);
  for (const coach of coaches) {
    if (!coach.seats) continue;
    const freeSeat = coach.seats.find((s) => s.status === 'available');
    if (freeSeat) {
      freeSeat.status = 'booked'; 
      return {
        coachNumber: coach.coachNumber,
        seatNumber: freeSeat.seatNumber,
        berthType: freeSeat.berthType,
      };
    }
  }
  return null;
}