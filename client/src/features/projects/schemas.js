import { z } from 'zod';
import { DIFFICULTIES, LIMITS, PROJECT_CATEGORIES } from '../../lib/constants.js';

const number = (label, min, max) =>
  z
    .number({ error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be at most ${max}`);

const skill = z.object({ id: z.string(), name: z.string(), slug: z.string(), category: z.string() });

const role = z.object({
  id: z.string().optional(), // set when editing a role that already exists
  title: z
    .string()
    .trim()
    .min(LIMITS.ROLE_TITLE_MIN, `Role title must be at least ${LIMITS.ROLE_TITLE_MIN} characters`)
    .max(LIMITS.ROLE_TITLE_MAX, `Role title must be at most ${LIMITS.ROLE_TITLE_MAX} characters`),
  description: z.string().trim().max(LIMITS.ROLE_DESCRIPTION_MAX, `Role description must be at most ${LIMITS.ROLE_DESCRIPTION_MAX} characters`),
  slots: number('Slots', 1, LIMITS.ROLE_SLOTS_MAX),
});

export const projectSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(LIMITS.PROJECT_TITLE_MIN, `Title must be at least ${LIMITS.PROJECT_TITLE_MIN} characters`)
      .max(LIMITS.PROJECT_TITLE_MAX, `Title must be at most ${LIMITS.PROJECT_TITLE_MAX} characters`),
    summary: z
      .string()
      .trim()
      .min(LIMITS.PROJECT_SUMMARY_MIN, `Summary must be at least ${LIMITS.PROJECT_SUMMARY_MIN} characters`)
      .max(LIMITS.PROJECT_SUMMARY_MAX, `Summary must be at most ${LIMITS.PROJECT_SUMMARY_MAX} characters`),
    description: z
      .string()
      .trim()
      .min(LIMITS.PROJECT_DESCRIPTION_MIN, `Description must be at least ${LIMITS.PROJECT_DESCRIPTION_MIN} characters`)
      .max(LIMITS.PROJECT_DESCRIPTION_MAX, `Description must be at most ${LIMITS.PROJECT_DESCRIPTION_MAX} characters`),
    category: z.enum(PROJECT_CATEGORIES.map((item) => item.value), { error: 'Choose a category' }),
    difficulty: z.enum(DIFFICULTIES.map((item) => item.value), { error: 'Choose a difficulty' }),
    expectedDurationWeeks: number('Duration', 1, LIMITS.DURATION_WEEKS_MAX),
    teamSize: number('Team size', LIMITS.TEAM_SIZE_MIN, LIMITS.TEAM_SIZE_MAX),
    bannerUrl: z
      .string()
      .trim()
      .max(LIMITS.URL_MAX, 'This URL is too long')
      .refine((value) => {
        if (value === '') return true;
        try {
          return new URL(value).protocol === 'https:';
        } catch {
          return false;
        }
      }, 'Enter a full image URL starting with https://'),
    requiredSkills: z
      .array(skill)
      .min(1, 'Choose at least one skill')
      .max(LIMITS.PROJECT_SKILLS_MAX, `Choose at most ${LIMITS.PROJECT_SKILLS_MAX} skills`),
    roles: z.array(role).max(LIMITS.ROLES_MAX, `A project can have at most ${LIMITS.ROLES_MAX} roles`),
  })
  .superRefine((values, ctx) => {
    const totalSlots = values.roles.reduce((sum, item) => sum + (Number.isFinite(item.slots) ? item.slots : 0), 0);
    if (Number.isFinite(values.teamSize) && totalSlots > values.teamSize - 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['roles'],
        message: `Roles add up to ${totalSlots} people, but a team of ${values.teamSize} has room for ${values.teamSize - 1} besides you. Reduce the slots or raise the team size.`,
      });
    }
  });

export const emptyProjectValues = {
  title: '',
  summary: '',
  description: '',
  category: '',
  difficulty: '',
  expectedDurationWeeks: 8,
  teamSize: 4,
  bannerUrl: '',
  requiredSkills: [],
  roles: [{ title: '', description: '', slots: 1 }],
};

/** API project -> form values. */
export function projectToFormValues(project) {
  return {
    title: project.title,
    summary: project.summary,
    description: project.description,
    category: project.category,
    difficulty: project.difficulty,
    expectedDurationWeeks: project.expectedDurationWeeks,
    teamSize: project.teamSize,
    bannerUrl: project.bannerUrl ?? '',
    requiredSkills: project.requiredSkills,
    roles: project.roles.map(({ id, title, description, slots }) => ({ id, title, description, slots })),
  };
}

/** Form values -> API payload (skills become ids; roles keep their ids when they have one). */
export function formValuesToPayload(values) {
  return {
    ...values,
    requiredSkills: values.requiredSkills.map((item) => item.id),
    roles: values.roles.map(({ id, title, description, slots }) => ({ ...(id ? { id } : {}), title, description, slots })),
  };
}
