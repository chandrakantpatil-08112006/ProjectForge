import { Skill, SKILL_PUBLIC_FIELDS } from '../models/Skill.js';
import { AppError } from '../utils/AppError.js';

/** Makes sure every id refers to a real skill; used by profiles and projects. */
export async function assertSkillsExist(ids, field = 'skills') {
  if (!ids || ids.length === 0) return;
  const found = await Skill.countDocuments({ _id: { $in: ids } });
  if (found !== ids.length) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Some fields are invalid', [
      { field, message: 'One or more selected skills no longer exist' },
    ]);
  }
}

/** Loads the skill objects onto the user so responses show names, not bare ids. */
export function withSkills(user) {
  return user.populate('skills', SKILL_PUBLIC_FIELDS);
}

/**
 * `user` is the document already loaded by the authenticate middleware and `changes` has been
 * validated and stripped to the editable profile fields, so this is a single write with
 * Mongoose validators running on save.
 */
export async function updateProfile(user, changes) {
  await assertSkillsExist(changes.skills);
  user.set(changes);
  await user.save();
  return withSkills(user);
}
