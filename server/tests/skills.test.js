import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { seedSkills } from '../src/seeds/seedSkills.js';
import { clearTestDb, connectTestDb, disconnectTestDb } from './helpers/db.js';
import { API, createAdmin, createProject, createSkills, createUser } from './helpers/factories.js';

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(clearTestDb);

describe('GET /skills', () => {
  it('is public and returns skills with pagination meta', async () => {
    await createSkills();
    const res = await request(app).get(`${API}/skills`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(4);
    expect(res.body.meta).toMatchObject({ page: 1, total: 4, totalPages: 1 });
    expect(res.body.data[0]).toMatchObject({ id: expect.any(String), name: 'MongoDB', slug: 'mongodb', category: 'database' });
  });

  it('searches by name (case-insensitive, partial) and treats input literally', async () => {
    await createSkills();
    const partial = await request(app).get(`${API}/skills`).query({ q: 'NODE' });
    expect(partial.body.data.map((s) => s.name)).toEqual(['Node.js']);

    // "." must not act as a regex wildcard: "n.de" would match "Node" if it did.
    const literal = await request(app).get(`${API}/skills`).query({ q: 'n.de' });
    expect(literal.body.data).toHaveLength(0);
  });

  it('filters by category and by slugs', async () => {
    await createSkills();
    const byCategory = await request(app).get(`${API}/skills`).query({ category: 'frontend' });
    expect(byCategory.body.data.map((s) => s.name)).toEqual(['React']);

    const bySlugs = await request(app).get(`${API}/skills`).query({ slugs: 'react,python' });
    expect(bySlugs.body.data.map((s) => s.name).sort()).toEqual(['Python', 'React']);
  });

  it('paginates', async () => {
    await createSkills();
    const res = await request(app).get(`${API}/skills`).query({ limit: 3, page: 2 });
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toMatchObject({ page: 2, limit: 3, total: 4, totalPages: 2 });
  });

  it('rejects invalid query values', async () => {
    const res = await request(app).get(`${API}/skills`).query({ category: 'magic', limit: 9999 });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field).sort()).toEqual(['category', 'limit']);
  });
});

describe('managing skills (admin only)', () => {
  it('rejects guests and regular users', async () => {
    const user = await createUser();
    const guest = await request(app).post(`${API}/skills`).send({ name: 'Rust', category: 'language' });
    const regular = await request(app).post(`${API}/skills`).set(user.headers).send({ name: 'Rust', category: 'language' });
    expect(guest.status).toBe(401);
    expect(regular.status).toBe(403);
  });

  it('lets an admin create, rename and delete a skill', async () => {
    const admin = await createAdmin();

    const created = await request(app).post(`${API}/skills`).set(admin.headers).send({ name: '  C++ ', category: 'language' });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({ name: 'C++', slug: 'cpp', category: 'language' });

    const renamed = await request(app)
      .patch(`${API}/skills/${created.body.data.id}`)
      .set(admin.headers)
      .send({ name: 'C Plus Plus', category: 'other' });
    expect(renamed.status).toBe(200);
    expect(renamed.body.data).toMatchObject({ name: 'C Plus Plus', slug: 'c-plus-plus', category: 'other' });

    const removed = await request(app).delete(`${API}/skills/${created.body.data.id}`).set(admin.headers);
    expect(removed.status).toBe(200);
    expect((await request(app).get(`${API}/skills`)).body.data).toHaveLength(0);
  });

  it('rejects duplicates, including names that collapse to the same slug', async () => {
    const admin = await createAdmin();
    await request(app).post(`${API}/skills`).set(admin.headers).send({ name: 'Node.js', category: 'backend' });
    const dup = await request(app).post(`${API}/skills`).set(admin.headers).send({ name: 'node js', category: 'backend' });
    expect(dup.status).toBe(409);
    expect(dup.body.error.details[0].field).toBe('name');
  });

  it('validates input', async () => {
    const admin = await createAdmin();
    const res = await request(app).post(`${API}/skills`).set(admin.headers).send({ name: '***', category: 'nope' });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field).sort()).toEqual(['category', 'name']);
  });

  it('refuses to delete a skill that projects or profiles use', async () => {
    const admin = await createAdmin();
    const owner = await createUser();
    const [react] = await createSkills(['React']);
    await createProject(owner, [react.id]);

    const res = await request(app).delete(`${API}/skills/${react.id}`).set(admin.headers);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('SKILL_IN_USE');
  });

  it('returns 404 for an unknown skill and 400 for a malformed id', async () => {
    const admin = await createAdmin();
    const missing = await request(app).delete(`${API}/skills/507f1f77bcf86cd799439011`).set(admin.headers);
    const malformed = await request(app).delete(`${API}/skills/xyz`).set(admin.headers);
    expect(missing.status).toBe(404);
    expect(malformed.status).toBe(400);
  });
});

describe('predefined skill seed', () => {
  it('adds the catalogue once and is idempotent', async () => {
    const first = await seedSkills();
    expect(first.added).toBe(first.total);
    const second = await seedSkills();
    expect(second.added).toBe(0);
    const res = await request(app).get(`${API}/skills`).query({ limit: 200 });
    expect(res.body.meta.total).toBe(first.total);
  });
});
