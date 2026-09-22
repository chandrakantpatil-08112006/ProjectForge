import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router';
import Button, { LinkButton } from '../../../components/ui/Button.jsx';
import { selectAuth } from '../../auth/authSlice.js';

/**
 * Every state of the "apply" call to action, driven by what the API says the viewer may do.
 * The application flow itself ships in the next phase, so eligible visitors see a disabled button
 * with an honest explanation instead of a control that pretends to work.
 */
export default function ApplyButton({ project }) {
  const { status } = useSelector(selectAuth);
  const location = useLocation();
  const { viewer } = project;

  if (status === 'guest') {
    return (
      <div className="space-y-2">
        <LinkButton to="/login" state={{ from: location }} size="lg" className="w-full">Sign in to apply</LinkButton>
        <p className="text-center text-sm text-slate-500">
          New here? <Link to="/register" className="font-medium text-brand-700 underline">Create an account</Link>
        </p>
      </div>
    );
  }

  if (viewer?.isOwner) {
    return <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">This is your project. Use the controls below to manage it.</p>;
  }

  if (viewer?.isMember) {
    return <Button size="lg" className="w-full" disabled>You&apos;re on this team</Button>;
  }

  if (project.status !== 'recruiting') {
    return (
      <div className="space-y-2">
        <Button size="lg" className="w-full" disabled>Not accepting applications</Button>
        <p className="text-center text-sm text-slate-500">This project isn&apos;t recruiting right now.</p>
      </div>
    );
  }

  if (!viewer?.canApply) {
    return (
      <div className="space-y-2">
        <Button size="lg" className="w-full" disabled>All roles are filled</Button>
        <p className="text-center text-sm text-slate-500">Check back later; spots can open up.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button size="lg" className="w-full" disabled>Apply to join</Button>
      <p className="text-center text-sm text-slate-500">
        You&apos;re eligible to apply. Applications open in the next release.
      </p>
    </div>
  );
}
