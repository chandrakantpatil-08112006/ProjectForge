import { PROJECT_TRANSITIONS, PUBLIC_PROJECT_STATUSES } from '../constants/enums.js';
import { Project } from '../models/Project.js';
import { Skill, SKILL_PUBLIC_FIELDS } from '../models/Skill.js';
import { TeamMembership } from '../models/TeamMembership.js';
import { canManageProject, canViewProject, isOwner } from '../policies/project.policy.js';
import { AppError } from '../utils/AppError.js';
import { buildPageMeta, escapeRegex } from '../utils/pagination.js';
import { assertSkillsExist } from './user.service.js';

/** Only these owner fields are ever exposed publicly (never email). */
const OWNER_FIELDS = 'name username avatarUrl';

const SORTS = {
  newest: { publishedAt: -1, _id: -1 },
  oldest: { publishedAt: 1, _id: 1 },
  shortest: { expectedDurationWeeks: 1, publishedAt: -1, _id: -1 },
  longest: { expectedDurationWeeks: -1, publishedAt: -1, _id: -1 },
};

const STATUS_LABELS = {
  draft: 'draft',
  recruiting: 'recruiting',
  in_progress: 'in progress',
  completed: 'completed',
  archived: 'archived',
};

const withRelations = (query) =>
  query.populate('owner', OWNER_FIELDS).populate('requiredSkills', SKILL_PUBLIC_FIELDS);

const populateProject = (project) =>
  project.populate([
    { path: 'owner', select: OWNER_FIELDS },
    { path: 'requiredSkills', select: SKILL_PUBLIC_FIELDS },
  ]);

// ── helpers ────────────────────────────────────────────────

/** The roles have to fit inside the team, and the team can't shrink below who is already on it. */
function assertTeamCapacity({ teamSize, roles, memberCount }) {
  if (teamSize < memberCount) {
    throw new AppError(422, 'INVALID_TEAM_SIZE', 'The team size is too small', [
      { field: 'teamSize', message: `Team size can't be smaller than the ${memberCount} current member(s)` },
    ]);
  }
  const totalSlots = roles.reduce((sum, role) => sum + role.slots, 0);
  if (totalSlots > teamSize - 1) {
    throw new AppError(422, 'INVALID_TEAM_SIZE', 'The roles do not fit in the team', [
      {
        field: 'roles',
        message: `Roles add up to ${totalSlots} people, but a team of ${teamSize} has room for ${teamSize - 1} besides you. Reduce the slots or raise the team size.`,
      },
    ]);
  }
}

/**
 * Applies the submitted role list to the stored one. Roles with an id keep their identity and
 * their `filled` count; roles without an id are new; stored roles that are missing get removed.
 */
function reconcileRoles(currentRoles, incoming) {
  const remaining = new Map(currentRoles.map((role) => [String(role._id), role]));
  const next = [];

  incoming.forEach((role, index) => {
    if (!role.id) {
      next.push({ title: role.title, description: role.description, slots: role.slots, filled: 0 });
      return;
    }
    const current = remaining.get(role.id);
    if (!current) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Some fields are invalid', [
        { field: `roles.${index}.id`, message: 'This role does not belong to the project' },
      ]);
    }
    if (role.slots < current.filled) {
      throw new AppError(422, 'ROLE_SLOTS_BELOW_FILLED', 'A role has fewer slots than accepted members', [
        { field: `roles.${index}.slots`, message: `"${current.title}" already has ${current.filled} member(s)` },
      ]);
    }
    next.push({
      _id: current._id,
      title: role.title,
      description: role.description,
      slots: role.slots,
      filled: current.filled,
    });
    remaining.delete(role.id);
  });

  for (const removed of remaining.values()) {
    if (removed.filled > 0) {
      throw new AppError(422, 'ROLE_IN_USE', `"${removed.title}" already has team members and can't be removed`, [
        { field: 'roles', message: `"${removed.title}" already has team members and can't be removed` },
      ]);
    }
  }
  return next;
}

