import mongoose from 'mongoose';
import { LIMITS, SKILL_CATEGORIES } from '../constants/enums.js';

const { Schema } = mongoose;

/** Fields exposed whenever a skill is embedded in another response. */
export const SKILL_PUBLIC_FIELDS = 'name slug category';

/** Admin-managed catalogue of skills that users and projects pick from. */
const skillSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
      minlength: 1,
      maxlength: LIMITS.SKILL_NAME_MAX,
    },
    // Derived from the name by the service; the unique index makes it the skill's identity.
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: { type: String, enum: SKILL_CATEGORIES, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        return ret;
      },
    },
  },
);

skillSchema.index({ category: 1, name: 1 });

export const Skill = mongoose.model('Skill', skillSchema);
