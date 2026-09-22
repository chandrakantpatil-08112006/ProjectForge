import toast from 'react-hot-toast';
import { useNavigate } from 'react-router';
import PageHeader from '../../components/common/PageHeader.jsx';
import ProjectForm from '../../features/projects/components/ProjectForm.jsx';
import { useCreateProjectMutation, usePublishProjectMutation } from '../../features/projects/projectsApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

export default function CreateProject() {
  useDocumentTitle('New project');
  const navigate = useNavigate();
  const [createProject] = useCreateProjectMutation();
  const [publishProject] = usePublishProjectMutation();

  const onSave = async (payload, { publish }) => {
    const project = await createProject(payload).unwrap(); // throws the normalised error for the form to display

    if (publish) {
      try {
        await publishProject(project.id).unwrap();
        toast.success('Project published');
      } catch (error) {
        // The project exists, it just isn't public yet; the details page lets the owner retry.
        toast.error(`Saved as a draft, but it couldn't be published: ${error.message}`);
      }
    } else {
      toast.success('Draft saved');
    }
    navigate(`/projects/${project.id}`, { replace: true });
  };

  return (
    <>
      <PageHeader title="Create a project" description="Describe what you're building and who you need. You can save a draft and publish later." />
      <div className="max-w-3xl">
        <ProjectForm mode="create" onSave={onSave} />
      </div>
    </>
  );
}
