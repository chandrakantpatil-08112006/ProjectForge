import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router';
import FullPageLoader from '../components/ui/FullPageLoader.jsx';
import { selectAuth } from '../features/auth/authSlice.js';

/** Signed-in users only. Waits for the startup session check so a refresh doesn't bounce to /login. */
export default function ProtectedRoute() {
  const { status } = useSelector(selectAuth);
  const location = useLocation();

  if (status === 'checking') return <FullPageLoader />;
  if (status === 'guest') return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
