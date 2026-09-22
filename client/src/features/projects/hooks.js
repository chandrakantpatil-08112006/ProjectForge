import { useSelector } from 'react-redux';
import { selectAuth } from '../auth/authSlice.js';
import { useGetProjectQuery } from './projectsApi.js';

/**
 * Loads one project as the current viewer.
 * Waits for the startup session check (otherwise the request goes out without a token and we would
 * cache the guest view of the project) and caches separately per signed-in user.
 */
export function useProject(id) {
  const { status, user } = useSelector(selectAuth);
  const result = useGetProjectQuery({ id, viewer: user?.id ?? 'guest' }, { skip: status === 'checking' });
  return { ...result, isLoading: result.isLoading || result.isUninitialized };
}
