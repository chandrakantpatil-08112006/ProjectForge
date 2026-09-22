import { Router } from 'express';
import * as skillController from '../controllers/skill.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  createSkillSchema,
  listSkillsSchema,
  skillIdSchema,
  updateSkillSchema,
} from '../validators/skill.validator.js';

const router = Router();

router.get('/', validate(listSkillsSchema), skillController.list);

// The catalogue is curated: only admins change it.
router.post('/', authenticate, authorize('admin'), validate(createSkillSchema), skillController.create);
router.patch('/:id', authenticate, authorize('admin'), validate(updateSkillSchema), skillController.update);
router.delete('/:id', authenticate, authorize('admin'), validate(skillIdSchema), skillController.remove);

export default router;
