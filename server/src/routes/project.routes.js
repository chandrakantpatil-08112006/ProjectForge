import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { optionalAuthenticate } from '../middleware/optionalAuthenticate.js';
import { createContentLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import {
  changeStatusSchema,
  createProjectSchema,
  listProjectsSchema,
  myProjectsSchema,
  projectIdSchema,
  updateProjectSchema,
} from '../validators/project.validator.js';

const router = Router();

router.get('/', validate(listProjectsSchema), projectController.list);
// Must be declared before '/:id' or "mine" would be treated as a project id.
router.get('/mine', authenticate, validate(myProjectsSchema), projectController.mine);
router.post('/', authenticate, createContentLimiter, validate(createProjectSchema), projectController.create);

router.get('/:id', optionalAuthenticate, validate(projectIdSchema), projectController.get);
router.patch('/:id', authenticate, validate(updateProjectSchema), projectController.update);
router.delete('/:id', authenticate, validate(projectIdSchema), projectController.remove);

router.post('/:id/publish', authenticate, validate(projectIdSchema), projectController.publish);
router.post('/:id/unpublish', authenticate, validate(projectIdSchema), projectController.unpublish);
router.patch('/:id/status', authenticate, validate(changeStatusSchema), projectController.changeStatus);

export default router;
