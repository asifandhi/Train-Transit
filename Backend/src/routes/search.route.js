import { Router } from 'express'
import { searchTrains } from '../controllers/search.controller.js'

const router = Router()
router.route('/')
    .get(searchTrains);

export default router
