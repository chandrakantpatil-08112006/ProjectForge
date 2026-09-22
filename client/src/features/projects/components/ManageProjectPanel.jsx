import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import Button, { LinkButton } from '../../../components/ui/Button.jsx';
import ConfirmDialog from '../../../components/ui/ConfirmDialog.jsx';
import {
  useChangeProjectStatusMutation,
  useDeleteProjectMutation,
  usePublishProjectMutation,
  useUnpublishProjectMutation,
} from '../projectsApi.js';

// What the owner can do next from each status. The server enforces the same rules.
const ACTIONS = {
  draft: [{ key: 'publish', label: 'Publish project', primary: true }],
  recruiting: [
    { key: 'in_progress', label: 'Start project' },
    { key: 'unpublish', label: 'Unpublish (back to draft)' },
  ],
  in_progress: [
    { key: 'completed', label: 'Mark as completed', primary: true },
    { key: 'recruiting', label: 'Reopen recruiting' },
  ],
  completed: [{ key: 'in_progress', label: 'Reopen project' }],
  archived: [{ key: 'draft', label: 'Restore as draft', primary: true }],
};

const SUCCESS = {
  publish: 'Project published',
  unpublish: 'Project moved back to draft',
  in_progress: 'Project is now in progress',
  completed: 'Project marked as completed',
  recruiting: 'Project is recruiting again',
  draft: 'Project restored as a draft',
};

export default function ManageProjectPanel({ project }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [publish] = usePublishProjectMutation();
  const [unpublish] = useUnpublishProjectMutation();
  const [changeStatus] = useChangeProjectStatusMutation();
  const [deleteProject, { isLoading: deleting }] = useDeleteProjectMutation();

  const run = async (key) => {
    setBusy(key);
    try {
      if (key === 'publish') await publish(project.id).unwrap();
      else if (key === 'unpublish') await unpublish(project.id).unwrap();
      else await changeStatus({ id: project.id, status: key }).unwrap();
      toast.success(SUCCESS[key]);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProject(project.id).unwrap();
      toast.success('Project deleted. You can restore it from the Archived filter.');
      navigate('/my-projects', { replace: true });
    } catch (error) {
      toast.error(error.message);
      setConfirmDelete(false);
    }
  };

  return (
    <section aria-labelledby="manage" className="space-y-3 rounded-xl border border-brand-200 bg-brand-50/60 p-4">
      <h2 id="manage" className="text-base font-semibold">Manage project</h2>

      {project.status === 'draft' && (
        <p className="text-sm text-slate-600">This is a draft. Only you can see it until you publish.</p>
      )}

      <div className="flex flex-col gap-2">
        {(ACTIONS[project.status] ?? []).map((action) => (
          <Button
            key={action.key}
            variant={action.primary ? 'primary' : 'secondary'}
            loading={busy === action.key}
            disabled={busy !== null && busy !== action.key}
            onClick={() => run(action.key)}
          >
            {action.label}
          </Button>
        ))}

        {project.status !== 'archived' && (
          <>
            <LinkButton to={`/projects/${project.id}/edit`} variant="secondary">
              <Pencil className="h-4 w-4" aria-hidden="true" /> Edit details
            </LinkButton>
            <Button variant="danger-outline" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete project
            </Button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this project?"
        description="It will disappear from Explore and your project list. You can bring it back later from the Archived filter in My projects."
        confirmLabel="Delete project"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </section>
  );
}
