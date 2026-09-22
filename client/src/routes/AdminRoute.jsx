import { useSelector } from 'react-redux';
import { Outlet } from 'react-router';
import EmptyState from '../components/ui/EmptyState.jsx';
import { selectUser } from '../features/auth/authSlice.js';
import { ShieldAlert } from 'lucide-react';
import { LinkButton } from '../components/ui/Button.jsx';

/** Use inside ProtectedRoute. Non-admins see a clear "no access" screen (the API enforces this too). */
export default function AdminRoute() {
  const user = useSelector(selectUser);

  if (user?.role !== 'admin') {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Admins only"
        description="Your account doesn't have access to this page."
        action={<LinkButton to="/dashboard" variant="secondary">Back to dashboard</LinkButton>}
      />
    );
  }
  return <Outlet />;
}
