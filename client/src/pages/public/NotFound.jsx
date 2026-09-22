import { Compass } from 'lucide-react';
import { LinkButton } from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <EmptyState
      icon={Compass}
      title="We can't find that page"
      description="The link may be broken, or the page may have been removed."
      action={<LinkButton to="/explore">Explore projects</LinkButton>}
    />
  );
}
