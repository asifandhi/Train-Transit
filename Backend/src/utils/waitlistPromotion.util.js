import { Booking } from "../models/booking.model.js";
import { Schedule } from "../models/schedule.model.js";

export async function promoteWaitlist({ scheduleId, coachClass, cancelledPassengerCount }) {
  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) {
    // Nothing to promote if the schedule can't be found
    return { promotedToConfirmed: 0, promotedToRAC: 0 };
  }

  let promotedToConfirmed = 0;
  let promotedToRAC = 0;

  // Collect all modified bookings so we can bulk-save at the end
  const bookingsToSave = [];

  for (let i = 0; i < cancelledPassengerCount; i++) {
    // ── Step A: Promote first RAC booking → confirmed ─────────────────────────
    const racBooking = await Booking.findOne({
      schedule: scheduleId,
      coachClass,
      status: 'RAC',
    }).sort({ racNumber: 1 });

    if (racBooking) {
      // Find a free confirmed seat from the schedule seat map (implementation depends on
      // your Schedule model's seat tracking). We update the passenger record directly.
      const passenger = racBooking.passengers.find((p) => p.status === 'RAC');
      if (passenger) {
        passenger.status = 'confirmed';
        // Assign the next available confirmed seat from the schedule
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

      // Update schedule counters
      if (schedule.availableRAC && schedule.availableRAC.get) {
        const currentRAC = schedule.availableRAC.get(coachClass) ?? 0;
        schedule.availableRAC.set(coachClass, currentRAC + 1); // one RAC slot freed
      } else if (schedule.availableRAC) {
        schedule.availableRAC[coachClass] = (schedule.availableRAC[coachClass] ?? 0) + 1;
      }

      bookingsToSave.push(racBooking);
      promotedToConfirmed += 1;

      // ── Step B: Promote first waitlist booking → RAC ───────────────────────
      const waitlistBooking = await Booking.findOne({
        schedule: scheduleId,
        coachClass,
        status: 'waitlist',
      }).sort({ waitlistNumber: 1 });

      if (waitlistBooking) {
        const wPassenger = waitlistBooking.passengers.find((p) => p.status === 'waitlist');
        if (wPassenger) {
          // Assign the next available RAC number
          const nextRACNumber = await getNextRACNumber(scheduleId, coachClass);
          wPassenger.status = 'RAC';
          wPassenger.racNumber = nextRACNumber;
          wPassenger.waitlistNumber = undefined;
        }

        waitlistBooking.status = 'RAC';
        waitlistBooking.racNumber = waitlistBooking.passengers.find((p) => p.status === 'RAC')?.racNumber;
        waitlistBooking.waitlistNumber = undefined;

        // Update schedule waitlist counter
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

  // ── Persist all changes ───────────────────────────────────────────────────
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
  // Try to pull from schedule.coaches if the field exists
  if (!schedule.coaches) return null;

  const coaches = schedule.coaches.filter((c) => c.coachClass === coachClass);
  for (const coach of coaches) {
    if (!coach.seats) continue;
    const freeSeat = coach.seats.find((s) => s.status === 'available');
    if (freeSeat) {
      freeSeat.status = 'booked'; // mark as taken in memory (schedule.save() persists this)
      return {
        coachNumber: coach.coachNumber,
        seatNumber: freeSeat.seatNumber,
        berthType: freeSeat.berthType,
      };
    }
  }
  return null;
}