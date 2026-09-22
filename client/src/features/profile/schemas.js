import { z } from 'zod';
import { EXPERIENCE_LEVELS, GITHUB_USERNAME_REGEX, LIMITS } from '../../lib/constants.js';

const isUrl = (value, { httpsOnly = false, host } = {}) => {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && (httpsOnly || url.protocol !== 'http:')) return false;
    return !host || url.hostname === host || url.hostname.endsWith(`.${host}`);
  } catch {
    return false;
  }
};

const optionalUrl = (message, options) =>
  z
    .string()
    .trim()
    .max(LIMITS.URL_MAX, 'This URL is too long')
    .refine((value) => value === '' || isUrl(value, options), message);

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(LIMITS.NAME_MIN, `Name must be at least ${LIMITS.NAME_MIN} characters`)
    .max(LIMITS.NAME_MAX, `Name must be at most ${LIMITS.NAME_MAX} characters`),
  bio: z.string().trim().max(LIMITS.BIO_MAX, `Bio must be at most ${LIMITS.BIO_MAX} characters`),
  location: z.string().trim().max(LIMITS.LOCATION_MAX, `Location must be at most ${LIMITS.LOCATION_MAX} characters`),
  avatarUrl: optionalUrl('Enter a full image URL starting with https://', { httpsOnly: true }),
  experienceLevel: z.enum(EXPERIENCE_LEVELS.map((level) => level.value)),
  githubUsername: z
    .string()
    .trim()
    .refine((value) => value === '' || GITHUB_USERNAME_REGEX.test(value), 'Enter your GitHub username without @ or a URL'),
  linkedinUrl: optionalUrl('Enter a full linkedin.com URL starting with https://', { httpsOnly: true, host: 'linkedin.com' }),
  portfolioUrl: optionalUrl('Enter a full URL starting with http:// or https://'),
  skills: z
    .array(z.object({ id: z.string(), name: z.string(), slug: z.string(), category: z.string() }))
    .max(LIMITS.SKILLS_MAX, `You can list at most ${LIMITS.SKILLS_MAX} skills`),
});
