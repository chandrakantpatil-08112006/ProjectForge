import { useSelector } from 'react-redux';
import { Link } from 'react-router';
import ProjectCard, { ProjectCardSkeleton } from '../../components/common/ProjectCard.jsx';
import { LinkButton } from '../../components/ui/Button.jsx';
import { selectAuth } from '../../features/auth/authSlice.js';
import { useListProjectsQuery } from '../../features/projects/projectsApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

export default function Landing() {
  useDocumentTitle();
  const { status } = useSelector(selectAuth);
  const { data, isLoading, isError } = useListProjectsQuery({ limit: 3 });
  const projects = data?.items ?? [];

  return (
    <div className="space-y-14">
      <section className="bg-blueprint -mx-4 rounded-2xl border border-line px-6 py-14 sm:mx-0 sm:px-12 sm:py-20">
        <h1 className="max-w-2xl text-4xl font-semibold leading-[1.1] sm:text-5xl">
          Build real projects with people who have the skills you&apos;re missing.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-slate-700">
          Post an idea and the roles it needs, or browse projects that match your stack and join a team.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <LinkButton to="/explore" size="lg">Explore projects</LinkButton>
          {status === 'authed' ? (
            <LinkButton to="/projects/new" variant="secondary" size="lg">Post a project</LinkButton>
          ) : (
            <LinkButton to="/register" variant="secondary" size="lg">Create an account</LinkButton>
          )}
        </div>
      </section>

      <section aria-labelledby="recent">
        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h2 id="recent" className="text-2xl font-semibold">Recently posted</h2>
          <Link to="/explore" className="text-sm font-medium text-brand-700 underline">See all projects</Link>
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <ProjectCardSkeleton key={i} />)}</div>
        ) : isError || projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-white p-8 text-center">
            <p className="font-medium">{isError ? "Projects couldn't be loaded right now." : 'No projects are open yet.'}</p>
            {!isError && <p className="mt-1 text-sm text-slate-600">Be the first to post one and start building a team.</p>}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
          </div>
        )}
      </section>
    </div>
  );
}
