import PDFDocument from "pdfkit";
import { Buffer } from "buffer";

// At top of file — add path import
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Brand / Gov palette ───────────────────────────────────────────────────────
const C_SAFFRON = "#FF9933";
const C_GREEN = "#138808";
const C_NAVY = "#000080"; // Indian Railways navy
const C_DARK = "#1a2035";
const C_BRAND = "#1a56db";
const C_WHITE = "#ffffff";
const C_LIGHT_BG = "#f5f7ff";
const C_MUTED = "#6b7280";
const C_BORDER = "#c8d4f0";
const C_ROW_ALT = "#eef2fc";

// Famous Indian station codes used as watermark tiles
const STATION_CODES = [
  "NDLS",
  "BCT",
  "MAS",
  "HWH",
  "PUNE",
  "SBC",
  "ADI",
  "CSTM",
  "LKO",
  "BPL",
  "JP",
  "AGC",
  "VSKP",
  "GHY",
  "JAT",
  "BBS",
  "PNBE",
  "NZM",
  "YPR",
  "ST",
  "CDG",
  "RNC",
  "TVC",
  "CBE",
  "ET",
  "UHL",
  "BSB",
  "CNB",
  "INDB",
  "GWL",
];

// ── Low-level helpers ─────────────────────────────────────────────────────────

function rect(doc, x, y, w, h, color) {
  doc.rect(x, y, w, h).fill(color);
}

function hrule(doc, y, color = C_BORDER, lw = 0.6) {
  doc
    .moveTo(40, y)
    .lineTo(doc.page.width - 40, y)
    .strokeColor(color)
    .lineWidth(lw)
    .stroke();
}

function sectionHeader(doc, label, y, pageWidth) {
  const contentW = pageWidth - 80;
  rect(doc, 40, y, contentW, 20, C_NAVY);
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(C_WHITE)
    .text(label, 48, y + 6);
  return y + 24;
}

function labelValue(doc, label, value, lx, vx, y, valueColor = C_DARK) {
  doc.font("Helvetica").fontSize(9).fillColor(C_MUTED).text(label, lx, y);
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(valueColor)
    .text(value, vx, y);
}

// ── Watermark: tile ghost station codes across full page ──────────────────────
// Edit STATION_CODES array above to change which codes appear.
// Change fillColor hex to make darker (e.g. '#d0d8f0') or lighter (e.g. '#eceff8').
function drawWatermark(doc, pageWidth, pageHeight) {
  doc.save();
  doc.font("Helvetica-Bold").fontSize(22).fillColor("#dde3f5");

  const cols = 5;
  const rows = 9;
  const cellW = pageWidth / cols;
  const cellH = pageHeight / rows;

  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const code = STATION_CODES[idx % STATION_CODES.length];
      const cx = c * cellW + cellW / 2 - 30;
      const cy = r * cellH + cellH / 2 - 10;
      doc.text(code, cx, cy, { lineBreak: false });
      idx++;
    }
  }
  doc.restore();
}

// ── Tricolor stripe ───────────────────────────────────────────────────────────
// Change stripe height by editing the `H` constant (currently 5px each).
function drawTricolor(doc, pageWidth, yStart = 0) {
  const H = 5;
  rect(doc, 0, yStart, pageWidth, H, C_SAFFRON);
  rect(doc, 0, yStart + H, pageWidth, H, C_WHITE);
  rect(doc, 0, yStart + H * 2, pageWidth, H, C_GREEN);
}

// ── Ashoka Chakra (simplified 24-spoke wheel) ─────────────────────────────────
// cx, cy = centre. r = radius. Change r to resize.
function drawChakra(doc, cx, cy, r = 14) {
  // Outer circle
  doc.circle(cx, cy, r).strokeColor("#000080").lineWidth(1.5).stroke();
  // Inner hub
  doc.circle(cx, cy, r * 0.15).fill("#000080");
  // 24 spokes
  for (let i = 0; i < 24; i++) {
    const angle = (i * 2 * Math.PI) / 24;
    const x1 = cx + Math.cos(angle) * r * 0.18;
    const y1 = cy + Math.sin(angle) * r * 0.18;
    const x2 = cx + Math.cos(angle) * r * 0.85;
    const y2 = cy + Math.sin(angle) * r * 0.85;
    doc
      .moveTo(x1, y1)
      .lineTo(x2, y2)
      .strokeColor("#000080")
      .lineWidth(0.6)
      .stroke();
  }
}

