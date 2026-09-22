import { PROJECT_STATUSES } from '../../lib/constants.js';
import Badge from '../ui/Badge.jsx';

export default function ProjectStatusBadge({ status }) {
  const config = PROJECT_STATUSES[status] ?? { label: status, tone: 'neutral' };
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
