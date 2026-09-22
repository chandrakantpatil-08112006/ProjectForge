import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import app from '../src/app.js';
import { Project } from '../src/models/Project.js';
import { TeamMembership } from '../src/models/TeamMembership.js';
import { clearTestDb, connectTestDb, disconnectTestDb } from './helpers/db.js';
import { API, createProject, createSkills, createUser, projectPayload } from './helpers/factories.js';

let owner;
let other;
let skills; // [{ id, name, slug }]: React, Node.js, MongoDB, Python

beforeAll(connectTestDb);
afterAll(disconnectTestDb);
beforeEach(async () => {
  await clearTestDb();
  owner = await createUser();
  other = await createUser();
  skills = await createSkills();
});

const ids = (...names) => skills.filter((s) => names.includes(s.name)).map((s) => s.id);

describe('POST /projects', () => {
  it('requires authentication', async () => {
    const res = await request(app).post(`${API}/projects`).send(projectPayload(ids('React')));
    expect(res.status).toBe(401);
  });

  it('creates a draft with roles, populated skills and an owner membership', async () => {
    const res = await request(app).post(`${API}/projects`).set(owner.headers).send(projectPayload(ids('React', 'Node.js')));
    expect(res.status).toBe(201);
    const project = res.body.data;

    expect(project).toMatchObject({
      title: 'Campus Carpool Finder',
      status: 'draft',
      category: 'web',
      difficulty: 'intermediate',
      teamSize: 5,
      memberCount: 1,
      expectedDurationWeeks: 8,
    });
    expect(project.owner).toMatchObject({ id: owner.user.id, username: owner.user.username });
    expect(project.requiredSkills.map((s) => s.name).sort()).toEqual(['Node.js', 'React']);
    expect(project.roles).toHaveLength(2);
    expect(project.roles[0]).toMatchObject({ title: 'Frontend Developer', slots: 2, filled: 0, openSlots: 2, id: expect.any(String) });
    expect(project.createdAt).toBeDefined();
    expect(project.updatedAt).toBeDefined();

    const membership = await TeamMembership.findOne({ project: project.id });
    expect(membership).toMatchObject({ role: 'owner', status: 'active' });
    expect(String(membership.user)).toBe(owner.user.id);
  });

  it('never exposes the owner email or password hash', async () => {
    const project = await createProject(owner, ids('React'));
    expect(Object.keys(project.owner).sort()).toEqual(['avatarUrl', 'id', 'name', 'username']);
  });

  it('cannot set owner, status or memberCount through the body', async () => {
    const res = await request(app)
      .post(`${API}/projects`)
      .set(owner.headers)
      .send({ ...projectPayload(ids('React')), owner: other.user.id, status: 'recruiting', memberCount: 9 });
    expect(res.status).toBe(201);
    expect(res.body.data.owner.id).toBe(owner.user.id);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.memberCount).toBe(1);
  });

  it('validates every field and reports them all', async () => {
    const res = await request(app).post(`${API}/projects`).set(owner.headers).send({
      title: 'Hi',
      summary: 'short',
      description: 'short',
      category: 'nope',
      difficulty: 'godlike',
      requiredSkills: [],
      teamSize: 1,
      expectedDurationWeeks: 0,
      bannerUrl: 'http://insecure.example/x.png',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field).sort()).toEqual([
      'bannerUrl', 'category', 'description', 'difficulty', 'expectedDurationWeeks', 'requiredSkills', 'summary', 'teamSize', 'title',
    ]);
  });

  it('rejects unknown skill ids', async () => {
    const res = await request(app).post(`${API}/projects`).set(owner.headers).send(projectPayload(['507f1f77bcf86cd799439011']));
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].field).toBe('requiredSkills');
  });

  it('rejects roles that do not fit the team size', async () => {
    const res = await request(app)
      .post(`${API}/projects`)
      .set(owner.headers)
      .send(projectPayload(ids('React'), { teamSize: 3, roles: [{ title: 'Developer', slots: 3 }] }));
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVALID_TEAM_SIZE');
    expect(res.body.error.details[0].field).toBe('roles');
  });

  it('validates role fields', async () => {
    const res = await request(app)
      .post(`${API}/projects`)
      .set(owner.headers)
      .send(projectPayload(ids('React'), { roles: [{ title: 'X', slots: 0 }] }));
    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field).sort()).toEqual(['roles.0.slots', 'roles.0.title']);
  });
});

