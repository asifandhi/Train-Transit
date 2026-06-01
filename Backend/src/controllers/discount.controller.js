// File: src/controllers/discount.controller.js
// Status: 37 of 57

import { asyncHandler } from '../utils/asyncHandler.js'
import apiError from '../utils/apiError.js'
import apiResponse from '../utils/apiResponse.js'
import Discount from '../models/discount.model.js'
import { validateDiscount } from '../utils/discountValidator.util.js'
import { uploadOnCloudinary } from '../utils/cloudinary.util.js'
import { DISCOUNT_RULES } from '../constant.js'

// ── POST /api/discount/validate  (auth) ─────────────────
export const validateAndApplyDiscount = asyncHandler(async (req, res) => {
  const { discountType, coachClass } = req.body

  if (!discountType || !coachClass)
    throw new apiError(400, 'discountType and coachClass are required')

  if (!DISCOUNT_RULES[discountType])
    throw new apiError(400, `discountType must be one of: ${Object.keys(DISCOUNT_RULES).join(', ')}`)

  const user = req.user

  // validateDiscount throws apiError on ineligibility
  let validationResult
  try {
    validationResult = validateDiscount({
      discountType,
      coachClass,
      userGender: user.gender,
      userDob:    user.dob,
    })
  } catch (err) {
    throw new apiError(400, err.message)
  }

  const { discountPercent, proofRequired } = validationResult
  const rule = DISCOUNT_RULES[discountType]

  if (proofRequired && !req.file)
    throw new apiError(400, 'Proof document is required for this discount type')

  // Upload proof via cloudinary.util.js (handles local file cleanup internally)
  let proofUrl      = null
  let proofPublicId = null

  if (proofRequired && req.file) {
    const result = await uploadOnCloudinary(req.file.path)
    if (!result) throw new apiError(502, 'Proof upload failed')
    proofUrl      = result.secure_url
    proofPublicId = result.public_id
  }

  // allowedClass is an array in model (e.g. student → ["GN"], senior → all classes)
  const discount = await Discount.create({
    user:            user._id,
    discountType,
    discountPercent,
    allowedClass:    rule.allowedClasses,
    proofUrl,
    proofPublicId,
    isVerified:      !proofRequired, // auto-approve if no proof needed (e.g. senior)
  })

  return res.status(201).json(
    new apiResponse(
      201,
      {
        discountId:      discount._id,
        discountType,
        coachClass,
        discountPercent,
        proofRequired,
        proofUrl,
        isVerified:      discount.isVerified,
        allowedClasses:  rule.allowedClasses,
        description:     rule.description,
      },
      proofRequired
        ? 'Discount recorded. Proof uploaded — pending admin verification.'
        : 'Discount applied successfully.'
    )
  )
})

export const getDiscountTypes = asyncHandler(async (req, res) => {
  const discountTypes = Object.entries(DISCOUNT_RULES).map(([key, value]) => {
    const item = {
      type:           key,
      percentage:     value.percentage,
      allowedClasses: value.allowedClasses,
      proofRequired:  value.proofRequired,
      description:    value.description,
    }

    if (value.maleMinAge)   item.maleMinAge   = value.maleMinAge
    if (value.femaleMinAge) item.femaleMinAge = value.femaleMinAge

    return item
  })

  return res.status(200).json(
    new apiResponse(200, { discountTypes }, 'Discount types fetched')
  )
})
