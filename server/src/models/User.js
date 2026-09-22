import mongoose from 'mongoose';
import {
  EXPERIENCE_LEVELS,
  GITHUB_USERNAME_REGEX,
  LIMITS,
  USER_ROLES,
  USER_STATUSES,
  USERNAME_REGEX,
} from '../constants/enums.js';

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: LIMITS.NAME_MIN,
      maxlength: LIMITS.NAME_MAX,
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: LIMITS.USERNAME_MIN,
      maxlength: LIMITS.USERNAME_MAX,
      match: [USERNAME_REGEX, 'Username may only contain letters, numbers, hyphens and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email is invalid'],
    },
    // bcrypt hash. select:false means it is never loaded unless explicitly requested.
    passwordHash: { type: String, required: true, select: false },

    role: { type: String, enum: USER_ROLES, default: 'user', required: true },
    status: { type: String, enum: USER_STATUSES, default: 'active', required: true },

    // ── Profile ────────────────────────────────────────────
    avatarUrl: { type: String, trim: true, maxlength: LIMITS.URL_MAX, default: '' },
    bio: { type: String, trim: true, maxlength: LIMITS.BIO_MAX, default: '' },
    location: { type: String, trim: true, maxlength: LIMITS.LOCATION_MAX, default: '' },
    skills: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Skill' }],
      default: [],
      validate: {
        validator: (skills) => skills.length <= LIMITS.SKILLS_MAX,
        message: `You can list at most ${LIMITS.SKILLS_MAX} skills`,
      },
    },
    // Self-declared and unverified. A verified GitHub link (OAuth) will be stored separately later.
    githubUsername: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: (value) => !value || GITHUB_USERNAME_REGEX.test(value),
        message: 'GitHub username is invalid',
      },
    },
    linkedinUrl: { type: String, trim: true, maxlength: LIMITS.URL_MAX, default: '' },
    portfolioUrl: { type: String, trim: true, maxlength: LIMITS.URL_MAX, default: '' },
    experienceLevel: { type: String, enum: EXPERIENCE_LEVELS, default: 'beginner', required: true },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_doc, ret) {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

// email and username unique indexes come from the field definitions above.
userSchema.index({ status: 1, role: 1 });

export const User = mongoose.model('User', userSchema);