// ── Decorative barcode strip (purely visual) ──────────────────────────────────
// Alternating thin/thick black bars — looks like a barcode, not scannable.
// Change barCount for more/fewer bars.
function drawBarcodeStrip(doc, x, y, w, h, barCount = 60) {
  const thicknesses = [1, 2, 1, 3, 1, 1, 2, 3]; // pattern loop
  let cx = x;
  for (let i = 0; i < barCount && cx < x + w; i++) {
    const bw = thicknesses[i % thicknesses.length];
    rect(doc, cx, y, bw, h, i % 3 === 0 ? "#1a2035" : "#000080");
    cx += bw + 1.2;
  }
}

// ── STATUS STAMP (diagonal text: CONFIRMED / RAC / WAITLIST) ─────────────────
// Drawn inside PNR box. Change font size or angle below.
function drawStatusStamp(doc, status, cx, cy) {
  const label =
    status === "confirmed"
      ? "CONFIRMED"
      : status === "RAC"
        ? "RAC"
        : "WAITLIST";
  const color =
    status === "confirmed"
      ? "#065f46"
      : status === "RAC"
        ? "#92400e"
        : "#991b1b";

  doc.save();
  doc.translate(cx, cy);
  doc.rotate(-28); // ← change angle here
  doc
    .font("Helvetica-Bold")
    .fontSize(28) // ← change size here
    .fillColor(color)
    .opacity(0.12)
    .text(label, -60, -14, { lineBreak: false });
  doc.restore();
  doc.opacity(1);
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
export async function generateTicketPDF(bookingData) {
  const {
    pnr,
    trainName,
    trainNumber,
    fromStation,
    toStation,
    journeyDate,
    coachClass,
    passengers = [],
    fare = {},
    bookedAt,
    bookingStatus = "confirmed", // overall booking status for stamp
  } = bookingData;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: {
        Title: `TrainTransit E-Ticket — PNR ${pnr}`,
        Author: "TrainTransit | Ministry of Railways (Demo)",
        Subject: `Journey: ${fromStation} → ${toStation}`,
      },
    });

    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const PW = doc.page.width; // 595.28
    const PH = doc.page.height; // 841.89
    const CW = PW - 80; // content width (40px margin each side)
    const MX = 40; // left margin

    // ── LAYER 0: White background ─────────────────────────────────────────────
    rect(doc, 0, 0, PW, PH, C_WHITE);

    // ── LAYER 1: Watermark ghost station codes ────────────────────────────────
    // drawWatermark(doc, PW, PH);
    // ── LAYER 1: Background image watermark ──────────────────────────────────────
    const bgImagePath = path.join(__dirname, "../assets/ticket_bg.png");
    doc.image(bgImagePath, 0, 0, {
      width: PW,
      height: PH,
      opacity: 0.15, // ← change this: 0.05 = barely visible, 0.3 = stronger
    });

    // ── LAYER 2: Top tricolor stripe ──────────────────────────────────────────
    drawTricolor(doc, PW, 0);

    // ── GOV HEADER (y: 15 → 72) ───────────────────────────────────────────────
    // Left side: Chakra + Ministry text
    drawChakra(doc, MX + 18, 38);

    doc
      .font("Helvetica-Bold")
      .fontSize(8)
      .fillColor(C_NAVY)
      .text("MINISTRY OF RAILWAYS", MX + 38, 26);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(C_NAVY)
      .text("INDIAN RAILWAYS", MX + 38, 36);
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(C_MUTED)
      .text("GOVERNMENT OF INDIA", MX + 38, 49);

    // Right side: TrainTransit branding
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor(C_BRAND)
      .text("TrainTransit", 0, 28, { align: "right", width: PW - MX });
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(C_MUTED)
      .text("Official E-Ticket Portal", 0, 45, {
        align: "right",
        width: PW - MX,
      });

    // Separator under gov header
    hrule(doc, 62, C_NAVY, 1.5);

    // ── META LINE (booked timestamp + CRN) ────────────────────────────────────
    const bookedStr = new Date(bookedAt).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(C_MUTED)
      .text(`Booked: ${bookedStr} IST`, MX, 66)
      .text(`CRN: TT-${pnr}`, 0, 66, { align: "right", width: PW - MX });

    // ── PNR BOX (y: 78 → 130) ────────────────────────────────────────────────
    let y = 78;
    // Dashed border box
    doc
      .rect(MX, y, CW, 50)
      .dash(5, { space: 3 })
      .strokeColor(C_NAVY)
      .lineWidth(1.2)
      .stroke()
      .undash();

    // Light fill
    rect(doc, MX + 1, y + 1, CW - 2, 48, C_LIGHT_BG);

    // Diagonal status stamp inside PNR box
    drawStatusStamp(doc, bookingStatus, MX + CW - 80, y + 25);

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(C_MUTED)
      .text("PNR NUMBER", 0, y + 9, { align: "center", width: PW });

    doc
      .font("Helvetica-Bold")
      .fontSize(26)
      .fillColor(C_NAVY)
      .text(pnr, 0, y + 20, {
        align: "center",
        width: PW,
        characterSpacing: 5,
      });

    // ── TRAIN DETAILS SECTION ─────────────────────────────────────────────────
    y = 136;
    y = sectionHeader(doc, "TRAIN DETAILS", y, PW);

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor(C_DARK)
      .text(`${trainName.toUpperCase()}`, MX, y);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(C_MUTED)
      .text(
        `Train No: ${trainNumber}  |  Class: ${coachClass}  |  Type: ${bookingData.isSuperfast ? "Superfast" : "Express"}`,
        MX,
        y + 14
      );

    // FROM → TO with arrow
    y += 34;
    const midX = PW / 2;

    // From box
    doc.rect(MX, y, 160, 38).fillAndStroke(C_LIGHT_BG, C_BORDER);
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor(C_NAVY)
      .text(fromStation.toUpperCase(), MX + 6, y + 6, { width: 148 });
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(C_MUTED)
      .text("DEPARTURE", MX + 6, y + 24);

    // To box
    doc.rect(PW - MX - 160, y, 160, 38).fillAndStroke(C_LIGHT_BG, C_BORDER);
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor(C_NAVY)
      .text(toStation.toUpperCase(), PW - MX - 154, y + 6, { width: 148 });
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(C_MUTED)
      .text("ARRIVAL", PW - MX - 154, y + 24);

    // Arrow between boxes
    const arrowY = y + 19;
    doc
      .moveTo(MX + 166, arrowY)
      .lineTo(PW - MX - 166, arrowY)
      .strokeColor(C_BRAND)
      .lineWidth(2)
      .stroke();
    // Arrowhead
    doc
      .moveTo(PW - MX - 166, arrowY - 5)
      .lineTo(PW - MX - 154, arrowY)
      .lineTo(PW - MX - 166, arrowY + 5)
      .fill(C_BRAND);

    // Journey date under route
    y += 48;
    const dateStr = new Date(journeyDate).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(C_DARK)
      .text(`Journey Date:`, MX, y)
      .font("Helvetica-Bold")
      .text(`  ${dateStr}`, MX + 78, y);

    hrule(doc, y + 14);

    // ── PASSENGER DETAILS SECTION ─────────────────────────────────────────────
    y += 22;
    y = sectionHeader(doc, "PASSENGER DETAILS", y, PW);

    // Column layout — adjust x/width to reposition columns
    const COLS = [
      { key: "name", label: "PASSENGER NAME", x: MX, w: 148 },
      { key: "age", label: "AGE", x: MX + 152, w: 30 },
      { key: "gender", label: "GENDER", x: MX + 186, w: 50 },
      { key: "idType", label: "ID TYPE", x: MX + 240, w: 55 },
      { key: "coach", label: "COACH", x: MX + 299, w: 40 },
      { key: "seat", label: "SEAT/BERTH", x: MX + 343, w: 70 },
      { key: "status", label: "STATUS", x: MX + 417, w: 80 },
    ];

    // Table header row
    rect(doc, MX, y, CW, 16, "#dde6f5");
    COLS.forEach(({ label, x, w }) => {
      doc
        .font("Helvetica-Bold")
        .fontSize(7)
        .fillColor(C_NAVY)
        .text(label, x + 2, y + 5, { width: w, align: "left" });
    });
    y += 18;

    // Passenger rows
    passengers.forEach((p, idx) => {
      const rowBg = idx % 2 === 0 ? C_WHITE : C_ROW_ALT;
      rect(doc, MX, y, CW, 18, rowBg);

      const seatLabel = p.seatNumber
        ? `${p.seatNumber} (${p.berthType ?? "-"})`
        : p.racNumber
          ? `RAC-${p.racNumber}`
          : p.waitlistNumber
            ? `WL-${p.waitlistNumber}`
            : "-";

      const statusColor =
        p.status === "confirmed"
          ? "#065f46"
          : p.status === "RAC"
            ? "#92400e"
            : "#991b1b";

      const cellData = {
        name: { val: p.name, color: C_DARK },
        age: { val: String(p.age ?? "-"), color: C_DARK },
        gender: { val: p.gender ?? "-", color: C_DARK },
        idType: { val: p.idType ?? "-", color: C_MUTED },
        coach: { val: p.coachNumber ?? "-", color: C_DARK },
        seat: { val: seatLabel, color: C_DARK },
        status: { val: (p.status ?? "-").toUpperCase(), color: statusColor },
      };

      COLS.forEach(({ key, x, w }) => {
        const { val, color } = cellData[key];
        doc
          .font(key === "status" ? "Helvetica-Bold" : "Helvetica")
          .fontSize(7.5)
          .fillColor(color)
          .text(val, x + 2, y + 5, { width: w - 4, align: "left" });
      });

      y += 20;
    });

    // Bottom border of table
    doc
      .rect(
        MX,
        y - passengers.length * 20 - 18,
        CW,
        passengers.length * 20 + 18
      )
      .strokeColor(C_BORDER)
      .lineWidth(0.5)
      .stroke();

    hrule(doc, y + 4);

    // ── FARE BREAKDOWN SECTION ────────────────────────────────────────────────
    y += 16;
    y = sectionHeader(doc, "FARE DETAILS", y, PW);

    const fareRows = [
      { label: "Base Fare (distance + reservation)", val: fare.baseFare ?? 0 },
      { label: "GST (5%)", val: fare.gst ?? 0 },
      { label: "Meal / Catering", val: fare.mealCost ?? 0 },
      { label: "Discount Applied", val: -(fare.discountAmount ?? 0) },
    ];

    fareRows.forEach(({ label, val }) => {
      const isDiscount = val < 0;
      doc.font("Helvetica").fontSize(9).fillColor(C_DARK).text(label, MX, y);
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(isDiscount ? "#065f46" : C_DARK)
        .text(
          `${isDiscount ? "- " : ""}₹ ${Math.abs(val).toLocaleString("en-IN")}`,
          0,
          y,
          { align: "right", width: PW - MX }
        );
      y += 16;
    });

    hrule(doc, y);
    y += 6;

    // Total row
    rect(doc, MX, y, CW, 22, C_LIGHT_BG);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(C_NAVY)
      .text("TOTAL AMOUNT PAYABLE", MX + 6, y + 6);
    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor(C_NAVY)
      .text(`₹ ${(fare.totalFare ?? 0).toLocaleString("en-IN")}`, 0, y + 6, {
        align: "right",
        width: PW - MX,
      });
    y += 28;

    hrule(doc, y);

    // ── IMPORTANT INSTRUCTIONS ────────────────────────────────────────────────
    y += 10;
    y = sectionHeader(doc, "IMPORTANT INSTRUCTIONS", y, PW);

    const instructions = [
      "1. Carry original Photo ID (Aadhaar / Passport / Voter ID / Driving Licence) during travel.",
      "2. This e-ticket is valid only with matching Photo ID of the passenger.",
      "3. Ticket Checking Examiner (TTE) may verify ID proof on board.",
      "4. Cancellation charges apply as per Railway cancellation policy.",
      "5. Contact TrainTransit support for any booking-related queries.",
    ];

    instructions.forEach((line) => {
      doc.font("Helvetica").fontSize(7.5).fillColor(C_DARK).text(line, MX, y);
      y += 12;
    });

    // ── BARCODE STRIP ─────────────────────────────────────────────────────────
    y += 6;
    drawBarcodeStrip(doc, MX, y, CW, 22);

    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(C_MUTED)
      .text(pnr, MX, y + 26, { characterSpacing: 3 })
      .text(
        "** FOR VERIFICATION ONLY — NOT A SCANNABLE BARCODE **",
        0,
        y + 26,
        { align: "right", width: PW - MX }
      );

    // ── FOOTER ────────────────────────────────────────────────────────────────
    const footerY = PH - 46;
    hrule(doc, footerY, C_NAVY, 1);

    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(C_MUTED)
      .text(
        "This is a computer-generated document. No signature required.",
        MX,
        footerY + 6,
        { align: "center", width: CW }
      );
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(C_MUTED)
      .text(
        `© ${new Date().getFullYear()} TrainTransit · Powered by Indian Railways Infrastructure · PNR ${pnr}`,
        MX,
        footerY + 18,
        { align: "center", width: CW }
      );

    // Bottom tricolor stripe
    drawTricolor(doc, PW, PH - 15);

    doc.end();
  });
}
