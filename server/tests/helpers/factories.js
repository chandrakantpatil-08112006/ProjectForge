import request from 'supertest';
import app from '../../src/app.js';
import { Skill } from '../../src/models/Skill.js';
import { User } from '../../src/models/User.js';

export const API = '/api/v1';

let counter = 0;

/** Registers a user through the real API and returns { user, token, headers }. */
export async function createUser(overrides = {}) {
  counter += 1;
  const body = {
    name: `Test User ${counter}`,
    username: `tester${counter}`,
    email: `tester${counter}@example.com`,
    password: 'correct-horse-battery',
    ...overrides,
  };
  const res = await request(app).post(`${API}/auth/register`).send(body);
  if (res.status !== 201) throw new Error(`createUser failed: ${JSON.stringify(res.body)}`);
  const token = res.body.data.accessToken;
  return { user: res.body.data.user, token, headers: { Authorization: `Bearer ${token}` } };
}

export async function createAdmin() {
  const admin = await createUser({ name: 'Admin User' });
  await User.updateOne({ _id: admin.user.id }, { role: 'admin' });
  return admin;
}

export async function createSkills(names = ['React', 'Node.js', 'MongoDB', 'Python']) {
  const categories = { React: 'frontend', 'Node.js': 'backend', MongoDB: 'database', Python: 'language' };
  const docs = await Skill.create(
    names.map((name) => ({
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: categories[name] ?? 'other',
    })),
  );
  return docs.map((doc) => ({ id: String(doc._id), name: doc.name, slug: doc.slug }));
}

export function projectPayload(skillIds, overrides = {}) {
  return {
    title: 'Campus Carpool Finder',
    summary: 'A web app that helps students share rides to campus and split costs.',
    description: 'We are building a carpooling platform for university students. It needs a friendly UI, a matching API and a map view.',
    category: 'web',
    difficulty: 'intermediate',
    requiredSkills: skillIds,
    roles: [
      { title: 'Frontend Developer', description: 'Build the React UI', slots: 2 },
      { title: 'Backend Developer', slots: 1 },
    ],
    teamSize: 5,
    expectedDurationWeeks: 8,
    ...overrides,
  };
}

export async function createProject(owner, skillIds, overrides = {}, { publish = false } = {}) {
  const res = await request(app).post(`${API}/projects`).set(owner.headers).send(projectPayload(skillIds, overrides));
  if (res.status !== 201) throw new Error(`createProject failed: ${JSON.stringify(res.body)}`);
  const project = res.body.data;
  if (publish) {
    const published = await request(app).post(`${API}/projects/${project.id}/publish`).set(owner.headers);
    if (published.status !== 200) throw new Error(`publish failed: ${JSON.stringify(published.body)}`);
    return published.body.data;
  }
  return project;
}
