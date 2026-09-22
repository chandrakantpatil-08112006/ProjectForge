import { z } from 'zod';
import {
  DIFFICULTIES,
  LIMITS,
  PROJECT_CATEGORIES,
  PROJECT_SORTS,
  PROJECT_STATUSES,
} from '../constants/enums.js';
import { objectIdField, objectIdList, objectIdParams, optionalUrl, requiredString } from './common.js';
import { csvList } from './skill.validator.js';

const title = requiredString('Title')
  .trim()
  .min(LIMITS.PROJECT_TITLE_MIN, `Title must be at least ${LIMITS.PROJECT_TITLE_MIN} characters`)
  .max(LIMITS.PROJECT_TITLE_MAX, `Title must be at most ${LIMITS.PROJECT_TITLE_MAX} characters`);

const summary = requiredString('Summary')
  .trim()
  .min(LIMITS.PROJECT_SUMMARY_MIN, `Summary must be at least ${LIMITS.PROJECT_SUMMARY_MIN} characters`)
  .max(LIMITS.PROJECT_SUMMARY_MAX, `Summary must be at most ${LIMITS.PROJECT_SUMMARY_MAX} characters`);

const description = requiredString('Description')
  .trim()
  .min(LIMITS.PROJECT_DESCRIPTION_MIN, `Description must be at least ${LIMITS.PROJECT_DESCRIPTION_MIN} characters`)
  .max(LIMITS.PROJECT_DESCRIPTION_MAX, `Description must be at most ${LIMITS.PROJECT_DESCRIPTION_MAX} characters`);

const category = z.enum(PROJECT_CATEGORIES, { error: 'Choose a category' });
const difficulty = z.enum(DIFFICULTIES, { error: 'Choose a difficulty' });

const wholeNumber = (label, min, max) =>
  z
    .number({ error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be at most ${max}`);

const roleInput = z.object({
  // Present when editing an existing role, so its identity (and future applications) is preserved.
  id: objectIdField('Role id').optional(),
  title: requiredString('Role title')
    .trim()
    .min(LIMITS.ROLE_TITLE_MIN, `Role title must be at least ${LIMITS.ROLE_TITLE_MIN} characters`)
    .max(LIMITS.ROLE_TITLE_MAX, `Role title must be at most ${LIMITS.ROLE_TITLE_MAX} characters`),
  description: z
    .string()
    .trim()
    .max(LIMITS.ROLE_DESCRIPTION_MAX, `Role description must be at most ${LIMITS.ROLE_DESCRIPTION_MAX} characters`)
    .default(''),
  slots: wholeNumber('Slots', 1, LIMITS.ROLE_SLOTS_MAX),
});

const roles = z
  .array(roleInput)
  .max(LIMITS.ROLES_MAX, `A project can have at most ${LIMITS.ROLES_MAX} roles`);

const fields = {
  title,
  summary,
  description,
  category,
  difficulty,
  requiredSkills: objectIdList('Skill', { min: 1, max: LIMITS.PROJECT_SKILLS_MAX }),
  roles,
  teamSize: wholeNumber('Team size', LIMITS.TEAM_SIZE_MIN, LIMITS.TEAM_SIZE_MAX),
  expectedDurationWeeks: wholeNumber('Duration', 1, LIMITS.DURATION_WEEKS_MAX),
  bannerUrl: optionalUrl('Banner image URL', { httpsOnly: true }),
};

export const createProjectSchema = {
  body: z.object({
    ...fields,
    roles: fields.roles.default([]),
    bannerUrl: fields.bannerUrl.optional(),
  }),
};

export const updateProjectSchema = {
  params: objectIdParams,
  body: z
    .object(Object.fromEntries(Object.entries(fields).map(([key, schema]) => [key, schema.optional()])))
    .refine((body) => Object.values(body).some((value) => value !== undefined), {
      message: 'Provide at least one field to update',
    }),
};

export const projectIdSchema = { params: objectIdParams };

export const changeStatusSchema = {
  params: objectIdParams,
  body: z.object({ status: z.enum(PROJECT_STATUSES, { error: 'Choose a valid status' }) }),
};

const page = z.coerce.number().int().min(1).max(1000).default(1);

export const listProjectsSchema = {
  query: z.object({
    q: z.string().trim().max(LIMITS.SEARCH_MAX).optional(),
    skills: csvList(10).optional(),
    match: z.enum(['any', 'all']).default('any'),
    category: category.optional(),
    difficulty: difficulty.optional(),
    status: z.enum(['recruiting', 'in_progress', 'completed', 'all']).default('recruiting'),
    sort: z.enum(PROJECT_SORTS).default('newest'),
    page,
    limit: z.coerce.number().int().min(1).max(50).default(12),
  }),
};

export const myProjectsSchema = {
  query: z.object({
    relation: z.enum(['owned', 'joined']).default('owned'),
    // "all" means everything except archived projects; ask for "archived" explicitly.
    status: z.enum([...PROJECT_STATUSES, 'all']).default('all'),
    page,
    limit: z.coerce.number().int().min(1).max(50).default(12),
  }),
};
