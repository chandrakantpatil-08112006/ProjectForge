import { X } from 'lucide-react';
import { cn } from '../../lib/cn.js';

/** A skill chip. Pass onRemove to make it removable (used in pickers). */
export default function SkillBadge({ skill, onRemove, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800',
        className,
      )}
    >
      {skill.name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${skill.name}`}
          className="-mr-1 rounded p-0.5 text-brand-700 hover:bg-brand-100"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}
