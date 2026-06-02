import { Router } from 'express'



import { register ,login,logout,getMe,changePassword,refreshAccessToken } from '../controllers/user.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { upload } from '../middlewares/upload.middleware.js'

const router = Router()
router.route('/register').post(upload.single('avatar'),register);
router.route('/login').post(login);
router.route('/refresh-token').get(refreshAccessToken);

router.route('/logout').get(verifyJWT, logout);
router.route('/me').get(verifyJWT, getMe);
router.route('/change-password').post(verifyJWT, changePassword);

export default router
