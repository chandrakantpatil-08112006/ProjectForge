import { z } from 'zod';
import {
  GITHUB_USERNAME_REGEX,
  LIMITS,
  RESERVED_USERNAMES,
  USERNAME_REGEX,
} from '../constants/enums.js';

/** A string that reports "<Label> is required" when missing instead of Zod's generic message. */
export const requiredString = (label) =>
  z.string({
    error: (issue) => (issue.input === undefined ? `${label} is required` : `${label} must be text`),
  });

export const nameField = requiredString('Name')
  .trim()
  .min(LIMITS.NAME_MIN, `Name must be at least ${LIMITS.NAME_MIN} characters`)
  .max(LIMITS.NAME_MAX, `Name must be at most ${LIMITS.NAME_MAX} characters`);

export const usernameField = requiredString('Username')
  .trim()
  .toLowerCase()
  .min(LIMITS.USERNAME_MIN, `Username must be at least ${LIMITS.USERNAME_MIN} characters`)
  .max(LIMITS.USERNAME_MAX, `Username must be at most ${LIMITS.USERNAME_MAX} characters`)
  .regex(USERNAME_REGEX, 'Use only letters, numbers, hyphens and underscores')
  .refine((value) => !RESERVED_USERNAMES.includes(value), 'This username is not available');

export const emailField = requiredString('Email')
  .trim()
  .toLowerCase()
  .max(254, 'Email is too long')
  .email('Enter a valid email address');

/** bcrypt only uses the first 72 BYTES, so we cap by bytes rather than characters. */
export const newPasswordField = requiredString('Password')
  .min(LIMITS.PASSWORD_MIN, `Password must be at least ${LIMITS.PASSWORD_MIN} characters`)
  .refine(
    (value) => Buffer.byteLength(value, 'utf8') <= LIMITS.PASSWORD_MAX_BYTES,
    `Password must be at most ${LIMITS.PASSWORD_MAX_BYTES} bytes`,
  );

/** Only http(s) URLs are accepted, which rules out javascript: and data: URLs. */
function isSafeUrl(value, { httpsOnly = false, hostSuffix } = {}) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && (httpsOnly || url.protocol !== 'http:')) return false;
    if (hostSuffix) {
      const host = url.hostname.toLowerCase();
      if (host !== hostSuffix && !host.endsWith(`.${hostSuffix}`)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Empty string means "clear this field"; anything else must be a valid URL. */
export const optionalUrl = (label, options = {}) =>
  z.union([
    z.literal(''),
    z
      .string()
      .trim()
      .max(LIMITS.URL_MAX, `${label} is too long`)
      .refine((value) => isSafeUrl(value, options), {
        message: options.hostSuffix
          ? `Enter a full ${options.hostSuffix} URL starting with https://`
          : `Enter a full URL starting with ${options.httpsOnly ? 'https://' : 'http:// or https://'}`,
      }),
  ]);

export const githubUsernameField = z.union([
  z.literal(''),
  z
    .string()
    .trim()
    .regex(GITHUB_USERNAME_REGEX, 'Enter a valid GitHub username (without @ or URL)'),
]);

export const objectIdField = (label = 'Id') =>
  requiredString(label).regex(/^[a-f\d]{24}$/i, `${label} is not a valid id`);

export const objectIdParams = z.object({ id: objectIdField('Id') });

/** A list of ObjectIds with duplicates removed. */
export const objectIdList = (label, { min = 0, max }) =>
  z
    .array(objectIdField(label), { error: `${label} must be a list` })
    .min(min, min > 0 ? `Choose at least ${min}` : undefined)
    .max(max, `You can choose at most ${max}`)
    .transform((ids) => [...new Set(ids.map((id) => id.toLowerCase()))]);

export const skillsField = objectIdList('Skill', { max: LIMITS.SKILLS_MAX });
