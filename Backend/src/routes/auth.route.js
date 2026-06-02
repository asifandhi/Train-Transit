import { Router } from 'express'


import { register ,login,logout,getMe,changePassword } from '../controllers/user.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()
// Public routes
router.route('/register').post(register);
router.route('/login').post(login);
router.route('/refresh-token').post(refreshAccessToken);

// Protected routes
router.route('/logout').post(verifyJWT, logout);
router.route('/me').get(verifyJWT, getMe);
router.route('/change-password').post(verifyJWT, changePassword);

export default router
