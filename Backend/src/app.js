import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";



const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));
app.use(cookieParser());

import userRouter from "./routes/user.route.js";
import adminRouter from "./routes/admin.route.js";
import bookingRouter from "./routes/booking.route.js";
import cancellationRouter from "./routes/cancellation.route.js";
import coachRouter from "./routes/coach.route.js";
import discountRouter from "./routes/discount.route.js";
import mealRouter from "./routes/meal.route.js";
import paymentRouter from "./routes/payment.route.js";
import pnrRouter from "./routes/pnr.route.js";
import routeRouter from "./routes/route.route.js";
import scheduleRouter from "./routes/schedule.route.js";
import searchRouter from "./routes/search.route.js";
import stationRouter from "./routes/station.route.js";
import trainRouter from "./routes/train.route.js";
import tteRouter from "./routes/tte.route.js";

app.use("/api/v1/auth", userRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/cancellations", cancellationRouter);
app.use("/api/v1/coaches", coachRouter);
app.use("/api/v1/discounts", discountRouter);
app.use("/api/v1/meals", mealRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/pnr", pnrRouter);
app.use("/api/v1/routes", routeRouter);
app.use("/api/v1/schedules", scheduleRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/stations", stationRouter);
app.use("/api/v1/trains", trainRouter);
app.use("/api/v1/tte", tteRouter);

export { app };
