import * as projectService from '../services/project.service.js';
import { sendCreated, sendSuccess } from '../utils/apiResponse.js';

export async function list(req, res) {
  const { projects, meta } = await projectService.listProjects(req.validated.query);
  sendSuccess(res, projects, { meta });
}

export async function mine(req, res) {
  const { projects, meta } = await projectService.listMyProjects(req.user, req.validated.query);
  sendSuccess(res, projects, { meta });
}

export async function get(req, res) {
  sendSuccess(res, await projectService.getProjectDetails(req.validated.params.id, req.user));
}

export async function create(req, res) {
  sendCreated(res, await projectService.createProject(req.user, req.validated.body));
}

export async function update(req, res) {
  sendSuccess(res, await projectService.updateProject(req.validated.params.id, req.user, req.validated.body));
}

export async function publish(req, res) {
  sendSuccess(res, await projectService.publishProject(req.validated.params.id, req.user));
}

export async function unpublish(req, res) {
  sendSuccess(res, await projectService.unpublishProject(req.validated.params.id, req.user));
}

export async function changeStatus(req, res) {
  const { params, body } = req.validated;
  sendSuccess(res, await projectService.changeProjectStatus(params.id, req.user, body.status));
}

export async function remove(req, res) {
  sendSuccess(res, await projectService.archiveProject(req.validated.params.id, req.user));
}
