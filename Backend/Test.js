



import { generateTicketPDF } from './src/utils/pdf.util.js';
import fs from 'fs';

const mockBooking = {
  pnr: '2026047391',
  trainName: 'Rajdhani Express',
  trainNumber: '12301',
  fromStation: 'New Delhi',
  toStation: 'Mumbai Central',
  journeyDate: new Date('2026-08-15'),
  coachClass: '3A',
  isSuperfast: true,
  bookingStatus: 'confirmed',
  bookedAt: new Date(),
  passengers: [
    {
      name: 'Arjun Mehta',
      age: 28,
      gender: 'Male',
      idType: 'Aadhaar',
      coachNumber: 'B2',
      seatNumber: 14,
      berthType: 'lower',
      status: 'confirmed',
    },
    {
      name: 'Priya Mehta',
      age: 25,
      gender: 'Female',
      idType: 'Passport',
      coachNumber: 'B2',
      seatNumber: 15,
      berthType: 'middle',
      status: 'confirmed',
    },
    {
      name: 'Ravi Kumar',
      age: 35,
      gender: 'Male',
      idType: 'Voter ID',
      coachNumber: null,
      racNumber: 3,
      status: 'RAC',
    },
  ],
  fare: {
    baseFare: 1450,
    gst: 72,
    mealCost: 120,
    discountAmount: 0,
    totalFare: 1642,
  },
};

(async () => {
  try {
    console.log('Generating ticket PDF...');
    const buffer = await generateTicketPDF(mockBooking);
    fs.writeFileSync('./ticket.pdf', buffer);
    console.log('✅ ticket.pdf generated successfully —', buffer.length, 'bytes');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();