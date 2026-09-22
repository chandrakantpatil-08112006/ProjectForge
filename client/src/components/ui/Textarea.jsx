import { useId } from 'react';
import Field, { controlStyles, describedBy } from './Field.jsx';
import { cn } from '../../lib/cn.js';

export default function Textarea({ label, hint, error, required, id, count, max, className, rows = 4, ref, ...props }) {
  const autoId = useId();
  const textareaId = id ?? autoId;

  return (
    <Field id={textareaId} label={label} hint={hint} error={error} required={required} className={className}>
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(textareaId, error, hint)}
        className={cn(controlStyles(error), 'resize-y py-2 leading-relaxed')}
        {...props}
      />
      {max !== undefined && (
        <p className={cn('text-right text-xs', count > max ? 'text-rose-700' : 'text-slate-500')} aria-live="polite">
          {count ?? 0}/{max}
        </p>
      )}
    </Field>
  );
}
