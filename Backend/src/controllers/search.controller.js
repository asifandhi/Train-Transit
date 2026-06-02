import { asyncHandler } from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import { Schedule } from "../models/schedule.model.js";
import { Station } from "../models/station.model.js";
import { Route } from "../models/route.model.js";
import {
  RATE_PER_KM,
  RESERVATION_CHARGE,
  SUPERFAST_CHARGE,
  GST_RATE,
} from "../constant.js";

const estimateFare = (distanceKm, coachClass, isSuperfast) => {
  const base =
    distanceKm * (RATE_PER_KM[coachClass] ?? 0) +
    (RESERVATION_CHARGE[coachClass] ?? 0) +
    (isSuperfast ? SUPERFAST_CHARGE : 0);
  return Math.round(base + base * GST_RATE);
};

const formatDuration = (dep, arr) => {
  if (!dep || !arr) return "N/A";
  const diff = new Date(arr) - new Date(dep);
  if (diff < 0) return "N/A";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
};

const buildDt = (baseDate, timeStr, dayOffset = 0) => {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(":").map(Number);
  const dt = new Date(baseDate);
  dt.setDate(dt.getDate() + dayOffset);
  dt.setHours(h, m, 0, 0);
  return dt;
};

export const searchTrains = asyncHandler(async (req, res) => {
  const { from, to, date, class: coachClass } = req.query;

  if (!from || !to || !date)
    throw new apiError(400, "from, to, date are required");

  if (from.toUpperCase() === to.toUpperCase())
    throw new apiError(400, "Origin and destination cannot be the same");

  const journeyDate = new Date(date);
  if (isNaN(journeyDate))
    throw new apiError(400, "Invalid date format. Use YYYY-MM-DD");

  const [fromStation, toStation] = await Promise.all([
    Station.findOne({ stationCode: from.toUpperCase(), isActive: true }),
    Station.findOne({ stationCode: to.toUpperCase(), isActive: true }),
  ]);

  if (!fromStation)
    throw new apiError(404, `Station '${from.toUpperCase()}' not found`);
  if (!toStation)
    throw new apiError(404, `Station '${to.toUpperCase()}' not found`);

  const routes = await Route.find({
    isActive: true,
    "stops.station": { $all: [fromStation._id, toStation._id] },
  }).populate("train", "trainName trainNumber trainType isSuperfast isActive");

  if (!routes.length)
    return res
      .status(200)
      .json(new apiResponse(200, { trains: [], count: 0 }, "No trains found"));

  const validRoutes = [];
  for (const route of routes) {
    if (!route.train?.isActive) continue;

    const fromStop = route.stops.find(
      (s) => s.station.toString() === fromStation._id.toString()
    );
    const toStop = route.stops.find(
      (s) => s.station.toString() === toStation._id.toString()
    );

    if (!fromStop || !toStop) continue;
    if (fromStop.stopNumber >= toStop.stopNumber) continue;

    validRoutes.push({
      route,
      fromStop,
      toStop,
      distanceKm: Math.max(
        1,
        toStop.distanceFromOrigin - fromStop.distanceFromOrigin
      ),
    });
  }

  if (!validRoutes.length)
    return res
      .status(200)
      .json(
        new apiResponse(
          200,
          { trains: [], count: 0 },
          "No trains in correct direction"
        )
      );

  const dayStart = new Date(journeyDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(journeyDate);
  dayEnd.setHours(23, 59, 59, 999);

  const scheduleFilter = {
    train: { $in: validRoutes.map((r) => r.route.train._id) },
    journeyDate: { $gte: dayStart, $lte: dayEnd },
    status: "scheduled",
  };
  if (coachClass) scheduleFilter[`availableSeats.${coachClass}`] = { $gt: 0 };

  const schedules = await Schedule.find(scheduleFilter).lean();
  const scheduleMap = new Map(schedules.map((s) => [s.train.toString(), s]));

  const results = [];
  for (const { route, fromStop, toStop, distanceKm } of validRoutes) {
    const schedule = scheduleMap.get(route.train._id.toString());
    if (!schedule) continue;

    const departureDt = buildDt(
      journeyDate,
      fromStop.departureTime || fromStop.arrivalTime,
      fromStop.dayOffset || 0
    );
    const arrivalDt = buildDt(
      journeyDate,
      toStop.arrivalTime || toStop.departureTime,
      toStop.dayOffset || 0
    );

    const requestedClass = coachClass || "SL";
    const availableSeats = coachClass
      ? { [coachClass]: schedule.availableSeats?.[coachClass] ?? 0 }
      : (schedule.availableSeats ?? {});

    results.push({
      trainId: route.train._id,
      trainName: route.train.trainName,
      trainNumber: route.train.trainNumber,
      trainType: route.train.trainType,
      isSuperfast: route.train.isSuperfast,
      scheduleId: schedule._id,
      journeyDate: date,
      fromStation: {
        id: fromStation._id,
        code: fromStation.stationCode,
        name: fromStation.stationName,
        city: fromStation.city,
        platform: fromStop.platformNumber,
      },
      toStation: {
        id: toStation._id,
        code: toStation.stationCode,
        name: toStation.stationName,
        city: toStation.city,
        platform: toStop.platformNumber,
      },
      departureTime: departureDt,
      arrivalTime: arrivalDt,
      duration: formatDuration(departureDt, arrivalDt),
      distanceKm,
      availableSeats,
      estimatedFare: estimateFare(
        distanceKm,
        requestedClass,
        route.train.isSuperfast
      ),
    });
  }

  results.sort((a, b) => {
    if (!a.departureTime) return 1;
    if (!b.departureTime) return -1;
    return new Date(a.departureTime) - new Date(b.departureTime);
  });

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { trains: results, count: results.length },
        results.length
          ? `Found ${results.length} train(s)`
          : "No trains available"
      )
    );
});
