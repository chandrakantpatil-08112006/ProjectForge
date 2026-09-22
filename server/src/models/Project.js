import mongoose from 'mongoose';
import {
  DIFFICULTIES,
  LIMITS,
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
} from '../constants/enums.js';

const { Schema } = mongoose;

const isInteger = { validator: Number.isInteger, message: '{PATH} must be a whole number' };

/** A position the owner wants to fill. Embedded because it is always read with its project. */
const roleSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Role title is required'],
    trim: true,
    minlength: LIMITS.ROLE_TITLE_MIN,
    maxlength: LIMITS.ROLE_TITLE_MAX,
  },
  description: { type: String, trim: true, maxlength: LIMITS.ROLE_DESCRIPTION_MAX, default: '' },
  slots: { type: Number, required: true, min: 1, max: LIMITS.ROLE_SLOTS_MAX, validate: isInteger },
  // Written only by the team/application services (never by client input).
  filled: { type: Number, default: 0, min: 0, validate: isInteger },
});

const projectSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: LIMITS.PROJECT_TITLE_MIN,
      maxlength: LIMITS.PROJECT_TITLE_MAX,
    },
    summary: {
      type: String,
      required: true,
      trim: true,
      minlength: LIMITS.PROJECT_SUMMARY_MIN,
      maxlength: LIMITS.PROJECT_SUMMARY_MAX,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: LIMITS.PROJECT_DESCRIPTION_MIN,
      maxlength: LIMITS.PROJECT_DESCRIPTION_MAX,
    },
    category: { type: String, enum: PROJECT_CATEGORIES, required: true },
    difficulty: { type: String, enum: DIFFICULTIES, required: true },
    requiredSkills: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
      validate: {
        validator: (ids) => ids.length >= 1 && ids.length <= LIMITS.PROJECT_SKILLS_MAX,
        message: `Choose between 1 and ${LIMITS.PROJECT_SKILLS_MAX} skills`,
      },
    },
    roles: {
      type: [roleSchema],
      default: [],
      validate: {
        validator: (roles) => roles.length <= LIMITS.ROLES_MAX,
        message: `A project can have at most ${LIMITS.ROLES_MAX} roles`,
      },
    },
    // Total people wanted on the team, owner included.
    teamSize: {
      type: Number,
      required: true,
      min: LIMITS.TEAM_SIZE_MIN,
      max: LIMITS.TEAM_SIZE_MAX,
      validate: isInteger,
    },
    expectedDurationWeeks: {
      type: Number,
      required: true,
      min: 1,
      max: LIMITS.DURATION_WEEKS_MAX,
      validate: isInteger,
    },
    bannerUrl: { type: String, trim: true, maxlength: LIMITS.URL_MAX, default: '' },

    status: { type: String, enum: PROJECT_STATUSES, default: 'draft', required: true },
    // Kept in step with TeamMembership by the service layer (owner counts as 1).
    memberCount: { type: Number, default: 1, min: 1 },
    publishedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },

    // Placeholder for admin moderation so we never need a data migration later.
    moderation: {
      status: { type: String, enum: ['visible', 'hidden', 'removed'], default: 'visible' },
      reason: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        if (Array.isArray(ret.roles)) {
          ret.roles = ret.roles.map(({ _id, ...role }) => ({
            id: String(_id),
            ...role,
            openSlots: Math.max(0, role.slots - role.filled),
          }));
        }
        delete ret.moderation;
        return ret;
      },
    },
  },
);

// Explore: default view (published, visible, newest first)
projectSchema.index({ status: 1, 'moderation.status': 1, publishedAt: -1 });
projectSchema.index({ requiredSkills: 1 });
projectSchema.index({ category: 1, difficulty: 1 });
// "My projects"
projectSchema.index({ owner: 1, status: 1, updatedAt: -1 });

export const Project = mongoose.model('Project', projectSchema);
