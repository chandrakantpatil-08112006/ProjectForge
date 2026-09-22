import { SKILLS } from './skills.data.js';
import { Skill } from '../models/Skill.js';
import { slugify } from '../utils/slugify.js';

/** Inserts any predefined skill that isn't in the database yet. Safe to run repeatedly. */
export async function seedSkills() {
  const rows = Object.entries(SKILLS).flatMap(([category, names]) =>
    names.map((name) => ({ name, slug: slugify(name), category })),
  );

  const slugs = rows.map((row) => row.slug);
  if (new Set(slugs).size !== slugs.length) {
    throw new Error('skills.data.js contains two names that produce the same slug');
  }

  const existing = new Set((await Skill.find({ slug: { $in: slugs } }).select('slug')).map((s) => s.slug));
  const missing = rows.filter((row) => !existing.has(row.slug));
  if (missing.length > 0) await Skill.insertMany(missing);

  return { total: rows.length, added: missing.length };
}
