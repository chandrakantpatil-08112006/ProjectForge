import { z } from 'zod';
import { LIMITS, RESERVED_USERNAMES } from '../../lib/constants.js';

const required = (label) => z.string({ error: `${label} is required` });

export const registerSchema = z.object({
  name: required('Name')
    .trim()
    .min(LIMITS.NAME_MIN, `Name must be at least ${LIMITS.NAME_MIN} characters`)
    .max(LIMITS.NAME_MAX, `Name must be at most ${LIMITS.NAME_MAX} characters`),
  username: required('Username')
    .trim()
    .toLowerCase()
    .min(LIMITS.USERNAME_MIN, `Username must be at least ${LIMITS.USERNAME_MIN} characters`)
    .max(LIMITS.USERNAME_MAX, `Username must be at most ${LIMITS.USERNAME_MAX} characters`)
    .regex(/^[a-z0-9_-]+$/, 'Use only letters, numbers, hyphens and underscores')
    .refine((value) => !RESERVED_USERNAMES.includes(value), 'This username is not available'),
  email: required('Email').trim().toLowerCase().email('Enter a valid email address'),
  password: required('Password')
    .min(LIMITS.PASSWORD_MIN, `Password must be at least ${LIMITS.PASSWORD_MIN} characters`)
    .refine(
      (value) => new TextEncoder().encode(value).length <= LIMITS.PASSWORD_MAX_BYTES,
      `Password must be at most ${LIMITS.PASSWORD_MAX_BYTES} bytes`,
    ),
});

export const loginSchema = z.object({
  email: required('Email').trim().toLowerCase().email('Enter a valid email address'),
  password: required('Password').min(1, 'Password is required'),
});
