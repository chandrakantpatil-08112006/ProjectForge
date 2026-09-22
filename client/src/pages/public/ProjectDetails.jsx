import { CalendarDays, Clock, Gauge, LayoutGrid, Users } from 'lucide-react';
import { useParams } from 'react-router';
import { ProjectBanner } from '../../components/common/ProjectCard.jsx';
import ProjectStatusBadge from '../../components/common/ProjectStatusBadge.jsx';
import SkillBadge from '../../components/common/SkillBadge.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { LinkButton } from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import ApplyButton from '../../features/projects/components/ApplyButton.jsx';
import ManageProjectPanel from '../../features/projects/components/ManageProjectPanel.jsx';
import { useProject } from '../../features/projects/hooks.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { categoryLabel, difficultyLabel } from '../../lib/constants.js';
import { formatDate, formatDuration, pluralize } from '../../lib/formatters.js';
import { SearchX } from 'lucide-react';

function Spec({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
      <div>
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="text-sm font-medium">{children}</dd>
      </div>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-9 w-2/3" />
      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}

export default function ProjectDetails() {
  const { id } = useParams();
  const { data: project, error, isLoading, refetch } = useProject(id);
  useDocumentTitle(project?.title ?? 'Project');

  if (isLoading) return <DetailsSkeleton />;

  if (error?.status === 404 || error?.status === 400) {
    return (
      <EmptyState
        icon={SearchX}
        title="Project not found"
        description="It may have been unpublished or removed, or the link is wrong."
        action={<LinkButton to="/explore">Browse projects</LinkButton>}
      />
    );
  }
  if (error) return <ErrorState error={error} onRetry={refetch} title="This project couldn't be loaded" />;

  const { viewer, owner, members, roles } = project;
  const openSpots = roles.reduce((sum, role) => sum + role.openSlots, 0);

  return (
    <article className="space-y-8">
      <div className="overflow-hidden rounded-xl border border-line">
        <ProjectBanner project={project} className="h-44 sm:h-60" />
      </div>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <ProjectStatusBadge status={project.status} />
          <Badge>{categoryLabel(project.category)}</Badge>
        </div>
        <h1 className="text-3xl font-semibold sm:text-4xl">{project.title}</h1>
        <p className="max-w-3xl text-lg text-slate-600">{project.summary}</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-10">
          <section aria-labelledby="about">
            <h2 id="about" className="mb-3 text-xl font-semibold">About this project</h2>
            <p className="max-w-3xl whitespace-pre-wrap break-words leading-relaxed text-slate-800">{project.description}</p>
          </section>

          <section aria-labelledby="skills">
            <h2 id="skills" className="mb-3 text-xl font-semibold">Required skills</h2>
            <ul className="flex flex-wrap gap-2">
              {project.requiredSkills.map((skill) => (
                <li key={skill.id}><SkillBadge skill={skill} className="px-2.5 py-1 text-sm" /></li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="roles">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 id="roles" className="text-xl font-semibold">Roles</h2>
              <span className="text-sm text-slate-500">{roles.length === 0 ? 'No roles yet' : `${pluralize(openSpots, 'open spot')}`}</span>
            </div>
            {roles.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line bg-white p-4 text-sm text-slate-500">
                The owner hasn&apos;t added any roles yet.
              </p>
            ) : (
              <ul className="divide-y divide-line rounded-xl border border-line bg-white">
                {roles.map((role) => (
                  <li key={role.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold">{role.title}</h3>
                      {role.description && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{role.description}</p>}
                    </div>
                    <Badge tone={role.openSlots > 0 ? 'success' : 'neutral'}>
                      {role.openSlots > 0 ? `${role.openSlots} of ${role.slots} open` : 'Filled'}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <div className="rounded-xl border border-line bg-white p-4">
            <ApplyButton project={project} />
          </div>

          {viewer.isOwner && <ManageProjectPanel project={project} />}

          <dl className="space-y-4 rounded-xl border border-line bg-white p-4">
            <Spec icon={Gauge} label="Difficulty">{difficultyLabel(project.difficulty)}</Spec>
            <Spec icon={Clock} label="Expected duration">{formatDuration(project.expectedDurationWeeks)}</Spec>
            <Spec icon={Users} label="Team size">{project.memberCount} of {project.teamSize} people</Spec>
            <Spec icon={LayoutGrid} label="Category">{categoryLabel(project.category)}</Spec>
            {project.publishedAt && <Spec icon={CalendarDays} label="Published">{formatDate(project.publishedAt)}</Spec>}
          </dl>

          <section aria-labelledby="owner" className="rounded-xl border border-line bg-white p-4">
            <h2 id="owner" className="mb-3 text-sm font-semibold">Project owner</h2>
            <div className="flex items-center gap-3">
              <Avatar name={owner.name} src={owner.avatarUrl} />
              <div className="min-w-0">
                <p className="truncate font-medium">{owner.name}</p>
                <p className="truncate text-sm text-slate-500">@{owner.username}</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="team" className="rounded-xl border border-line bg-white p-4">
            <h2 id="team" className="mb-3 text-sm font-semibold">Current team ({members.length})</h2>
            <ul className="space-y-3">
              {members.map((member) => (
                <li key={member.id} className="flex items-center gap-3">
                  <Avatar name={member.name} src={member.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{member.name}</p>
                    <p className="truncate text-xs text-slate-500">{member.title || (member.role === 'owner' ? 'Project Lead' : 'Member')}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </article>
  );
}
