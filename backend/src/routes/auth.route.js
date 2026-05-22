import {Router} from 'express';
import { signupUser } from '../controllers/auth.controller.js'; 

const router = Router();

router.route('/signup').post(signupUser);

export default router;