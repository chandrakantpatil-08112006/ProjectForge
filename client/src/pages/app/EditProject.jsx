import { SearchX } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router';
import PageHeader from '../../components/common/PageHeader.jsx';
import Alert from '../../components/ui/Alert.jsx';
import { LinkButton } from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import ErrorState from '../../components/ui/ErrorState.jsx';
import FullPageLoader from '../../components/ui/FullPageLoader.jsx';
import ProjectForm from '../../features/projects/components/ProjectForm.jsx';
import { useProject } from '../../features/projects/hooks.js';
import { useUpdateProjectMutation } from '../../features/projects/projectsApi.js';
import { projectToFormValues } from '../../features/projects/schemas.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, error, isLoading, refetch } = useProject(id);
  const [updateProject] = useUpdateProjectMutation();
  useDocumentTitle(project ? `Edit ${project.title}` : 'Edit project');

  if (isLoading) return <FullPageLoader />;
  if (error?.status === 404 || error?.status === 400) {
    return <EmptyState icon={SearchX} title="Project not found" action={<LinkButton to="/my-projects">My projects</LinkButton>} />;
  }
  if (error) return <ErrorState error={error} onRetry={refetch} />;

  if (!project.viewer.isOwner) {
    return (
      <EmptyState
        title="Only the owner can edit this project"
        action={<LinkButton to={`/projects/${id}`} variant="secondary">View project</LinkButton>}
      />
    );
  }

  const onSave = async (payload) => {
    await updateProject({ id, ...payload }).unwrap();
    toast.success('Changes saved');
    navigate(`/projects/${id}`);
  };

  return (
    <>
      <PageHeader title="Edit project" description={project.status === 'draft' ? 'This project is still a draft.' : undefined} />
      <div className="max-w-3xl space-y-4">
        {project.status === 'archived' ? (
          <Alert tone="warning" title="This project is archived">
            Restore it from the project page before editing.
          </Alert>
        ) : (
          <ProjectForm mode="edit" defaultValues={projectToFormValues(project)} onSave={onSave} />
        )}
      </div>
    </>
  );
}
