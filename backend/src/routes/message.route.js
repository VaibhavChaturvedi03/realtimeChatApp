import {Router} from 'express';
import { getAllContacts, getAllChats, getAllMessages, sendMessage } from '../controllers/message.controller.js'; 
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { apiRateLimiter, loginRateLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

// since the middlewares are executed in order 
router.use(apiRateLimiter, loginRateLimiter, verifyJWT ); // Apply rate limiters and JWT verification to all routes in this router

router.route('/contacts').get(getAllContacts)
router.route('/chats').get(getAllChats)
router.route('/:id').get(getAllMessages)
router.route('/send/:id').post(upload.single("image"), sendMessage)

export default router;