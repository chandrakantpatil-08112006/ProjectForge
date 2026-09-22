import { z } from 'zod';
import { emailField, nameField, newPasswordField, requiredString, usernameField } from './common.js';

export const registerSchema = {
  body: z.object({
    name: nameField,
    username: usernameField,
    email: emailField,
    password: newPasswordField,
  }),
};

export const loginSchema = {
  body: z.object({
    email: emailField,
    // No strength rules at login; we only need something to compare.
    password: requiredString('Password').min(1, 'Password is required').max(200),
  }),
};
