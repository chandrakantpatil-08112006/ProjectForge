/**
 * Deterministic slug used for skill identity ("C++" -> "cpp", "Node.js" -> "node-js").
 * Two names that produce the same slug are considered the same skill.
 */
export function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/\+\+/g, 'pp')
    .replace(/#/g, 'sharp')
    .replace(/\.net\b/g, 'dotnet')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
