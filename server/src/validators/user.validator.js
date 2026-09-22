import { z } from 'zod';
import { EXPERIENCE_LEVELS, LIMITS } from '../constants/enums.js';
import {
  githubUsernameField,
  nameField,
  optionalUrl,
  skillsField,
} from './common.js';

/**
 * PATCH /users/me. Every field is optional, unknown keys (role, email, status…) are stripped,
 * and at least one known field must be present.
 */
export const updateProfileSchema = {
  body: z
    .object({
      name: nameField.optional(),
      bio: z.string().trim().max(LIMITS.BIO_MAX, `Bio must be at most ${LIMITS.BIO_MAX} characters`).optional(),
      location: z
        .string()
        .trim()
        .max(LIMITS.LOCATION_MAX, `Location must be at most ${LIMITS.LOCATION_MAX} characters`)
        .optional(),
      avatarUrl: optionalUrl('Profile image URL', { httpsOnly: true }).optional(),
      skills: skillsField.optional(),
      githubUsername: githubUsernameField.optional(),
      linkedinUrl: optionalUrl('LinkedIn URL', { httpsOnly: true, hostSuffix: 'linkedin.com' }).optional(),
      portfolioUrl: optionalUrl('Portfolio URL').optional(),
      experienceLevel: z.enum(EXPERIENCE_LEVELS, { error: 'Choose a valid experience level' }).optional(),
    })
    .refine((body) => Object.values(body).some((value) => value !== undefined), {
      message: 'Provide at least one field to update',
    }),
};