describe('GET /projects/:id (details)', () => {
  it('shows a published project to guests with roles, skills, owner and members', async () => {
    const created = await createProject(owner, ids('React', 'Python'), {}, { publish: true });
    const res = await request(app).get(`${API}/projects/${created.id}`);
    expect(res.status).toBe(200);
    const project = res.body.data;
    expect(project.description).toContain('carpooling');
    expect(project.status).toBe('recruiting');
    expect(project.roles).toHaveLength(2);
    expect(project.members).toEqual([
      expect.objectContaining({ id: owner.user.id, role: 'owner', title: 'Project Lead' }),
    ]);
    expect(project.viewer).toEqual({ isOwner: false, isMember: false, canApply: false });
  });

  it('reports what a signed-in visitor may do', async () => {
    const created = await createProject(owner, ids('React'), {}, { publish: true });
    const asOwner = await request(app).get(`${API}/projects/${created.id}`).set(owner.headers);
    const asOther = await request(app).get(`${API}/projects/${created.id}`).set(other.headers);
    expect(asOwner.body.data.viewer).toEqual({ isOwner: true, isMember: true, canApply: false });
    expect(asOther.body.data.viewer).toEqual({ isOwner: false, isMember: false, canApply: true });
  });

  it('hides drafts from everyone except the owner (404, not 403)', async () => {
    const draft = await createProject(owner, ids('React'));
    expect((await request(app).get(`${API}/projects/${draft.id}`)).status).toBe(404);
    expect((await request(app).get(`${API}/projects/${draft.id}`).set(other.headers)).status).toBe(404);
    expect((await request(app).get(`${API}/projects/${draft.id}`).set(owner.headers)).status).toBe(200);
  });

  it('returns 404 for unknown ids and 400 for malformed ones', async () => {
    expect((await request(app).get(`${API}/projects/507f1f77bcf86cd799439011`)).status).toBe(404);
    expect((await request(app).get(`${API}/projects/not-an-id`)).status).toBe(400);
  });

  it('still rejects an invalid token on this public endpoint so clients can refresh', async () => {
    const created = await createProject(owner, ids('React'), {}, { publish: true });
    const res = await request(app).get(`${API}/projects/${created.id}`).set('Authorization', 'Bearer junk');
    expect(res.status).toBe(401);
  });

  it('hides projects a moderator has hidden', async () => {
    const created = await createProject(owner, ids('React'), {}, { publish: true });
    await Project.updateOne({ _id: created.id }, { 'moderation.status': 'hidden' });
    expect((await request(app).get(`${API}/projects/${created.id}`)).status).toBe(404);
  });
});

describe('publish / unpublish / status', () => {
  it('publishes a draft that has roles, and sets publishedAt', async () => {
    const draft = await createProject(owner, ids('React'));
    const res = await request(app).post(`${API}/projects/${draft.id}/publish`).set(owner.headers);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('recruiting');
    expect(res.body.data.publishedAt).toBeTruthy();
  });

  it('refuses to publish a project without roles', async () => {
    const draft = await createProject(owner, ids('React'), { roles: [] });
    const res = await request(app).post(`${API}/projects/${draft.id}/publish`).set(owner.headers);
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('ROLES_REQUIRED');
  });

  it('unpublishes back to draft and hides it from Explore', async () => {
    const project = await createProject(owner, ids('React'), {}, { publish: true });
    const res = await request(app).post(`${API}/projects/${project.id}/unpublish`).set(owner.headers);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('draft');
    expect((await request(app).get(`${API}/projects`)).body.data).toHaveLength(0);
  });

  it('only allows legal lifecycle transitions', async () => {
    const draft = await createProject(owner, ids('React'));
    const bad = await request(app).patch(`${API}/projects/${draft.id}/status`).set(owner.headers).send({ status: 'completed' });
    expect(bad.status).toBe(422);
    expect(bad.body.error.code).toBe('INVALID_STATE_TRANSITION');

    await request(app).post(`${API}/projects/${draft.id}/publish`).set(owner.headers);
    const start = await request(app).patch(`${API}/projects/${draft.id}/status`).set(owner.headers).send({ status: 'in_progress' });
    expect(start.body.data.status).toBe('in_progress');
    const done = await request(app).patch(`${API}/projects/${draft.id}/status`).set(owner.headers).send({ status: 'completed' });
    expect(done.body.data.status).toBe('completed');
    expect(done.body.data.completedAt).toBeTruthy();
  });

  it('cannot publish twice or unpublish a draft', async () => {
    const project = await createProject(owner, ids('React'), {}, { publish: true });
    expect((await request(app).post(`${API}/projects/${project.id}/publish`).set(owner.headers)).status).toBe(422);
    await request(app).post(`${API}/projects/${project.id}/unpublish`).set(owner.headers);
    expect((await request(app).post(`${API}/projects/${project.id}/unpublish`).set(owner.headers)).status).toBe(422);
  });
});

