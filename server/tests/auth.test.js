import request from 'supertest';
import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { Session } from '../src/models/Session.js';
import { Skill } from '../src/models/Skill.js';
import { User } from '../src/models/User.js';
import { clearTestDb, connectTestDb, disconnectTestDb } from './helpers/db.js';

const API = '/api/v1';
const validUser = {
  name: 'Ada Lovelace',
  username: 'ada',
  email: 'ada@example.com',
  password: 'correct-horse-battery',
};

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(clearTestDb);

async function registerAda(agent = request.agent(app)) {
  const res = await agent.post(`${API}/auth/register`).send(validUser);
  return { agent, res };
}

describe('health & 404', () => {
  it('reports healthy when the database is connected', async () => {
    const res = await request(app).get(`${API}/health`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, data: { status: 'ok' } });
  });

  it('returns the standard error shape for unknown routes', async () => {
    const res = await request(app).get(`${API}/nope`);
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns INVALID_JSON for malformed bodies', async () => {
    const res = await request(app)
      .post(`${API}/auth/login`)
      .set('Content-Type', 'application/json')
      .send('{"email": ');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
});

describe('POST /auth/register', () => {
  it('creates a user, returns an access token and sets an httpOnly refresh cookie', async () => {
    const { res } = await registerAda();
    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ name: 'Ada Lovelace', username: 'ada', email: 'ada@example.com' });
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.user.id).toEqual(expect.any(String));

    const cookie = res.headers['set-cookie'].find((c) => c.startsWith('pf_refresh='));
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/);
  });

  it('stores a bcrypt hash, never the plain password', async () => {
    await registerAda();
    const user = await User.findOne({ email: 'ada@example.com' }).select('+passwordHash');
    expect(user.passwordHash).not.toBe(validUser.password);
    expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it('normalises email and username to lowercase', async () => {
    const res = await request(app)
      .post(`${API}/auth/register`)
      .send({ ...validUser, email: '  ADA@Example.COM ', username: 'Ada_L' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe('ada@example.com');
    expect(res.body.data.user.username).toBe('ada_l');
  });

  it('rejects duplicate email and username with field-level details', async () => {
    await registerAda();
    const res = await request(app).post(`${API}/auth/register`).send(validUser);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE');
    const fields = res.body.error.details.map((d) => d.field).sort();
    expect(fields).toEqual(['email', 'username']);
  });

  it('validates input and lists every problem', async () => {
    const res = await request(app)
      .post(`${API}/auth/register`)
      .send({ name: 'A', username: 'admin', email: 'not-an-email', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const fields = res.body.error.details.map((d) => d.field).sort();
    expect(fields).toEqual(['email', 'name', 'password', 'username']);
  });

  it('reports missing fields clearly', async () => {
    const res = await request(app).post(`${API}/auth/register`).send({});
    expect(res.status).toBe(400);
    expect(res.body.error.details.find((d) => d.field === 'email').message).toBe('Email is required');
  });

  it('cannot be used to set role or status (mass assignment)', async () => {
    const res = await request(app)
      .post(`${API}/auth/register`)
      .send({ ...validUser, role: 'admin', status: 'active' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('user');
  });

  it('rejects requests from a foreign Origin', async () => {
    const res = await request(app).post(`${API}/auth/register`).set('Origin', 'https://evil.example').send(validUser);
    expect(res.status).toBe(403);
  });
});

describe('POST /auth/login', () => {
  it('logs in with correct credentials', async () => {
    await registerAda();
    const res = await request(app)
      .post(`${API}/auth/login`)
      .send({ email: 'ADA@example.com', password: validUser.password });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
  });

  it('gives the same generic error for wrong password and unknown email', async () => {
    await registerAda();
    const wrongPassword = await request(app).post(`${API}/auth/login`).send({ email: validUser.email, password: 'nope-nope-nope' });
    const unknownEmail = await request(app).post(`${API}/auth/login`).send({ email: 'ghost@example.com', password: 'nope-nope-nope' });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message);
    expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('blocks suspended accounts', async () => {
    await registerAda();
    await User.updateOne({ email: validUser.email }, { status: 'suspended' });
    const res = await request(app).post(`${API}/auth/login`).send({ email: validUser.email, password: validUser.password });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_SUSPENDED');
  });
});

describe('GET /auth/me and authentication middleware', () => {
  it('requires a token', async () => {
    const res = await request(app).get(`${API}/auth/me`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects a garbage token', async () => {
    const res = await request(app).get(`${API}/auth/me`).set('Authorization', 'Bearer not.a.token');
    expect(res.status).toBe(401);
  });

  it('returns the current user', async () => {
    const { res: registered } = await registerAda();
    const res = await request(app).get(`${API}/auth/me`).set('Authorization', `Bearer ${registered.body.data.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(validUser.email);
  });

  it('takes effect immediately when an account is suspended', async () => {
    const { res: registered } = await registerAda();
    await User.updateOne({ email: validUser.email }, { status: 'suspended' });
    const res = await request(app).get(`${API}/auth/me`).set('Authorization', `Bearer ${registered.body.data.accessToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_SUSPENDED');
  });
});

describe('refresh token rotation & logout', () => {
  it('issues a new access token and rotates the refresh cookie', async () => {
    const { agent, res: registered } = await registerAda();
    const oldCookie = registered.headers['set-cookie'][0];

    const res = await agent.post(`${API}/auth/refresh`);
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.headers['set-cookie'][0]).not.toBe(oldCookie);
  });

  it('fails without a cookie', async () => {
    const res = await request(app).post(`${API}/auth/refresh`);
    expect(res.status).toBe(401);
  });

  it('rejects a token that was already rotated (within the grace window: no mass revoke)', async () => {
    const { res: registered } = await registerAda();
    const oldCookie = registered.headers['set-cookie'][0].split(';')[0];

    const first = await request(app).post(`${API}/auth/refresh`).set('Cookie', oldCookie);
    expect(first.status).toBe(200);
    const replay = await request(app).post(`${API}/auth/refresh`).set('Cookie', oldCookie);
    expect(replay.status).toBe(401);

    // The freshly rotated session must still be alive.
    const stillValid = await request(app).post(`${API}/auth/refresh`).set('Cookie', first.headers['set-cookie'][0].split(';')[0]);
    expect(stillValid.status).toBe(200);
  });

  it('never clears the cookie when a refresh fails (a concurrent tab may have just rotated it)', async () => {
    const { res: registered } = await registerAda();
    const oldCookie = registered.headers['set-cookie'][0].split(';')[0];
    await request(app).post(`${API}/auth/refresh`).set('Cookie', oldCookie); // "tab A" wins the race

    const loser = await request(app).post(`${API}/auth/refresh`).set('Cookie', oldCookie); // "tab B" arrives late
    expect(loser.status).toBe(401);
    expect(loser.headers['set-cookie']).toBeUndefined();
  });

  it('revokes every session when an old token is replayed after the grace window', async () => {
    const { res: registered } = await registerAda();
    const oldCookie = registered.headers['set-cookie'][0].split(';')[0];
    const rotated = await request(app).post(`${API}/auth/refresh`).set('Cookie', oldCookie);
    expect(rotated.status).toBe(200);

    // Pretend the rotation happened a minute ago.
    await Session.updateMany({ revokedAt: { $ne: null } }, { revokedAt: new Date(Date.now() - 60_000) });

    const replay = await request(app).post(`${API}/auth/refresh`).set('Cookie', oldCookie);
    expect(replay.status).toBe(401);
    expect(await Session.countDocuments()).toBe(0);

    const newestCookie = rotated.headers['set-cookie'][0].split(';')[0];
    const afterwards = await request(app).post(`${API}/auth/refresh`).set('Cookie', newestCookie);
    expect(afterwards.status).toBe(401);
  });

  it('logout deletes the session and clears the cookie', async () => {
    const { agent } = await registerAda();
    const out = await agent.post(`${API}/auth/logout`);
    expect(out.status).toBe(200);
    expect(out.headers['set-cookie'][0]).toMatch(/pf_refresh=;/);
    expect(await Session.countDocuments()).toBe(0);

    const res = await agent.post(`${API}/auth/refresh`);
    expect(res.status).toBe(401);
  });

  it('logout is harmless when not signed in', async () => {
    const res = await request(app).post(`${API}/auth/logout`);
    expect(res.status).toBe(200);
  });
});

describe('PATCH /users/me', () => {
  const auth = async () => {
    const { res } = await registerAda();
    return { Authorization: `Bearer ${res.body.data.accessToken}` };
  };

  it('requires authentication', async () => {
    const res = await request(app).patch(`${API}/users/me`).send({ bio: 'hi' });
    expect(res.status).toBe(401);
  });

  it('updates profile fields and returns skills as objects', async () => {
    const headers = await auth();
    const [react, node] = await Skill.create([
      { name: 'React', slug: 'react', category: 'frontend' },
      { name: 'Node.js', slug: 'node-js', category: 'backend' },
    ]);
    const res = await request(app)
      .patch(`${API}/users/me`)
      .set(headers)
      .send({
        bio: '  Building things.  ',
        location: 'Bengaluru, India',
        skills: [String(react._id), String(node._id), String(react._id)],
        githubUsername: 'ada-l',
        linkedinUrl: 'https://www.linkedin.com/in/ada',
        portfolioUrl: 'https://ada.dev',
        avatarUrl: 'https://example.com/me.png',
        experienceLevel: 'advanced',
      });
    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({
      bio: 'Building things.',
      location: 'Bengaluru, India',
      githubUsername: 'ada-l',
      experienceLevel: 'advanced',
    });
    expect(res.body.data.user.skills).toEqual([
      { id: String(react._id), name: 'React', slug: 'react', category: 'frontend' },
      { id: String(node._id), name: 'Node.js', slug: 'node-js', category: 'backend' },
    ]);
  });

  it('ignores fields that must not be user-editable', async () => {
    const headers = await auth();
    const res = await request(app)
      .patch(`${API}/users/me`)
      .set(headers)
      .send({ bio: 'x', role: 'admin', email: 'evil@example.com', status: 'suspended' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('user');
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.status).toBe('active');
  });

  it('rejects unsafe or malformed values', async () => {
    const headers = await auth();
    const res = await request(app)
      .patch(`${API}/users/me`)
      .set(headers)
      .send({
        avatarUrl: 'javascript:alert(1)',
        linkedinUrl: 'https://evil.com/in/ada',
        githubUsername: '-bad-',
        experienceLevel: 'wizard',
      });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field).sort()).toEqual([
      'avatarUrl',
      'experienceLevel',
      'githubUsername',
      'linkedinUrl',
    ]);
  });

  it('rejects skills that do not exist', async () => {
    const headers = await auth();
    const res = await request(app)
      .patch(`${API}/users/me`)
      .set(headers)
      .send({ skills: ['507f1f77bcf86cd799439011'] });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('skills');
  });

  it('rejects an empty update', async () => {
    const headers = await auth();
    const res = await request(app).patch(`${API}/users/me`).set(headers).send({ role: 'admin' });
    expect(res.status).toBe(400);
  });

  it('lets fields be cleared with empty strings', async () => {
    const headers = await auth();
    await request(app).patch(`${API}/users/me`).set(headers).send({ portfolioUrl: 'https://ada.dev' });
    const res = await request(app).patch(`${API}/users/me`).set(headers).send({ portfolioUrl: '' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.portfolioUrl).toBe('');
  });
});

it('keeps mongoose connected for the whole suite', () => {
  expect(mongoose.connection.readyState).toBe(1);
});
