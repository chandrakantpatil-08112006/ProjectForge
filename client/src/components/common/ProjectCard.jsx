import { Link } from 'react-router';
import { cn } from '../../lib/cn.js';
import { categoryLabel, difficultyLabel } from '../../lib/constants.js';
import { formatDuration } from '../../lib/formatters.js';
import Avatar from '../ui/Avatar.jsx';
import Skeleton from '../ui/Skeleton.jsx';
import { useState } from 'react';
import ProjectStatusBadge from './ProjectStatusBadge.jsx';
import SkillBadge from './SkillBadge.jsx';

const MAX_SKILLS = 4;

/** Project banner, or a drafting-grid placeholder when there is no image (or it fails to load). */
export function ProjectBanner({ project, className }) {
  const [failed, setFailed] = useState(false);

  if (project.bannerUrl && !failed) {
    return (
      <img
        src={project.bannerUrl}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={cn('w-full object-cover', className)}
      />
    );
  }
  return (
    <div className={cn('bg-blueprint flex items-end p-3', className)} aria-hidden="true">
      <span className="rounded bg-white/80 px-1.5 py-0.5 text-xs font-medium text-brand-800">
        {categoryLabel(project.category)}
      </span>
    </div>
  );
}

function Spec({ label, value }) {
  return (
    <div className="min-w-0 border-l border-line pl-3 first:border-l-0 first:pl-0">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="truncate text-sm font-medium">{value}</dd>
    </div>
  );
}

/**
 * The whole card is one link (via the title's ::after overlay); anything passed as `footer`
 * sits above the overlay so its buttons stay clickable.
 */
export default function ProjectCard({ project, showStatus = false, footer }) {
  const openRoles = project.roles?.filter((role) => role.openSlots > 0).length ?? 0;
  const skills = project.requiredSkills ?? [];

  return (
    <article className="relative flex flex-col overflow-hidden rounded-xl border border-line bg-white transition-colors focus-within:border-brand-400 hover:border-brand-300">
      <ProjectBanner project={project} className="h-32" />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
          <span>{categoryLabel(project.category)}</span>
          {showStatus ? (
            <ProjectStatusBadge status={project.status} />
          ) : (
            <span>{openRoles > 0 ? `${openRoles} open ${openRoles === 1 ? 'role' : 'roles'}` : 'No open roles'}</span>
          )}
        </div>

        <h3 className="text-lg font-semibold leading-snug">
          <Link to={`/projects/${project.id}`} className="rounded after:absolute after:inset-0">
            {project.title}
          </Link>
        </h3>

        <p className="line-clamp-2 text-sm text-slate-600">{project.summary}</p>

        {skills.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Required skills">
            {skills.slice(0, MAX_SKILLS).map((skill) => (
              <li key={skill.id}><SkillBadge skill={skill} /></li>
            ))}
            {skills.length > MAX_SKILLS && (
              <li className="self-center text-xs text-slate-500">+{skills.length - MAX_SKILLS} more</li>
            )}
          </ul>
        )}

        <dl className="mt-auto grid grid-cols-3 gap-3 border-t border-line pt-3">
          <Spec label="Level" value={difficultyLabel(project.difficulty)} />
          <Spec label="Duration" value={formatDuration(project.expectedDurationWeeks).replace(/ \(.*\)/, '')} />
          <Spec label="Team" value={`${project.memberCount}/${project.teamSize}`} />
        </dl>

        {project.owner && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Avatar name={project.owner.name} src={project.owner.avatarUrl} size="xs" />
            <span className="truncate">by {project.owner.name}</span>
          </div>
        )}
      </div>

      {footer && <div className="relative z-10 flex flex-wrap gap-2 border-t border-line bg-slate-50 px-4 py-3">{footer}</div>}
    </article>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white" aria-hidden="true">
      <Skeleton className="h-32 rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-1.5"><Skeleton className="h-5 w-14" /><Skeleton className="h-5 w-16" /><Skeleton className="h-5 w-12" /></div>
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
