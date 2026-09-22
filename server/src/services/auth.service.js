import bcrypt from 'bcrypt';
import { env } from '../config/env.js';
import { Session } from '../models/Session.js';
import { SKILL_PUBLIC_FIELDS } from '../models/Skill.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { generateRefreshToken, hashToken, signAccessToken } from '../utils/tokens.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A rotated token that shows up again within this window is almost certainly two tabs
 * refreshing at the same moment, not theft, so we only reject it instead of revoking everything.
 */
const REUSE_GRACE_MS = 10_000;

// Compared against when the email is unknown so "no such user" and "wrong password"
// take the same time (prevents account enumeration through response timing).
const DUMMY_HASH = bcrypt.hash('projectforge-timing-equaliser', env.BCRYPT_COST);

function assertAccountUsable(user) {
  if (user.status === 'suspended') {
    throw AppError.forbidden('Your account has been suspended', 'ACCOUNT_SUSPENDED');
  }
  if (user.status === 'deleted') {
    throw AppError.unauthenticated('Invalid email or password', 'INVALID_CREDENTIALS');
  }
}

async function issueSession(user, meta = {}) {
  const refreshToken = generateRefreshToken();
  const refreshExpiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * DAY_MS);

  await Session.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    userAgent: (meta.userAgent ?? '').slice(0, 300),
    ip: meta.ip ?? '',
    expiresAt: refreshExpiresAt,
  });

  return { accessToken: signAccessToken(user), refreshToken, refreshExpiresAt };
}

export async function register({ name, username, email, password }, meta) {
  const [emailTaken, usernameTaken] = await Promise.all([
    User.exists({ email }),
    User.exists({ username }),
  ]);

  const details = [];
  if (emailTaken) details.push({ field: 'email', message: 'An account with this email already exists' });
  if (usernameTaken) details.push({ field: 'username', message: 'This username is already taken' });
  if (details.length > 0) {
    throw AppError.conflict('Account could not be created', details);
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_COST);
  // If two requests race past the checks above, the unique indexes reject the loser (mapped to 409).
  const user = await User.create({ name, username, email, passwordHash });

  return { user, ...(await issueSession(user, meta)) };
}

export async function login({ email, password }, meta) {
  const user = await User.findOne({ email }).select('+passwordHash');

  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? (await DUMMY_HASH));
  if (!user || !passwordMatches) {
    throw AppError.unauthenticated('Invalid email or password', 'INVALID_CREDENTIALS');
  }
  assertAccountUsable(user);

  await user.populate('skills', SKILL_PUBLIC_FIELDS);
  return { user, ...(await issueSession(user, meta)) };
}

/**
 * Rotates the refresh token: the presented token is atomically marked revoked (so it can be
 * used only once, even under concurrent requests) and a brand-new session is issued.
 */
export async function refresh(rawToken, meta) {
  if (!rawToken) throw AppError.unauthenticated('Session expired. Please sign in again.');

  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const session = await Session.findOneAndUpdate(
    { tokenHash, revokedAt: null, expiresAt: { $gt: now } },
    { $set: { revokedAt: now } },
  );

  if (!session) {
    // Either unknown/expired, or an already-rotated token being replayed.
    const known = await Session.findOne({ tokenHash });
    const replayedOutsideGrace =
      known?.revokedAt && known.expiresAt > now && now - known.revokedAt > REUSE_GRACE_MS;

    if (replayedOutsideGrace) {
      // Someone is using an old token: assume it leaked and sign the user out everywhere.
      await Session.deleteMany({ user: known.user });
    }
    throw AppError.unauthenticated('Session expired. Please sign in again.');
  }

  const user = await User.findById(session.user);
  if (!user) throw AppError.unauthenticated('Session expired. Please sign in again.');
  assertAccountUsable(user);

  await user.populate('skills', SKILL_PUBLIC_FIELDS);
  return { user, ...(await issueSession(user, meta)) };
}

/** Logging out deletes the session, so the token can never be exchanged again. */
export async function logout(rawToken) {
  if (!rawToken) return;
  await Session.deleteOne({ tokenHash: hashToken(rawToken) });
}