describe('PATCH /projects/:id', () => {
  it('lets only the owner edit (403 for others on public projects, 404 on drafts)', async () => {
    const draft = await createProject(owner, ids('React'));
    const published = await createProject(owner, ids('React'), { title: 'Another Public Project' }, { publish: true });

    const onDraft = await request(app).patch(`${API}/projects/${draft.id}`).set(other.headers).send({ title: 'Hijacked title' });
    const onPublic = await request(app).patch(`${API}/projects/${published.id}`).set(other.headers).send({ title: 'Hijacked title' });
    const unauthenticated = await request(app).patch(`${API}/projects/${draft.id}`).send({ title: 'Hijacked title' });
    expect(onDraft.status).toBe(404);
    expect(onPublic.status).toBe(403);
    expect(unauthenticated.status).toBe(401);
  });

  it('updates fields and replaces the skill list', async () => {
    const project = await createProject(owner, ids('React'));
    const res = await request(app)
      .patch(`${API}/projects/${project.id}`)
      .set(owner.headers)
      .send({ title: 'Renamed Carpool App', difficulty: 'advanced', requiredSkills: ids('Python', 'MongoDB'), expectedDurationWeeks: 12 });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ title: 'Renamed Carpool App', difficulty: 'advanced', expectedDurationWeeks: 12 });
    expect(res.body.data.requiredSkills.map((s) => s.name).sort()).toEqual(['MongoDB', 'Python']);
  });

  it('keeps role identity when a role is edited, adds new roles, and removes omitted ones', async () => {
    const project = await createProject(owner, ids('React'));
    const [frontend] = project.roles;

    const res = await request(app)
      .patch(`${API}/projects/${project.id}`)
      .set(owner.headers)
      .send({
        roles: [
          { id: frontend.id, title: 'Senior Frontend Developer', description: '', slots: 1 },
          { title: 'Designer', slots: 1 },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.data.roles).toHaveLength(2);
    expect(res.body.data.roles[0]).toMatchObject({ id: frontend.id, title: 'Senior Frontend Developer', slots: 1 });
    expect(res.body.data.roles[1].title).toBe('Designer');
  });

  it("rejects role ids from another project and can't shrink below accepted members", async () => {
    const project = await createProject(owner, ids('React'));
    const foreign = await createProject(other, ids('React'));

    const wrongId = await request(app)
      .patch(`${API}/projects/${project.id}`)
      .set(owner.headers)
      .send({ roles: [{ id: foreign.roles[0].id, title: 'Sneaky', slots: 1 }] });
    expect(wrongId.status).toBe(400);

    const stored = await Project.findById(project.id);
    stored.roles[0].filled = 2; // pretend two people were accepted into this role
    await stored.save();
    const shrink = await request(app)
      .patch(`${API}/projects/${project.id}`)
      .set(owner.headers)
      .send({ roles: [{ id: project.roles[0].id, title: 'Frontend Developer', slots: 1 }, { id: project.roles[1].id, title: 'Backend Developer', slots: 1 }] });
    expect(shrink.status).toBe(422);
    expect(shrink.body.error.code).toBe('ROLE_SLOTS_BELOW_FILLED');

    const remove = await request(app).patch(`${API}/projects/${project.id}`).set(owner.headers).send({ roles: [{ id: project.roles[1].id, title: 'Backend Developer', slots: 1 }] });
    expect(remove.status).toBe(422);
    expect(remove.body.error.code).toBe('ROLE_IN_USE');
  });

  it('enforces team capacity on partial updates and never below current members', async () => {
    const project = await createProject(owner, ids('React')); // 3 role slots, team of 5
    const tooSmall = await request(app).patch(`${API}/projects/${project.id}`).set(owner.headers).send({ teamSize: 3 });
    expect(tooSmall.status).toBe(422);

    await Project.updateOne({ _id: project.id }, { memberCount: 4 });
    const belowMembers = await request(app).patch(`${API}/projects/${project.id}`).set(owner.headers).send({ teamSize: 3, roles: [] });
    expect(belowMembers.status).toBe(422);
    expect(belowMembers.body.error.details[0].field).toBe('teamSize');
  });

  it('will not let a published project lose all its roles', async () => {
    const project = await createProject(owner, ids('React'), {}, { publish: true });
    const res = await request(app).patch(`${API}/projects/${project.id}`).set(owner.headers).send({ roles: [] });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('ROLES_REQUIRED');
  });

  it('rejects empty updates and ignores protected fields', async () => {
    const project = await createProject(owner, ids('React'));
    expect((await request(app).patch(`${API}/projects/${project.id}`).set(owner.headers).send({})).status).toBe(400);
    expect((await request(app).patch(`${API}/projects/${project.id}`).set(owner.headers).send({ status: 'completed', owner: other.user.id })).status).toBe(400);
  });
});

