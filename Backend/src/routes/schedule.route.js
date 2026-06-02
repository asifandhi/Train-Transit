import { Router } from 'express'
import { generateSchedules,getScheduleByTrainAndDate } from '../controllers/schedule.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { authorizeRoles } from '../middlewares/roleGuard.middleware.js'

const router = Router()
router.route('/:trainId/:date')
    .get(getScheduleByTrainAndDate);

router.route('/generate')
    .post(verifyJWT, authorizeRoles('admin'), generateSchedules);

export default router
