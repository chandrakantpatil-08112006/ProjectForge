import { z } from 'zod';
import { LIMITS, SKILL_CATEGORIES, SKILL_NAME_REGEX } from '../constants/enums.js';
import { objectIdParams, requiredString } from './common.js';

const skillName = requiredString('Skill name')
  .trim()
  .min(1, 'Skill name is required')
  .max(LIMITS.SKILL_NAME_MAX, `Skill name must be at most ${LIMITS.SKILL_NAME_MAX} characters`)
  .regex(SKILL_NAME_REGEX, 'Skill names may only contain letters, numbers and . + # - / &');

const category = z.enum(SKILL_CATEGORIES, { error: 'Choose a valid skill category' });

/** Query strings can repeat a key, so accept "a,b" or ["a","b"] and normalise to an array. */
export const csvList = (max) =>
  z
    .union([z.string(), z.array(z.string())])
    .transform((value) =>
      (Array.isArray(value) ? value : [value])
        .flatMap((part) => part.split(','))
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().max(60)).max(max, `At most ${max} values are allowed`));

export const listSkillsSchema = {
  query: z.object({
    q: z.string().trim().max(LIMITS.SKILL_NAME_MAX).optional(),
    category: category.optional(),
    slugs: csvList(20).optional(),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  }),
};

export const createSkillSchema = {
  body: z.object({ name: skillName, category }),
};

export const updateSkillSchema = {
  params: objectIdParams,
  body: z
    .object({ name: skillName.optional(), category: category.optional() })
    .refine((body) => Object.values(body).some((value) => value !== undefined), {
      message: 'Provide at least one field to update',
    }),
};

export const skillIdSchema = { params: objectIdParams };
