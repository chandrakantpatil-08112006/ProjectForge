import { Project } from '../models/Project.js';
import { Skill } from '../models/Skill.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { buildPageMeta, escapeRegex } from '../utils/pagination.js';
import { slugify } from '../utils/slugify.js';

function slugFor(name) {
  const slug = slugify(name);
  if (!slug) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Some fields are invalid', [
      { field: 'name', message: 'Skill name must contain at least one letter or number' },
    ]);
  }
  return slug;
}

const duplicateSkill = (name) =>
  AppError.conflict('That skill already exists', [
    { field: 'name', message: `"${name}" already exists in the skill list` },
  ]);

export async function listSkills({ q, category, slugs, page, limit }) {
  const filter = {};
  if (category) filter.category = category;
  if (slugs?.length) filter.slug = { $in: slugs };
  if (q) filter.name = { $regex: escapeRegex(q), $options: 'i' };

  const [skills, total] = await Promise.all([
    // Sorted by slug (lower-case name) so "jQuery" doesn't land after "Zod".
    Skill.find(filter)
      .sort({ slug: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Skill.countDocuments(filter),
  ]);

  return { skills, meta: buildPageMeta({ page, limit, total }) };
}

export async function createSkill({ name, category }) {
  const slug = slugFor(name);
  if (await Skill.exists({ slug })) throw duplicateSkill(name);
  return Skill.create({ name, slug, category });
}

export async function updateSkill(id, changes) {
  const skill = await Skill.findById(id);
  if (!skill) throw AppError.notFound('Skill not found');

  if (changes.name !== undefined && changes.name !== skill.name) {
    const slug = slugFor(changes.name);
    if (slug !== skill.slug && (await Skill.exists({ slug, _id: { $ne: skill._id } }))) {
      throw duplicateSkill(changes.name);
    }
    skill.name = changes.name;
    skill.slug = slug;
  }
  if (changes.category !== undefined) skill.category = changes.category;

  await skill.save();
  return skill;
}

export async function deleteSkill(id) {
  const skill = await Skill.findById(id);
  if (!skill) throw AppError.notFound('Skill not found');

  const [projects, users] = await Promise.all([
    Project.countDocuments({ requiredSkills: skill._id }),
    User.countDocuments({ skills: skill._id }),
  ]);
  if (projects + users > 0) {
    throw new AppError(
      409,
      'SKILL_IN_USE',
      `"${skill.name}" is used by ${projects} project(s) and ${users} profile(s), so it can't be deleted. Rename it instead.`,
    );
  }

  await skill.deleteOne();
}
