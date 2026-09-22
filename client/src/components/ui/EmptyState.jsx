import { cn } from '../../lib/cn.js';

/** An empty screen is an invitation to act: say what's missing and offer the next step. */
export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('mx-auto flex max-w-md flex-col items-center px-4 py-14 text-center', className)}>
      {Icon && (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-white text-brand-600">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      )}
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1.5 text-sm text-slate-600">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
