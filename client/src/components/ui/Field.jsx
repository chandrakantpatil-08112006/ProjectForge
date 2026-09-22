import { cn } from '../../lib/cn.js';

/** Label + control slot + hint/error text. Shared by Input, Textarea, Select and custom controls. */
export default function Field({ id, label, hint, error, required, className, children }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-800">
          {label}
          {required && <span className="ml-0.5 text-rose-600" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-rose-700">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-slate-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export const controlStyles = (error) =>
  cn(
    'block w-full rounded-lg border bg-white px-3 text-sm text-ink placeholder:text-slate-400 transition-colors',
    'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500',
    error ? 'border-rose-400' : 'border-line hover:border-slate-300',
  );

export const describedBy = (id, error, hint) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);
