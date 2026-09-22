// These mirror server/src/constants/enums.js. The API is always the authority; these drive the UI.

export const LIMITS = {
  NAME_MIN: 2,
  NAME_MAX: 60,
  USERNAME_MIN: 3,
  USERNAME_MAX: 24,
  PASSWORD_MIN: 8,
  PASSWORD_MAX_BYTES: 72,
  BIO_MAX: 500,
  LOCATION_MAX: 60,
  URL_MAX: 300,
  SKILLS_MAX: 20,
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
};

export const RESERVED_USERNAMES = [
  'admin', 'administrator', 'api', 'me', 'settings', 'login', 'logout', 'register',
  'dashboard', 'explore', 'projects', 'project', 'workspace', 'messages',
  'notifications', 'profile', 'support', 'help', 'root', 'system', 'projectforge', 'null', 'undefined',
];

export const GITHUB_USERNAME_REGEX = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];
export const DIFFICULTIES = EXPERIENCE_LEVELS;

export const SKILL_CATEGORIES = [
  { value: 'language', label: 'Languages' },
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'database', label: 'Databases' },
  { value: 'devops', label: 'DevOps & Cloud' },
  { value: 'data_ai', label: 'Data & AI' },
  { value: 'design', label: 'Design' },
  { value: 'testing', label: 'Testing' },
  { value: 'other', label: 'Other' },
];

export const PROJECT_CATEGORIES = [
  { value: 'web', label: 'Web app' },
  { value: 'mobile', label: 'Mobile app' },
  { value: 'ai_ml', label: 'AI & machine learning' },
  { value: 'data', label: 'Data & analytics' },
  { value: 'game', label: 'Games' },
  { value: 'devtools', label: 'Developer tools' },
  { value: 'cloud', label: 'Cloud & DevOps' },
  { value: 'security', label: 'Security' },
  { value: 'embedded', label: 'Embedded & IoT' },
  { value: 'other', label: 'Other' },
];

export const PROJECT_STATUSES = {
  draft: { label: 'Draft', tone: 'neutral' },
  recruiting: { label: 'Recruiting', tone: 'success' },
  in_progress: { label: 'In progress', tone: 'brand' },
  completed: { label: 'Completed', tone: 'info' },
  archived: { label: 'Archived', tone: 'warning' },
};

// Same lifecycle as the server; the server enforces it, the UI only offers legal moves.
export const PROJECT_TRANSITIONS = {
  draft: ['recruiting', 'archived'],
  recruiting: ['draft', 'in_progress', 'archived'],
  in_progress: ['recruiting', 'completed', 'archived'],
  completed: ['in_progress', 'archived'],
  archived: ['draft'],
};

export const EXPLORE_STATUS_OPTIONS = [
  { value: 'recruiting', label: 'Recruiting' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'all', label: 'Any status' },
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'shortest', label: 'Shortest duration' },
  { value: 'longest', label: 'Longest duration' },
];

const labelOf = (list) => (value) => list.find((item) => item.value === value)?.label ?? value;
export const categoryLabel = labelOf(PROJECT_CATEGORIES);
export const difficultyLabel = labelOf(DIFFICULTIES);
export const skillCategoryLabel = labelOf(SKILL_CATEGORIES);
