import * as skillService from '../services/skill.service.js';
import { sendCreated, sendSuccess } from '../utils/apiResponse.js';

export async function list(req, res) {
  const { skills, meta } = await skillService.listSkills(req.validated.query);
  sendSuccess(res, skills, { meta });
}

export async function create(req, res) {
  sendCreated(res, await skillService.createSkill(req.validated.body));
}

export async function update(req, res) {
  sendSuccess(res, await skillService.updateSkill(req.validated.params.id, req.validated.body));
}

export async function remove(req, res) {
  await skillService.deleteSkill(req.validated.params.id);
  sendSuccess(res, { message: 'Skill deleted' });
}
