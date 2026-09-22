export function formatDuration(weeks) {
  if (!weeks) return '';
  if (weeks < 13) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  const months = Math.round(weeks / 4.345);
  return `${weeks} weeks (~${months} months)`;
}

export function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