/** Loads a project the caller owns. Non-owners get 403 for public projects and 404 otherwise. */
async function loadOwnedProject(id, user) {
  const project = await Project.findById(id);
  if (!project) throw AppError.notFound('Project not found');

  if (!canManageProject(project, user)) {
    throw canViewProject(project, user)
      ? AppError.forbidden('Only the project owner can do that')
      : AppError.notFound('Project not found');
  }
  return project;
}

/** The single place that knows which status changes are legal. */
async function transition(project, to) {
  const from = project.status;
  if (!(PROJECT_TRANSITIONS[from] ?? []).includes(to)) {
    throw new AppError(
      422,
      'INVALID_STATE_TRANSITION',
      `A ${STATUS_LABELS[from]} project can't be moved to ${STATUS_LABELS[to]}`,
    );
  }
  if (to === 'recruiting' && project.roles.length === 0) {
    throw new AppError(422, 'ROLES_REQUIRED', 'Add at least one role before publishing', [
      { field: 'roles', message: 'Add at least one role before publishing' },
    ]);
  }

  project.status = to;
  if (to === 'recruiting') project.publishedAt = project.publishedAt ?? new Date();
  project.completedAt = to === 'completed' ? new Date() : null;
  await project.save();
  return populateProject(project);
}

// ── queries ────────────────────────────────────────────────

const emptyPage = ({ page, limit }) => ({ projects: [], meta: buildPageMeta({ page, limit, total: 0 }) });

/** Explore: search, filters, sorting and pagination over published projects. */
export async function listProjects(query) {
  const { q, match, category, difficulty, status, sort, page, limit } = query;
  const slugs = [...new Set(query.skills ?? [])];

  const filter = {
    'moderation.status': 'visible',
    status: status === 'all' ? { $in: PUBLIC_PROJECT_STATUSES } : status,
  };
  if (category) filter.category = category;
  if (difficulty) filter.difficulty = difficulty;

  if (slugs.length > 0) {
    const ids = (await Skill.find({ slug: { $in: slugs } }).select('_id')).map((skill) => skill._id);
    // Requiring a skill that doesn't exist can never match anything.
    if (match === 'all' ? ids.length !== slugs.length : ids.length === 0) {
      return emptyPage({ page, limit });
    }
    filter.requiredSkills = match === 'all' ? { $all: ids } : { $in: ids };
  }

  if (q) {
    // Substring match on title/summary, plus projects that require a skill whose name matches.
    const pattern = new RegExp(escapeRegex(q), 'i');
    const skillIds = (await Skill.find({ name: pattern }).limit(20).select('_id')).map((skill) => skill._id);
    filter.$or = [{ title: pattern }, { summary: pattern }];
    if (skillIds.length > 0) filter.$or.push({ requiredSkills: { $in: skillIds } });
  }

  const [projects, total] = await Promise.all([
    withRelations(
      Project.find(filter)
        .select('-description')
        .sort(SORTS[sort])
        .skip((page - 1) * limit)
        .limit(limit),
    ),
    Project.countDocuments(filter),
  ]);

  return { projects, meta: buildPageMeta({ page, limit, total }) };
}

