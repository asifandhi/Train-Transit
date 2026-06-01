// File: src/controllers/meal.controller.js
// Status: 34 of 57

import { asyncHandler } from '../utils/asyncHandler.js'
import apiError from '../utils/apiError.js'
import apiResponse from '../utils/apiResponse.js'
import Meal from '../models/meal.model.js'

const VALID_CATEGORIES = ['veg', 'non-veg', 'jain']
const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks']

// ── GET /api/meals  (public) ─────────────────────────────
export const getAllMeals = asyncHandler(async (req, res) => {
  const filter = { isAvailable: true }

  if (req.query.category) filter.category = req.query.category
  if (req.query.mealType) filter.mealType = req.query.mealType

  const meals = await Meal.find(filter).sort({ category: 1, price: 1 })

  return res.status(200).json(
    new apiResponse(200, { meals, count: meals.length }, 'Meals fetched')
  )
})

// ── POST /api/meals  (admin) ─────────────────────────────
export const addMeal = asyncHandler(async (req, res) => {
  const { name, description, price, category, mealType, image } = req.body

  if (!name || !price || !category || !mealType)
    throw new apiError(400, 'name, price, category, mealType are required')

  if (price <= 0)
    throw new apiError(400, 'Price must be positive')

  if (!VALID_CATEGORIES.includes(category))
    throw new apiError(400, `category must be one of: ${VALID_CATEGORIES.join(', ')}`)

  if (!VALID_MEAL_TYPES.includes(mealType))
    throw new apiError(400, `mealType must be one of: ${VALID_MEAL_TYPES.join(', ')}`)

  const meal = await Meal.create({
    name:        name.trim(),
    description: description?.trim() || '',
    price:       parseFloat(price),
    category,
    mealType,
    image:       image || '',
  })

  return res.status(201).json(
    new apiResponse(201, { meal }, 'Meal added successfully')
  )
})

// ✅ Done. Next: src/controllers/payment.controller.js