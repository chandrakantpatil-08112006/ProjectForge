import mongoose from 'mongoose';
import { LIMITS, MEMBERSHIP_ROLES, MEMBERSHIP_STATUSES } from '../constants/enums.js';

const { Schema } = mongoose;

/**
 * Who is on which project. This is the single source of truth for project access:
 * the owner gets a row too, so every later permission check goes through one collection.
 */
const teamMembershipSchema = new Schema(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: MEMBERSHIP_ROLES, required: true },
    title: { type: String, trim: true, maxlength: LIMITS.ROLE_TITLE_MAX, default: '' },
    // _id of the embedded Project role this member filled (null for the owner).
    roleId: { type: Schema.Types.ObjectId, default: null },
    status: { type: String, enum: MEMBERSHIP_STATUSES, default: 'active', required: true },
    joinedAt: { type: Date, default: Date.now },
    leftAt: { type: Date, default: null },
  },
  { timestamps: true },
);

teamMembershipSchema.index({ project: 1, user: 1 }, { unique: true });
teamMembershipSchema.index({ user: 1, status: 1 });
teamMembershipSchema.index({ project: 1, status: 1 });

export const TeamMembership = mongoose.model('TeamMembership', teamMembershipSchema);
