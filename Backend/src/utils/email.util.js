import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
});

const BRAND_PRIMARY = "#1a56db";
const BRAND_DARK = "#1e2a45";
const BRAND_LIGHT_BG = "#f4f7ff";

function emailShell(title, bodyHtml) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND_LIGHT_BG};font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_LIGHT_BG};padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:8px;overflow:hidden;
                      box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:${BRAND_DARK};padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:1px;">
                🚆 TrainTransit
              </h1>
              <p style="margin:4px 0 0;color:#a0b4d6;font-size:13px;">Your Trusted Rail Booking Partner</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f0f4ff;padding:18px 32px;border-top:1px solid #dde6f5;">
              <p style="margin:0;font-size:12px;color:#7a8aa0;text-align:center;">
                This is an automated message from TrainTransit. Please do not reply to this email.<br/>
                © ${new Date().getFullYear()} TrainTransit. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function infoRow(label, value) {
  return `
    <tr>
      <td style="padding:8px 0;color:#4a5568;font-size:14px;width:160px;vertical-align:top;">${label}</td>
      <td style="padding:8px 0;color:#1a202c;font-size:14px;font-weight:600;vertical-align:top;">${value}</td>
    </tr>
  `;
}

export async function sendBookingConfirmationEmail({
  to,
  passengerName,
  pnr,
  trainName,
  fromStation,
  toStation,
  journeyDate,
  coachClass,
  totalFare,
}) {
  const bodyHtml = `
    <h2 style="color:${BRAND_DARK};margin:0 0 4px;">Booking Confirmed! ✅</h2>
    <p style="color:#4a5568;margin:0 0 24px;font-size:15px;">
      Dear <strong>${passengerName}</strong>, your ticket has been booked successfully.
    </p>

    <!-- PNR highlight box -->
    <div style="background:${BRAND_LIGHT_BG};border:2px dashed ${BRAND_PRIMARY};
                border-radius:8px;padding:16px 24px;text-align:center;margin-bottom:28px;">
      <p style="margin:0;font-size:13px;color:#6b7280;letter-spacing:1px;">YOUR PNR NUMBER</p>
      <p style="margin:6px 0 0;font-size:32px;font-weight:700;color:${BRAND_PRIMARY};
                letter-spacing:4px;">${pnr}</p>
    </div>

    <!-- Journey details table -->
    <table width="100%" cellpadding="0" cellspacing="0"
           style="border:1px solid #e2e8f0;border-radius:6px;padding:16px 20px;margin-bottom:24px;">
      <tbody>
        ${infoRow('🚆 Train', trainName)}
        ${infoRow('📍 From', fromStation)}
        ${infoRow('📍 To', toStation)}
        ${infoRow('📅 Journey Date', journeyDate)}
        ${infoRow('🪑 Class', coachClass)}
        ${infoRow('💰 Total Fare', `₹ ${totalFare.toLocaleString('en-IN')}`)}
      </tbody>
    </table>

    <p style="font-size:13px;color:#6b7280;margin:0 0 6px;">
      ℹ️ Carry a valid government-issued photo ID proof during your journey.
    </p>
    <p style="font-size:13px;color:#6b7280;margin:0;">
      You can check your booking status anytime on the TrainTransit portal using your PNR.
    </p>
  `;

  const info = await transporter.sendMail({
    from: `"TrainTransit" <${process.env.EMAIL_USER}>`,
    to ,
    subject: `✅ Booking Confirmed — PNR ${pnr} | ${trainName}`,
    html: emailShell('Booking Confirmation – TrainTransit', bodyHtml),
  });

  return info;
}

export async function sendCancellationEmail({ to, passengerName, pnr, refundAmount }) {
  const refundLine =
    refundAmount > 0
      ? `<p style="margin:0 0 8px;font-size:15px;color:#065f46;">
           Refund amount of <strong>₹ ${refundAmount.toLocaleString('en-IN')}</strong> will be
           credited to your original payment method within <strong>5–7 working days</strong>.
         </p>`
      : `<p style="margin:0 0 8px;font-size:15px;color:#991b1b;">
           As per our cancellation policy, <strong>no refund</strong> is applicable for this
           cancellation.
         </p>`;

  const bodyHtml = `
    <h2 style="color:${BRAND_DARK};margin:0 0 4px;">Booking Cancelled 🚫</h2>
    <p style="color:#4a5568;margin:0 0 24px;font-size:15px;">
      Dear <strong>${passengerName}</strong>, your booking has been cancelled as requested.
    </p>

    <!-- PNR -->
    <div style="background:#fff7f7;border:1px solid #fca5a5;border-radius:6px;
                padding:14px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#6b7280;">Cancelled PNR</p>
      <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#dc2626;
                letter-spacing:3px;">${pnr}</p>
    </div>

    <!-- Refund info -->
    <div style="background:${refundAmount > 0 ? '#ecfdf5' : '#fff1f2'};
                border-radius:6px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;
                color:${refundAmount > 0 ? '#064e3b' : '#881337'};">
        Refund Status
      </p>
      ${refundLine}
    </div>

    <p style="font-size:13px;color:#6b7280;margin:0;">
      If you have any questions, please contact our support team via the TrainTransit portal.
    </p>
  `;

  const info = await transporter.sendMail({
    from: `"TrainTransit" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Booking Cancelled — PNR ${pnr}`,
    html: emailShell('Booking Cancellation – TrainTransit', bodyHtml),
  });

  return info;
}

export async function sendOTPEmail({ to, otp }) {
  const bodyHtml = `
    <h2 style="color:${BRAND_DARK};margin:0 0 4px;">Verify Your Account 🔐</h2>
    <p style="color:#4a5568;margin:0 0 24px;font-size:15px;">
      Use the OTP below to complete your verification. It is valid for <strong>10 minutes</strong>.
    </p>

    <!-- OTP box -->
    <div style="background:${BRAND_LIGHT_BG};border:2px solid ${BRAND_PRIMARY};
                border-radius:8px;padding:20px 24px;text-align:center;margin-bottom:28px;">
      <p style="margin:0;font-size:13px;color:#6b7280;letter-spacing:1px;">ONE-TIME PASSWORD</p>
      <p style="margin:10px 0 0;font-size:40px;font-weight:800;color:${BRAND_PRIMARY};
                letter-spacing:10px;">${otp}</p>
    </div>

    <p style="font-size:13px;color:#6b7280;margin:0 0 6px;">
      ⚠️ Never share this OTP with anyone, including TrainTransit support staff.
    </p>
    <p style="font-size:13px;color:#6b7280;margin:0;">
      If you did not request this OTP, please ignore this email or contact support immediately.
    </p>
  `;

  const info = await transporter.sendMail({
    from: `"TrainTransit" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${otp} — Your TrainTransit Verification Code`,
    html: emailShell('OTP Verification – TrainTransit', bodyHtml),
  });

  return info;
}