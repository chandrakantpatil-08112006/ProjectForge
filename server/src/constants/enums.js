export const API_PREFIX = '/api/v1';

export const USER_ROLES = Object.freeze(['user', 'admin']);
export const USER_STATUSES = Object.freeze(['active', 'suspended', 'deleted']);
export const EXPERIENCE_LEVELS = Object.freeze(['beginner', 'intermediate', 'advanced']);

// Usernames that would collide with routes or look official.
export const RESERVED_USERNAMES = Object.freeze([
  'admin', 'administrator', 'api', 'me', 'settings', 'login', 'logout', 'register',
  'dashboard', 'explore', 'projects', 'project', 'workspace', 'messages',
  'notifications', 'profile', 'support', 'help', 'root', 'system', 'projectforge', 'null', 'undefined',
]);

export const LIMITS = Object.freeze({
  NAME_MIN: 2,
  NAME_MAX: 60,
  USERNAME_MIN: 3,
  USERNAME_MAX: 24,
  PASSWORD_MIN: 8,
  PASSWORD_MAX_BYTES: 72, // bcrypt silently ignores anything beyond 72 bytes
  BIO_MAX: 500,
  LOCATION_MAX: 60,
  URL_MAX: 300,
  SKILLS_MAX: 20, // per user profile

  SKILL_NAME_MAX: 40,

  PROJECT_TITLE_MIN: 5,
  PROJECT_TITLE_MAX: 100,
  PROJECT_SUMMARY_MIN: 20,
  PROJECT_SUMMARY_MAX: 200,
  PROJECT_DESCRIPTION_MIN: 30,
  PROJECT_DESCRIPTION_MAX: 5000,
  PROJECT_SKILLS_MAX: 15,
  ROLES_MAX: 8,
  ROLE_TITLE_MIN: 2,
  ROLE_TITLE_MAX: 60,
  ROLE_DESCRIPTION_MAX: 500,
  ROLE_SLOTS_MAX: 10,
  TEAM_SIZE_MIN: 2,
  TEAM_SIZE_MAX: 20,
  DURATION_WEEKS_MAX: 104,
  SEARCH_MAX: 60,
});

export const USERNAME_REGEX = /^[a-z0-9_-]+$/;
// GitHub rule: alphanumeric or single hyphens, cannot start/end with a hyphen, max 39 chars.
export const GITHUB_USERNAME_REGEX = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
// Letters, numbers and the punctuation seen in real skill names: C++, C#, Node.js, CI/CD, UI/UX, R&D.
export const SKILL_NAME_REGEX = /^[\p{L}\p{N}.+#\-/& ]+$/u;

// ── Skills ─────────────────────────────────────────────
export const SKILL_CATEGORIES = Object.freeze([
  'language', 'frontend', 'backend', 'mobile', 'database', 'devops', 'data_ai', 'design', 'testing', 'other',
]);

// ── Projects ───────────────────────────────────────────
export const PROJECT_CATEGORIES = Object.freeze([
  'web', 'mobile', 'ai_ml', 'data', 'game', 'devtools', 'cloud', 'security', 'embedded', 'other',
]);
export const DIFFICULTIES = EXPERIENCE_LEVELS;

export const PROJECT_STATUSES = Object.freeze(['draft', 'recruiting', 'in_progress', 'completed', 'archived']);
/** Statuses that appear on the public Explore page and public project URLs. */
export const PUBLIC_PROJECT_STATUSES = Object.freeze(['recruiting', 'in_progress', 'completed']);

/**
 * The project lifecycle. Publishing is draft -> recruiting, unpublishing is recruiting -> draft,
 * "deleting" is any -> archived (a soft delete), and archived projects can be restored to draft.
 */
export const PROJECT_TRANSITIONS = Object.freeze({
  draft: ['recruiting', 'archived'],
  recruiting: ['draft', 'in_progress', 'archived'],
  in_progress: ['recruiting', 'completed', 'archived'],
  completed: ['in_progress', 'archived'],
  archived: ['draft'],
});

export const PROJECT_SORTS = Object.freeze(['newest', 'oldest', 'shortest', 'longest']);

export const MEMBERSHIP_ROLES = Object.freeze(['owner', 'member']);
export const MEMBERSHIP_STATUSES = Object.freeze(['active', 'left', 'removed']);