describe('DELETE /projects/:id (archive) and restore', () => {
  it('archives the project: gone from Explore and My Projects, restorable', async () => {
    const project = await createProject(owner, ids('React'), {}, { publish: true });

    const res = await request(app).delete(`${API}/projects/${project.id}`).set(owner.headers);
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('archived');

    expect((await request(app).get(`${API}/projects`)).body.data).toHaveLength(0);
    expect((await request(app).get(`${API}/projects/${project.id}`)).status).toBe(404);
    expect((await request(app).get(`${API}/projects/mine`).set(owner.headers)).body.data).toHaveLength(0);
    const archived = await request(app).get(`${API}/projects/mine`).query({ status: 'archived' }).set(owner.headers);
    expect(archived.body.data).toHaveLength(1);

    const edit = await request(app).patch(`${API}/projects/${project.id}`).set(owner.headers).send({ title: 'Edit while archived' });
    expect(edit.status).toBe(422);

    const restored = await request(app).patch(`${API}/projects/${project.id}/status`).set(owner.headers).send({ status: 'draft' });
    expect(restored.body.data.status).toBe('draft');
  });

  it("only lets the owner delete", async () => {
    const project = await createProject(owner, ids('React'), {}, { publish: true });
    expect((await request(app).delete(`${API}/projects/${project.id}`).set(other.headers)).status).toBe(403);
    expect((await request(app).delete(`${API}/projects/${project.id}`)).status).toBe(401);
  });
});

describe('GET /projects/mine', () => {
  it('lists my projects including drafts, and not other peoples', async () => {
    await createProject(owner, ids('React'), { title: 'My Draft Project' });
    await createProject(owner, ids('React'), { title: 'My Live Project' }, { publish: true });
    await createProject(other, ids('React'), { title: 'Someone Elses Project' }, { publish: true });

    const res = await request(app).get(`${API}/projects/mine`).set(owner.headers);
    expect(res.status).toBe(200);
    expect(res.body.data.map((p) => p.title).sort()).toEqual(['My Draft Project', 'My Live Project']);
    expect(res.body.data[0].description).toBeUndefined();

    const drafts = await request(app).get(`${API}/projects/mine`).query({ status: 'draft' }).set(owner.headers);
    expect(drafts.body.data.map((p) => p.title)).toEqual(['My Draft Project']);
  });

  it('lists joined projects from memberships', async () => {
    const project = await createProject(owner, ids('React'), {}, { publish: true });
    await TeamMembership.create({ project: project.id, user: other.user.id, role: 'member', title: 'Frontend Developer' });
    const joined = await request(app).get(`${API}/projects/mine`).query({ relation: 'joined' }).set(other.headers);
    expect(joined.body.data.map((p) => p.id)).toEqual([project.id]);
    const ownedByOther = await request(app).get(`${API}/projects/mine`).set(other.headers);
    expect(ownedByOther.body.data).toHaveLength(0);
  });

  it('requires authentication', async () => {
    expect((await request(app).get(`${API}/projects/mine`)).status).toBe(401);
  });
});

