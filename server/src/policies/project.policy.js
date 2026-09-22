import { PUBLIC_PROJECT_STATUSES } from '../constants/enums.js';

/** Pure permission rules: no database access, easy to unit test. */

export const isOwner = (project, user) =>
  Boolean(user) && String(project.owner?._id ?? project.owner) === String(user._id ?? user.id);

/** Visible to everyone: published (not draft/archived) and not hidden by a moderator. */
export const isPubliclyVisible = (project) =>
  PUBLIC_PROJECT_STATUSES.includes(project.status) && (project.moderation?.status ?? 'visible') === 'visible';

export const canViewProject = (project, user) => isPubliclyVisible(project) || isOwner(project, user);

export const canManageProject = (project, user) => isOwner(project, user);
