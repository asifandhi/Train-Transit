import { asyncHandler } from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import Meal from "../models/meal.model.js";

const VALID_CATEGORIES = ["veg", "non-veg", "jain"];
const VALID_MEAL_TYPES = ["breakfast", "lunch", "dinner", "snacks"];

export const getAllMeals = asyncHandler(async (req, res) => {
  const filter = { isAvailable: true };

  if (req.query.category) filter.category = req.query.category;
  if (req.query.mealType) filter.mealType = req.query.mealType;

  const meals = await Meal.find(filter).sort({ category: 1, price: 1 });

  return res
    .status(200)
    .json(
      new apiResponse(200, { meals, count: meals.length }, "Meals fetched")
    );
});

export const addMeal = asyncHandler(async (req, res) => {
  const { name, description, price, category, mealType, image } = req.body;

  if (!name || !price || !category || !mealType)
    throw new apiError(400, "name, price, category, mealType are required");

  if (price <= 0) throw new apiError(400, "Price must be positive");

  if (!VALID_CATEGORIES.includes(category))
    throw new apiError(
      400,
      `category must be one of: ${VALID_CATEGORIES.join(", ")}`
    );

  if (!VALID_MEAL_TYPES.includes(mealType))
    throw new apiError(
      400,
      `mealType must be one of: ${VALID_MEAL_TYPES.join(", ")}`
    );

  const meal = await Meal.create({
    name: name.trim(),
    description: description?.trim() || "",
    price: parseFloat(price),
    category,
    mealType,
    image: image || "",
  });

  return res
    .status(201)
    .json(new apiResponse(201, { meal }, "Meal added successfully"));
});

export const addMealToBooking = asyncHandler(async (req, res) => {
  const { PNR } = req.params;
  const { mealId, quantity = 1 } = req.body;

  if (!mealId) {
    throw new apiError(400, "mealId is required");
  }

  const qty = parseInt(quantity);
  if (isNaN(qty) || qty <= 0 || qty > 10) {
    throw new apiError(400, "quantity must be between 1 and 10");
  }

  const booking = await Booking.findOne({ pnr: PNR });
  if (!booking) {
    throw new apiError(404, "Booking not found for this PNR");
  }

  if (booking.user.toString() !== req.user._id.toString()) {
    throw new apiError(403, "You are not authorized to modify this booking");
  }

  if (booking.bookingStatus !== "confirmed") {
    throw new apiError(
      400,
      `Cannot add meals to a booking with status '${booking.bookingStatus}'`
    );
  }

  if (booking.paymentStatus !== "paid") {
    throw new apiError(
      400,
      "Meals can only be ordered after payment is completed"
    );
  }

  if (new Date() >= new Date(booking.journeyDate)) {
    throw new apiError(400, "Cannot add meals after journey date");
  }

  
  const meal = await Meal.findById(mealId);
  if (!meal) {
    throw new apiError(404, "Meal not found");
  }
  if (!meal.isAvailable) {
    throw new apiError(400, "This meal is currently not available");
  }

  const existingMealIndex = booking.meals
    ? booking.meals.findIndex((m) => m.meal?.toString() === mealId.toString())
    : -1;

  if (existingMealIndex >= 0 && booking.meals) {
    booking.meals[existingMealIndex].quantity += qty;
  } else {
    if (!booking.meals) booking.meals = [];
    booking.meals.push({
      meal: mealId,
      name: meal.name,
      price: meal.price,
      quantity: qty,
      category: meal.category,
    });
  }

  
  const mealCostAddition = meal.price * qty;
  booking.fare.mealCost = (booking.fare.mealCost || 0) + mealCostAddition;
  booking.fare.totalFare = booking.fare.totalFare + mealCostAddition;

  await booking.save();

  const updatedBooking = await Booking.findById(booking._id)
    .populate("train", "trainName trainNumber")
    .populate("fromStation", "stationCode stationName")
    .populate("toStation", "stationCode stationName")
    .populate("meals.meal", "name price category");

  return res
    .status(200)
    .json(
      new apiResponse(200, updatedBooking, "Meal added to booking successfully")
    );
});
