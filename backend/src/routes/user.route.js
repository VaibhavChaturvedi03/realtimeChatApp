import {Router} from 'express';
import { getUserDetails, updateAccountDetails, updateProfilePic, changePassword } from '../controllers/user.controller.js'; 
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/get-user-details").get(verifyJWT, getUserDetails)
router.route("/update-account-details").patch(verifyJWT, updateAccountDetails)
router.route("/update-profile-pic").patch(verifyJWT, upload.single("profilePic"), updateProfilePic)
router.route("/change-password").post(verifyJWT, changePassword)

export default router;