describe('GET /projects (Explore)', () => {
  beforeEach(async () => {
    const make = (overrides, skillNames, publish = true) => createProject(owner, ids(...skillNames), overrides, { publish });
    await make({ title: 'Recipe Sharing Web App', summary: 'A place for friends to swap and rate home recipes together.', category: 'web', difficulty: 'beginner', expectedDurationWeeks: 4 }, ['React', 'Node.js']);
    await make({ title: 'Plant Disease Detector', summary: 'Mobile app that spots crop diseases from a leaf photo using ML.', category: 'ai_ml', difficulty: 'advanced', expectedDurationWeeks: 16 }, ['Python']);
    await make({ title: 'Study Group Scheduler', summary: 'Find overlapping free time and book rooms for study groups.', category: 'web', difficulty: 'intermediate', expectedDurationWeeks: 8 }, ['React', 'MongoDB']);
    await make({ title: 'Unpublished Idea Board', summary: 'This one stays a draft and must never appear in Explore.' }, ['React'], false);
  });

  const explore = (query = {}) => request(app).get(`${API}/projects`).query(query);
  const titles = (res) => res.body.data.map((p) => p.title);

  it('lists only published projects, newest first, without descriptions', async () => {
    const res = await explore();
    expect(res.status).toBe(200);
    expect(titles(res)).toEqual(['Study Group Scheduler', 'Plant Disease Detector', 'Recipe Sharing Web App']);
    expect(res.body.data[0].description).toBeUndefined();
    expect(res.body.data[0].requiredSkills[0]).toMatchObject({ name: expect.any(String), slug: expect.any(String) });
    expect(res.body.meta).toEqual({ page: 1, limit: 12, total: 3, totalPages: 1 });
  });

  it('searches title, summary and required skill names, ignoring case', async () => {
    expect(titles(await explore({ q: 'RECIPE' }))).toEqual(['Recipe Sharing Web App']);
    expect(titles(await explore({ q: 'leaf photo' }))).toEqual(['Plant Disease Detector']);
    expect(titles(await explore({ q: 'mongo' }))).toEqual(['Study Group Scheduler']); // matched via skill name
    expect(titles(await explore({ q: 'no such thing' }))).toEqual([]);
  });

  it('treats search text literally (no regex injection)', async () => {
    expect(titles(await explore({ q: '.*' }))).toEqual([]);
  });

  it('filters by skill (any / all) and ignores unknown slugs safely', async () => {
    expect(titles(await explore({ skills: 'react' })).sort()).toEqual(['Recipe Sharing Web App', 'Study Group Scheduler']);
    expect(titles(await explore({ skills: 'react,python' })).sort()).toEqual(['Plant Disease Detector', 'Recipe Sharing Web App', 'Study Group Scheduler']);
    expect(titles(await explore({ skills: 'react,mongodb', match: 'all' }))).toEqual(['Study Group Scheduler']);
    expect(titles(await explore({ skills: 'react,does-not-exist', match: 'all' }))).toEqual([]);
    expect(titles(await explore({ skills: 'does-not-exist' }))).toEqual([]);
  });

  it('filters by category and difficulty and combines filters', async () => {
    expect(titles(await explore({ category: 'ai_ml' }))).toEqual(['Plant Disease Detector']);
    expect(titles(await explore({ difficulty: 'beginner' }))).toEqual(['Recipe Sharing Web App']);
    expect(titles(await explore({ category: 'web', difficulty: 'intermediate' }))).toEqual(['Study Group Scheduler']);
    expect(titles(await explore({ category: 'web', skills: 'python' }))).toEqual([]);
  });

  it('sorts by newest, oldest, shortest and longest', async () => {
    expect(titles(await explore({ sort: 'oldest' }))).toEqual(['Recipe Sharing Web App', 'Plant Disease Detector', 'Study Group Scheduler']);
    expect(titles(await explore({ sort: 'shortest' }))).toEqual(['Recipe Sharing Web App', 'Study Group Scheduler', 'Plant Disease Detector']);
    expect(titles(await explore({ sort: 'longest' }))).toEqual(['Plant Disease Detector', 'Study Group Scheduler', 'Recipe Sharing Web App']);
  });

  it('paginates with accurate meta', async () => {
    const first = await explore({ limit: 2 });
    expect(titles(first)).toHaveLength(2);
    expect(first.body.meta).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
    const second = await explore({ limit: 2, page: 2 });
    expect(titles(second)).toEqual(['Recipe Sharing Web App']);
    const beyond = await explore({ limit: 2, page: 9 });
    expect(beyond.body.data).toEqual([]);
  });

  it('filters by lifecycle status', async () => {
    const [live] = (await explore()).body.data;
    await request(app).patch(`${API}/projects/${live.id}/status`).set(owner.headers).send({ status: 'in_progress' });
    expect(titles(await explore())).toHaveLength(2);
    expect(titles(await explore({ status: 'in_progress' }))).toEqual([live.title]);
    expect(titles(await explore({ status: 'all' }))).toHaveLength(3);
  });

  it('rejects invalid or malicious query parameters', async () => {
    expect((await explore({ sort: 'random' })).status).toBe(400);
    expect((await explore({ limit: 500 })).status).toBe(400);
    expect((await explore({ page: 0 })).status).toBe(400);
    expect((await explore({ status: 'draft' })).status).toBe(400); // drafts can never be listed publicly
    expect((await request(app).get(`${API}/projects?q=a&q=b`)).status).toBe(400);
    expect((await request(app).get(`${API}/projects?q[$ne]=x`)).status).toBe(200); // operator syntax is not parsed; stripped
  });
});
