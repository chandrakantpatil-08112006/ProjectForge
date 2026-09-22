# ProjectForge

A developer collaboration platform: post project ideas with the roles and skills they need, or find projects that match your skills.

**Built so far**

| Phase | Scope |
|---|---|
| 1 | Auth (register, login, refresh-token rotation, logout), profiles, protected routes, dashboard |
| 2 | Predefined skills (admin-managed), projects (create/edit/delete/publish), Explore (search, filters, sorting, pagination), project details |

Not built yet: applications, team formation, tasks, chat, GitHub integration, notifications. The **Apply** button on a project page is intentionally disabled until applications ship.

## Stack

React 19 · Vite · Tailwind CSS 4 · React Router · Redux Toolkit (+ RTK Query) · Axios · React Hook Form + Zod
Node 20+ · Express 5 · MongoDB/Mongoose · JWT · bcrypt · Zod

## Getting started

Prerequisites: Node 20.6+, and a MongoDB (Atlas free cluster, or `mongodb://127.0.0.1:27017/projectforge`).

```bash
# 1. API
cd server
npm install
cp .env.example .env        # then edit MONGODB_URI and JWT_ACCESS_SECRET
npm run seed:skills         # adds ~150 predefined skills (safe to re-run)
npm run dev                 # http://localhost:5000

# 2. Web app (second terminal)
cd client
npm install
cp .env.example .env        # defaults work for local development
npm run dev                 # http://localhost:5173
```

**Create an admin** (needed to manage skills): set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env`, then `npm run seed:admin`. If the email already exists that account is promoted. Admins get a "Manage skills" item in the user menu.

**Tests**

```bash
cd server && npm test                      # uses an in-memory MongoDB (downloads mongod on first run)
MONGODB_URI_TEST=mongodb://127.0.0.1:27017/pf_test npm test   # or your own throwaway MongoDB (it gets wiped!)
```

## How it fits together

```
server/src
├── config/        env (Zod-validated at boot), db, cors
├── constants/     enums, limits, project lifecycle rules
├── models/        User, Session, Skill, Project (+ embedded roles), TeamMembership
├── validators/    Zod schemas for body/query/params
├── routes/        wiring only
├── controllers/   thin: read validated input, call a service, send the response
├── services/      business rules (auth, skills, projects)
├── policies/      pure permission functions
├── middleware/    authenticate, optionalAuthenticate, authorize, validate, rate limits, errors
├── seeds/         skill catalogue + admin bootstrap
└── utils/         AppError, response helpers, tokens, slugify, pagination

client/src
├── api/           Axios client (auth header + shared silent refresh), RTK Query root
├── app/           store
├── features/      auth, projects, skills, profile (API endpoints, schemas, feature components)
├── components/    ui/ primitives, layout/, common/ (SkillPicker, ProjectCard…)
├── pages/         public/, app/, admin/
└── routes/        ProtectedRoute, GuestRoute, AdminRoute
```

## API (all under `/api/v1`)

Every response is `{ success: true, data, meta? }` or `{ success: false, error: { code, message, details?, requestId } }`.

**Auth**: `POST /auth/register` · `POST /auth/login` · `POST /auth/refresh` · `POST /auth/logout` · `GET /auth/me` · `PATCH /users/me`

**Skills**: `GET /skills?q&category&slugs&page&limit` (public) · `POST /skills` · `PATCH /skills/:id` · `DELETE /skills/:id` (admin)

**Projects**

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/projects` | public | Explore. `q, skills (csv slugs), match=any\|all, category, difficulty, status, sort=newest\|oldest\|shortest\|longest, page, limit` |
| GET | `/projects/mine` | auth | `relation=owned\|joined, status, page, limit` |
| POST | `/projects` | auth | Create (starts as a draft) |
| GET | `/projects/:id` | public* | Details + owner, skills, roles, members, `viewer` flags. *Drafts/archived: owner only (404 otherwise) |
| PATCH | `/projects/:id` | owner | Edit fields and roles |
| DELETE | `/projects/:id` | owner | "Delete" = archive (soft delete, restorable) |
| POST | `/projects/:id/publish` · `/unpublish` | owner | draft ⇄ recruiting |
| PATCH | `/projects/:id/status` | owner | Other lifecycle moves (`in_progress`, `completed`, restore to `draft`) |

Lifecycle: `draft → recruiting ⇄ in_progress → completed`; anything → `archived`; `archived → draft`.

## Design decisions worth knowing

- **Auth**: 15-minute access JWT held in memory only; opaque 256-bit refresh token in an `httpOnly` cookie, stored hashed, rotated on every use with reuse detection. Logout deletes the session. A failed refresh never clears the cookie (another tab may have just rotated it).
- **Cookies and deployment**: the refresh cookie is `SameSite=Lax`, so the app and API must be same-site in production (custom domains like `app.` / `api.`, or a Vercel rewrite of `/api/*`). In development Vite proxies `/api`, which keeps everything same-origin.
- **Delete is a soft delete**: archived projects vanish from Explore and lists and can be restored. Data other features will hang off (tasks, applications) is therefore never orphaned.
- **Roles are embedded** in the project and edited through the create/edit payload; role ids stay stable across edits so applications can reference them later.
- **Team size includes the owner**, and role spots must fit: `sum(spots) ≤ teamSize − 1`.
- **Search** is a case-insensitive substring match on title/summary plus projects requiring a skill whose name matches. Fine at this scale; a text index / Atlas Search is the upgrade path.
- **Descriptions are plain text** with line breaks preserved (no Markdown yet, so nothing needs sanitizing).
- **Images are URLs** (banner, avatar) until Cloudinary upload lands.
- **`githubUsername` is self-declared**; verified GitHub linking (OAuth) comes with the GitHub phase.
- TTL indexes (sessions) need a real MongoDB/Atlas; they are not supported by some MongoDB look-alikes.
