import { CheckCircle2, Circle, FolderKanban, Plus } from 'lucide-react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router';
import PageHeader from '../../components/common/PageHeader.jsx';
import ProjectStatusBadge from '../../components/common/ProjectStatusBadge.jsx';
import SkillBadge from '../../components/common/SkillBadge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import { LinkButton } from '../../components/ui/Button.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import { selectUser } from '../../features/auth/authSlice.js';
import { useMyProjectsQuery } from '../../features/projects/projectsApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { cn } from '../../lib/cn.js';
import { difficultyLabel } from '../../lib/constants.js';

/** Each item is one thing that makes a profile easier for a project owner to trust. */
function profileChecklist(user) {
  return [
    { label: 'Add a short bio', done: Boolean(user.bio) },
    { label: 'Say where you are based', done: Boolean(user.location) },
    { label: 'List at least three skills', done: user.skills.length >= 3 },
    { label: 'Link your GitHub', done: Boolean(user.githubUsername) },
    { label: 'Add your LinkedIn or portfolio', done: Boolean(user.linkedinUrl || user.portfolioUrl) },
    { label: 'Add a profile image', done: Boolean(user.avatarUrl) },
  ];
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 font-display text-3xl font-semibold">{value}</dd>
    </div>
  );
}

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const user = useSelector(selectUser);
  const { data, error, isLoading, refetch } = useMyProjectsQuery({ relation: 'owned', status: 'all', limit: 50 });

  const checklist = profileChecklist(user);
  const done = checklist.filter((item) => item.done).length;
  const projects = data?.items ?? [];
  const live = projects.filter((p) => ['recruiting', 'in_progress'].includes(p.status)).length;
  const drafts = projects.filter((p) => p.status === 'draft').length;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name.split(' ')[0]}`}
        description="Here's where your projects and profile stand."
        actions={
          <>
            <LinkButton to="/explore" variant="secondary">Explore projects</LinkButton>
            <LinkButton to="/projects/new"><Plus className="h-4 w-4" aria-hidden="true" /> New project</LinkButton>
          </>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-8">
          <section aria-labelledby="stats">
            <h2 id="stats" className="sr-only">Project summary</h2>
            {isLoading ? (
              <div className="grid grid-cols-3 gap-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
            ) : error ? (
              <ErrorState error={error} onRetry={refetch} title="Your projects couldn't be loaded" />
            ) : (
              <dl className="grid grid-cols-3 gap-4">
                <Stat label="Your projects" value={data.meta.total} />
                <Stat label="Live" value={live} />
                <Stat label="Drafts" value={drafts} />
              </dl>
            )}
          </section>

          <section aria-labelledby="recent">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 id="recent" className="text-xl font-semibold">Recently updated</h2>
              <Link to="/my-projects" className="text-sm font-medium text-brand-700 underline">All my projects</Link>
            </div>

            {!isLoading && !error && projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line bg-white p-8 text-center">
                <FolderKanban className="mx-auto h-8 w-8 text-brand-600" aria-hidden="true" />
                <p className="mt-3 font-medium">You haven&apos;t created a project yet</p>
                <p className="mt-1 text-sm text-slate-600">Describe your idea, list the roles you need and publish it.</p>
                <LinkButton to="/projects/new" className="mt-4">Create your first project</LinkButton>
              </div>
            ) : (
              !error && (
                <ul className="divide-y divide-line rounded-xl border border-line bg-white">
                  {(isLoading ? [] : projects.slice(0, 5)).map((project) => (
                    <li key={project.id}>
                      <Link to={`/projects/${project.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-slate-50">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{project.title}</p>
                          <p className="text-sm text-slate-500">
                            {difficultyLabel(project.difficulty)} · {project.memberCount}/{project.teamSize} people
                          </p>
                        </div>
                        <ProjectStatusBadge status={project.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section aria-labelledby="profile" className="rounded-xl border border-line bg-white p-4">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} src={user.avatarUrl} size="lg" />
              <div className="min-w-0">
                <h2 id="profile" className="truncate font-semibold">{user.name}</h2>
                <p className="truncate text-sm text-slate-500">@{user.username}</p>
                <p className="text-sm text-slate-500">{difficultyLabel(user.experienceLevel)}</p>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Profile {done === checklist.length ? 'complete' : 'strength'}</span>
                <span className="text-slate-500">{done}/{checklist.length}</span>
              </div>
              <div
                className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
                aria-valuenow={done}
                aria-valuemin={0}
                aria-valuemax={checklist.length}
                aria-label="Profile completeness"
              >
                <div className="h-full rounded-full bg-brand-600" style={{ width: `${(done / checklist.length) * 100}%` }} />
              </div>
              <ul className="mt-3 space-y-1.5">
                {checklist.map((item) => (
                  <li key={item.label} className={cn('flex items-center gap-2 text-sm', item.done ? 'text-slate-400 line-through' : 'text-slate-700')}>
                    {item.done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Circle className="h-4 w-4 text-slate-300" aria-hidden="true" />}
                    {item.label}
                  </li>
                ))}
              </ul>
              <LinkButton to="/profile/edit" variant="secondary" size="sm" className="mt-4 w-full">Edit profile</LinkButton>
            </div>
          </section>

          {user.skills.length > 0 && (
            <section aria-labelledby="my-skills" className="rounded-xl border border-line bg-white p-4">
              <h2 id="my-skills" className="mb-2 text-sm font-semibold">Your skills</h2>
              <ul className="flex flex-wrap gap-1.5">
                {user.skills.map((skill) => <li key={skill.id}><SkillBadge skill={skill} /></li>)}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}
