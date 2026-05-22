import {Router} from 'express';
import { signupUser, loginUser, logoutUser, refreshAccessToken } from '../controllers/auth.controller.js'; 
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();

router.route("/signup").post(signupUser)

router.route("/login").post(loginUser)

// secured routes for loggedin user only
router.route("/logout").post(verifyJWT,  logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router;