import { FolderPlus, FolderSearch } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader.jsx';
import ProjectCard, { ProjectCardSkeleton } from '../../components/common/ProjectCard.jsx';
import Button, { LinkButton } from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Select from '../../components/ui/Select.jsx';
import {
  useChangeProjectStatusMutation,
  useMyProjectsQuery,
  usePublishProjectMutation,
} from '../../features/projects/projectsApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { cn } from '../../lib/cn.js';

const RELATIONS = [
  { value: 'owned', label: 'Created by me' },
  { value: 'joined', label: "I've joined" },
];

const STATUS_FILTERS = [
  { value: 'all', label: 'All (not archived)' },
  { value: 'draft', label: 'Drafts' },
  { value: 'recruiting', label: 'Recruiting' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

function OwnerActions({ project }) {
  const [publish, { isLoading: publishing }] = usePublishProjectMutation();
  const [changeStatus, { isLoading: restoring }] = useChangeProjectStatusMutation();

  const run = async (action, message) => {
    try {
      await action.unwrap();
      toast.success(message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <>
      {project.status !== 'archived' && (
        <LinkButton to={`/projects/${project.id}/edit`} variant="secondary" size="sm">Edit</LinkButton>
      )}
      {project.status === 'draft' && (
        <Button size="sm" loading={publishing} onClick={() => run(publish(project.id), 'Project published')}>Publish</Button>
      )}
      {project.status === 'archived' && (
        <Button size="sm" variant="secondary" loading={restoring} onClick={() => run(changeStatus({ id: project.id, status: 'draft' }), 'Project restored as a draft')}>
          Restore
        </Button>
      )}
    </>
  );
}

export default function MyProjects() {
  useDocumentTitle('My projects');
  const [relation, setRelation] = useState('owned');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const { data, error, isLoading, isFetching, refetch } = useMyProjectsQuery({ relation, status, page, limit: 12 });

  const projects = data?.items ?? [];

  return (
    <>
      <PageHeader
        title="My projects"
        description="Projects you created or joined."
        actions={<LinkButton to="/projects/new">New project</LinkButton>}
      />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div role="tablist" aria-label="Show projects" className="inline-flex rounded-lg border border-line bg-white p-1">
          {RELATIONS.map((item) => (
            <button
              key={item.value}
              role="tab"
              type="button"
              aria-selected={relation === item.value}
              onClick={() => { setRelation(item.value); setPage(1); }}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                relation === item.value ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-52">
          {STATUS_FILTERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <ProjectCardSkeleton key={i} />)}</div>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} title="Your projects couldn't be loaded" />
      ) : projects.length === 0 ? (
        relation === 'owned' ? (
          <EmptyState
            icon={FolderPlus}
            title={status === 'all' ? "You haven't created a project yet" : 'No projects with this status'}
            description={status === 'all' ? 'Describe your idea, list the roles you need and publish it.' : 'Try another status filter.'}
            action={status === 'all' && <LinkButton to="/projects/new">Create a project</LinkButton>}
          />
        ) : (
          <EmptyState
            icon={FolderSearch}
            title="You haven't joined a project yet"
            description="When an owner accepts you onto a team, the project shows up here."
            action={<LinkButton to="/explore">Explore projects</LinkButton>}
          />
        )
      ) : (
        <div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                showStatus
                footer={relation === 'owned' ? <OwnerActions project={project} /> : undefined}
              />
            ))}
          </div>
          <Pagination className="mt-8" page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
        </div>
      )}
    </>
  );
}
