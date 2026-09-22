import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader.jsx';
import Badge from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import Input from '../../components/ui/Input.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import Select from '../../components/ui/Select.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import {
  useCreateSkillMutation,
  useDeleteSkillMutation,
  useSearchSkillsQuery,
  useUpdateSkillMutation,
} from '../../features/skills/skillsApi.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { LIMITS, SKILL_CATEGORIES, skillCategoryLabel } from '../../lib/constants.js';

function CategorySelect(props) {
  return (
    <Select {...props}>
      {props.children}
      {SKILL_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
    </Select>
  );
}

function AddSkillForm() {
  const [createSkill, { isLoading }] = useCreateSkillMutation();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('other');
  const [error, setError] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      const skill = await createSkill({ name: name.trim(), category }).unwrap();
      toast.success(`Added ${skill.name}`);
      setName('');
    } catch (err) {
      setError(err.details?.[0]?.message ?? err.message);
    }
  };

  return (
    <form onSubmit={submit} className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4">
      <Input className="min-w-48 flex-1" label="New skill" value={name} onChange={(e) => setName(e.target.value)} maxLength={LIMITS.SKILL_NAME_MAX} error={error} required />
      <CategorySelect label="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-48" />
      <Button type="submit" loading={isLoading} disabled={!name.trim()}>
        <Plus className="h-4 w-4" aria-hidden="true" /> Add skill
      </Button>
    </form>
  );
}

function SkillRow({ skill, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(skill.name);
  const [category, setCategory] = useState(skill.category);
  const [error, setError] = useState(null);
  const [updateSkill, { isLoading }] = useUpdateSkillMutation();

  const save = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      await updateSkill({ id: skill.id, name: name.trim(), category }).unwrap();
      toast.success('Skill updated');
      setEditing(false);
    } catch (err) {
      setError(err.details?.[0]?.message ?? err.message);
    }
  };

  if (editing) {
    return (
      <li className="p-3">
        <form onSubmit={save} className="flex flex-wrap items-end gap-3">
          <Input className="min-w-48 flex-1" label="Name" value={name} onChange={(e) => setName(e.target.value)} maxLength={LIMITS.SKILL_NAME_MAX} error={error} />
          <CategorySelect label="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-44" />
          <Button type="submit" size="sm" loading={isLoading}>Save</Button>
          <Button size="sm" variant="secondary" onClick={() => { setEditing(false); setName(skill.name); setCategory(skill.category); setError(null); }}>Cancel</Button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 p-3">
      <div className="min-w-0">
        <span className="font-medium">{skill.name}</span>
        <span className="ml-2 text-xs text-slate-400">{skill.slug}</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge>{skillCategoryLabel(skill.category)}</Badge>
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)} aria-label={`Edit ${skill.name}`}><Pencil className="h-4 w-4" aria-hidden="true" /></Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(skill)} aria-label={`Delete ${skill.name}`}><Trash2 className="h-4 w-4 text-rose-600" aria-hidden="true" /></Button>
      </div>
    </li>
  );
}

export default function AdminSkills() {
  useDocumentTitle('Manage skills');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState(null);
  const q = useDebounce(search.trim(), 300);

  const { data, error, isLoading, refetch } = useSearchSkillsQuery({ q, category, page, limit: 50 });
  const [deleteSkill, { isLoading: deleting }] = useDeleteSkillMutation();

  const confirmDelete = async () => {
    try {
      await deleteSkill(toDelete.id).unwrap();
      toast.success(`Deleted ${toDelete.name}`);
    } catch (err) {
      toast.error(err.message); // e.g. "used by 3 projects, so it can't be deleted"
    } finally {
      setToDelete(null);
    }
  };

  return (
    <>
      <PageHeader title="Manage skills" description="The predefined list people choose from on profiles and projects." />
      <AddSkillForm />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Input className="min-w-48 flex-1" label="Search" type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Filter by name" />
        <Select label="Category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="w-48">
          <option value="">All categories</option>
          {SKILL_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : data.items.length === 0 ? (
        <EmptyState title="No skills found" description="Try a different search, or add the skill above." />
      ) : (
        <>
          <p className="mb-2 text-sm text-slate-600">{data.meta.total} skills</p>
          <ul className="divide-y divide-line rounded-xl border border-line bg-white">
            {data.items.map((skill) => <SkillRow key={skill.id} skill={skill} onDelete={setToDelete} />)}
          </ul>
          <Pagination className="mt-6" page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete "${toDelete?.name}"?`}
        description="Skills that projects or profiles use can't be deleted; rename them instead."
        confirmLabel="Delete skill"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </>
  );
}
