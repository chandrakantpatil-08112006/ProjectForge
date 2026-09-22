import { CircleAlert } from 'lucide-react';
import Button from './Button.jsx';
import EmptyState from './EmptyState.jsx';

/** `error` is the normalised { message, status } object from the API layer. */
export default function ErrorState({ error, onRetry, title = "We couldn't load this" }) {
  return (
    <EmptyState
      icon={CircleAlert}
      title={title}
      description={error?.message ?? 'Something went wrong. Please try again.'}
      action={onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
    />
  );
}
