import { SearchX, SlidersHorizontal, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import ProjectCard, { ProjectCardSkeleton } from '../../components/common/ProjectCard.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Select from '../../components/ui/Select.jsx';
import ProjectFilters from '../../features/projects/components/ProjectFilters.jsx';
import { useListProjectsQuery } from '../../features/projects/projectsApi.js';
import { useSearchSkillsQuery } from '../../features/skills/skillsApi.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { SORT_OPTIONS } from '../../lib/constants.js';

const PAGE_SIZE = 12;
const DEFAULTS = { status: 'recruiting', sort: 'newest', match: 'any' };

/** Every filter lives in the URL, so results are shareable, bookmarkable and survive refresh. */
export default function Explore() {
  useDocumentTitle('Explore projects');
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const q = params.get('q') ?? '';
  const values = {
    category: params.get('category') ?? '',
    difficulty: params.get('difficulty') ?? '',
    status: params.get('status') ?? DEFAULTS.status,
    match: params.get('match') ?? DEFAULTS.match,
    sort: params.get('sort') ?? DEFAULTS.sort,
  };
  const page = Math.max(1, Number(params.get('page')) || 1);
  const skillSlugs = (params.get('skills') ?? '').split(',').filter(Boolean);

  /** Merge changes into the URL. Empty/default values are removed; any change but paging resets to page 1. */
  const update = (changes, { replace = false } = {}) => {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        Object.entries(changes).forEach(([key, value]) => {
          const isDefault = value === '' || value == null || DEFAULTS[key] === value;
          if (isDefault) next.delete(key);
          else next.set(key, String(value));
        });
        if (!('page' in changes)) next.delete('page');
        return next;
      },
      { replace },
    );
  };

  // Search box: local state for typing, debounced into the URL.
  const [search, setSearch] = useState(q);
  const debouncedSearch = useDebounce(search, 350);
  useEffect(() => {
    if (debouncedSearch.trim() !== q) update({ q: debouncedSearch.trim() }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Selected skills are stored as slugs in the URL; look their names up (and remember ones just picked).
  const knownSkills = useRef(new Map());
  const { data: lookup } = useSearchSkillsQuery({ slugs: skillSlugs.join(','), limit: 20 }, { skip: skillSlugs.length === 0 });
  lookup?.items.forEach((skill) => knownSkills.current.set(skill.slug, skill));
  const selectedSkills = skillSlugs.map((slug) => knownSkills.current.get(slug)).filter(Boolean);

  const onSkillsChange = (skills) => {
    skills.forEach((skill) => knownSkills.current.set(skill.slug, skill));
    update({ skills: skills.map((skill) => skill.slug).join(',') });
  };

  const { data, error, isLoading, isFetching, refetch } = useListProjectsQuery({
    q,
    skills: skillSlugs.join(','),
    ...values,
    page,
    limit: PAGE_SIZE,
  });

  const projects = data?.items ?? [];
  const meta = data?.meta;

  const activeFilters = [
    values.category,
    values.difficulty,
    values.status !== DEFAULTS.status,
    skillSlugs.length > 0,
    q,
  ].filter(Boolean).length;

  const clearAll = () => {
    setSearch('');
    setParams(new URLSearchParams());
  };

  return (
    <>
      <PageHeader title="Explore projects" description="Find a project that matches what you can build and what you want to learn." />

      <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
        <aside aria-label="Filters" className="lg:sticky lg:top-24 lg:self-start">
          <Button variant="secondary" className="mb-3 w-full lg:hidden" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filters{activeFilters > 0 ? ` (${activeFilters})` : ''}
          </Button>
          <div className={filtersOpen ? 'block' : 'hidden lg:block'}>
            <ProjectFilters
              values={values}
              skills={selectedSkills}
              onChange={(changes) => update(changes)}
              onSkillsChange={onSkillsChange}
              onClear={clearAll}
              activeCount={activeFilters}
            />
          </div>
        </aside>

        <section aria-label="Results" className="min-w-0">
          <div className="mb-5 flex flex-wrap items-end gap-3">
            <div className="relative min-w-56 flex-1">
              <label htmlFor="explore-search" className="sr-only">Search projects</label>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="explore-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title, summary or skill"
                className="h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm placeholder:text-slate-400 hover:border-slate-300"
              />
            </div>
            <Select aria-label="Sort projects" value={values.sort} onChange={(e) => update({ sort: e.target.value })} className="w-48">
              {SORT_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </Select>
          </div>

          {meta && !error && (
            <p className="mb-4 text-sm text-slate-600" aria-live="polite">
              {meta.total === 0 ? 'No projects found' : `${meta.total} ${meta.total === 1 ? 'project' : 'projects'} found`}
            </p>
          )}

          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2">{Array.from({ length: 6 }, (_, i) => <ProjectCardSkeleton key={i} />)}</div>
          ) : error ? (
            <ErrorState error={error} onRetry={refetch} title="Projects couldn't be loaded" />
          ) : projects.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No projects match"
              description={activeFilters > 0 ? 'Try removing a filter or searching for something broader.' : 'Nothing has been posted yet. Be the first!'}
              action={activeFilters > 0 && <Button variant="secondary" onClick={clearAll}>Clear all filters</Button>}
            />
          ) : (
            <div className={isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'} aria-busy={isFetching}>
              <div className="grid gap-5 sm:grid-cols-2">
                {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
              </div>
              <Pagination
                className="mt-8"
                page={meta.page}
                totalPages={meta.totalPages}
                onChange={(next) => {
                  update({ page: next });
                  window.scrollTo({ top: 0 });
                }}
              />
            </div>
          )}
        </section>
      </div>
    </>
  );
}