export async function listMyProjects(user, { relation, status, page, limit }) {
  let filter;
  if (relation === 'joined') {
    const memberships = await TeamMembership.find({ user: user._id, role: 'member', status: 'active' }).select('project');
    filter = { _id: { $in: memberships.map((membership) => membership.project) } };
  } else {
    filter = { owner: user._id };
  }
  filter.status = status === 'all' ? { $ne: 'archived' } : status;

  const [projects, total] = await Promise.all([
    withRelations(
      Project.find(filter)
        .select('-description')
        .sort({ updatedAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ),
    Project.countDocuments(filter),
  ]);

  return { projects, meta: buildPageMeta({ page, limit, total }) };
}

/** Full project page: project + owner + skills + roles + current members + what the viewer may do. */
export async function getProjectDetails(id, viewer) {
  const project = await Project.findById(id);
  if (!project || !canViewProject(project, viewer)) throw AppError.notFound('Project not found');

  await populateProject(project);
  const memberships = await TeamMembership.find({ project: project._id, status: 'active' })
    .sort({ role: -1, joinedAt: 1 }) // "owner" sorts after "member" alphabetically, so -1 puts the owner first
    .populate('user', OWNER_FIELDS);

  const viewerIsOwner = isOwner(project, viewer);
  const viewerIsMember = Boolean(viewer) && memberships.some((m) => String(m.user._id) === String(viewer._id));
  const hasOpenRole = project.roles.some((role) => role.filled < role.slots);

  return {
    ...project.toJSON(),
    members: memberships.map((m) => ({
      id: String(m.user._id),
      name: m.user.name,
      username: m.user.username,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      title: m.title,
      joinedAt: m.joinedAt,
    })),
    viewer: {
      isOwner: viewerIsOwner,
      isMember: viewerIsMember,
      canApply: Boolean(viewer) && !viewerIsOwner && !viewerIsMember && project.status === 'recruiting' && hasOpenRole,
    },
  };
}

// ── commands ───────────────────────────────────────────────

export async function createProject(user, input) {
  await assertSkillsExist(input.requiredSkills, 'requiredSkills');

  const roles = input.roles.map(({ title, description, slots }) => ({ title, description, slots }));
  assertTeamCapacity({ teamSize: input.teamSize, roles, memberCount: 1 });

  const project = await Project.create({ ...input, roles, owner: user._id, status: 'draft', memberCount: 1 });

  try {
    await TeamMembership.create({ project: project._id, user: user._id, role: 'owner', title: 'Project Lead' });
  } catch (err) {
    await Project.deleteOne({ _id: project._id }); // don't leave a project without its owner membership
    throw err;
  }

  return populateProject(project);
}

export async function updateProject(id, user, input) {
  const project = await loadOwnedProject(id, user);
  if (project.status === 'archived') {
    throw new AppError(422, 'PROJECT_ARCHIVED', 'Restore this project before editing it');
  }

  const { roles: incomingRoles, requiredSkills, ...scalars } = input;

  if (requiredSkills) {
    await assertSkillsExist(requiredSkills, 'requiredSkills');
    project.requiredSkills = requiredSkills;
  }
  project.set(Object.fromEntries(Object.entries(scalars).filter(([, value]) => value !== undefined)));

  const roles = incomingRoles ? reconcileRoles(project.roles, incomingRoles) : project.roles;
  if (project.status !== 'draft' && roles.length === 0) {
    throw new AppError(422, 'ROLES_REQUIRED', 'A published project needs at least one role', [
      { field: 'roles', message: 'A published project needs at least one role. Unpublish it first to remove every role.' },
    ]);
  }
  assertTeamCapacity({ teamSize: project.teamSize, roles, memberCount: project.memberCount });
  if (incomingRoles) project.roles = roles;

  await project.save();
  return populateProject(project);
}

export async function publishProject(id, user) {
  const project = await loadOwnedProject(id, user);
  if (project.status !== 'draft') {
    throw new AppError(422, 'INVALID_STATE_TRANSITION', 'Only draft projects can be published');
  }
  return transition(project, 'recruiting');
}

export async function unpublishProject(id, user) {
  const project = await loadOwnedProject(id, user);
  if (project.status !== 'recruiting') {
    throw new AppError(422, 'INVALID_STATE_TRANSITION', 'Only projects that are recruiting can be unpublished');
  }
  return transition(project, 'draft');
}

export async function changeProjectStatus(id, user, status) {
  return transition(await loadOwnedProject(id, user), status);
}

/** "Deleting" archives the project: it disappears from Explore and lists but can be restored. */
export async function archiveProject(id, user) {
  return transition(await loadOwnedProject(id, user), 'archived');
}
