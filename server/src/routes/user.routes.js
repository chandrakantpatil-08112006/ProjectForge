import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema } from '../validators/user.validator.js';

const router = Router();

router.patch('/me', authenticate, validate(updateProfileSchema), userController.updateMe);

export default router;
