import { Search } from 'lucide-react';
import { useId, useState } from 'react';
import { useSearchSkillsQuery } from '../../features/skills/skillsApi.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { cn } from '../../lib/cn.js';
import { SKILL_CATEGORIES } from '../../lib/constants.js';
import Skeleton from '../ui/Skeleton.jsx';
import SkillBadge from './SkillBadge.jsx';

/**
 * Pick skills from the predefined catalogue.
 *  - `value` is an array of { id, name, slug, category }; `onChange` receives the new array.
 *  - Search is debounced and runs on the server; the category filter narrows it further.
 *  - The results are plain buttons (no popup), so it works with keyboard and screen readers.
 */
export default function SkillPicker({ label = 'Skills', value, onChange, max, error, hint, compact = false }) {
  const id = useId();
  const [text, setText] = useState('');
  const [category, setCategory] = useState('');
  const query = useDebounce(text.trim(), 250);

  const { data, isFetching, isError, refetch } = useSearchSkillsQuery({
    q: query,
    category,
    limit: compact ? 30 : 60,
  });

  const selectedIds = new Set(value.map((skill) => skill.id));
  const options = (data?.items ?? []).filter((skill) => !selectedIds.has(skill.id));
  const atMax = max !== undefined && value.length >= max;

  const add = (skill) => {
    if (atMax) return;
    onChange([...value, { id: skill.id, name: skill.name, slug: skill.slug, category: skill.category }]);
  };
  const remove = (skillId) => onChange(value.filter((skill) => skill.id !== skillId));

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="block text-sm font-medium text-slate-800">{label}</label>
        {max !== undefined && (
          <span className={cn('text-xs', atMax ? 'font-medium text-amber-700' : 'text-slate-500')} aria-live="polite">
            {value.length}/{max} selected
          </span>
        )}
      </div>

      {value.length > 0 && (
        <ul aria-label="Selected skills" className="flex flex-wrap gap-1.5">
          {value.map((skill) => (
            <li key={skill.id}>
              <SkillBadge skill={skill} onRemove={() => remove(skill.id)} />
            </li>
          ))}
        </ul>
      )}

      <div className={cn('rounded-lg border bg-white', error ? 'border-rose-400' : 'border-line')}>
        <div className={cn('flex gap-2 border-b border-line p-2', compact && 'flex-col')}>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id={id}
              type="search"
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault(); // don't submit the surrounding form
                  if (options[0]) add(options[0]);
                }
              }}
              placeholder="Search skills (Enter adds the first match)"
              aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
              className="h-9 w-full rounded-md border border-line bg-white pl-8 pr-2 text-sm placeholder:text-slate-400"
            />
          </div>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter skills by category"
            className="h-9 rounded-md border border-line bg-white px-2 text-sm"
          >
            <option value="">All categories</option>
            {SKILL_CATEGORIES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>

        <div className={cn('overflow-y-auto p-2', compact ? 'max-h-40' : 'max-h-52')} aria-busy={isFetching}>
          {isError ? (
            <p className="p-2 text-sm text-rose-700">
              Couldn&apos;t load skills.{' '}
              <button type="button" onClick={refetch} className="font-medium underline">Try again</button>
            </p>
          ) : !data ? (
            <div className="flex flex-wrap gap-1.5" aria-hidden="true">
              {Array.from({ length: 10 }, (_, index) => <Skeleton key={index} className="h-7 w-16" />)}
            </div>
          ) : options.length === 0 ? (
            <p className="p-2 text-sm text-slate-500">
              {data.items.length > 0 ? 'Everything that matches is already selected.' : 'No skills match your search.'}
            </p>
          ) : (
            <ul className={cn('flex flex-wrap gap-1.5', isFetching && 'opacity-60')}>
              {options.map((skill) => (
                <li key={skill.id}>
                  <button
                    type="button"
                    onClick={() => add(skill)}
                    disabled={atMax}
                    title={SKILL_CATEGORIES.find((item) => item.value === skill.category)?.label}
                    className="rounded-md border border-line bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    + {skill.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {error ? (
        <p id={`${id}-error`} className="text-sm text-rose-700">{error}</p>
      ) : (
        hint && <p id={`${id}-hint`} className="text-sm text-slate-500">{hint}</p>
      )}
    </div>
  );
}
