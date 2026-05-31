import { DISCOUNT_RULES } from "../constant.js";
import apiError from "./apiError.js";

function calAge(dob){
    const birth = new Date(dob);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if(monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age-=1;
    return age;

}

export function validateDiscount({ discountType, coachClass, userGender, userDob }){
    const rule = DISCOUNT_RULES[discountType];
    if(!rule){
        throw new ApiError(400, `::: Invalid discount type: '${discountType}'`);

    }

    if(!rule.allowedClasses.includes(coachClass)){
        throw new ApiError(400,` ::: -> '${discountType}' discount is not available for ${coachClass} class`
    );
    }

    if(discountType === 'senior'){
        if(!userDob || !userGender) {
            throw new ApiError(400, 'Gender or Dob is required for senior citizen discount');
        }

        const age = calAge(userDob);
        const gender = userGender.toLowerCase();

        let minAge = null;
        if(gender === 'female') {
            minAge = rule.femaleMinAge;
        }else{
            minAge = rule.maleMinAge;
        }

        if(age < minAge){
            throw new ApiError(400,`Not eligible for senior citizen discount. Required age: ${gender === 'female' ? '≥ 58' : '≥ 60'} years. Your age: ${age}`);
        }
    }

    return {
        discountPercent: rule.percentage,
        proofRequired: rule.proofRequired,
        description: rule.description,
    };
}
