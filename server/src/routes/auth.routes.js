import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { originCheck } from '../middleware/originCheck.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';

const router = Router();

router.post('/register', originCheck, authLimiter, validate(registerSchema), authController.register);
router.post('/login', originCheck, authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', originCheck, authController.refresh);
router.post('/logout', originCheck, authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
