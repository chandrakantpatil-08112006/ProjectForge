import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router';
import FullPageLoader from '../components/ui/FullPageLoader.jsx';
import { selectAuth } from '../features/auth/authSlice.js';

/** Login/register: signed-in users are sent to their dashboard instead. */
export default function GuestRoute() {
  const { status } = useSelector(selectAuth);

  if (status === 'checking') return <FullPageLoader />;
  if (status === 'authed') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
