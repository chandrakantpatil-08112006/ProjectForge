import { ChevronDown } from 'lucide-react';
import { useId } from 'react';
import { cn } from '../../lib/cn.js';
import Field, { controlStyles, describedBy } from './Field.jsx';

export default function Select({ label, hint, error, required, id, className, children, ref, ...props }) {
  const autoId = useId();
  const selectId = id ?? autoId;

  return (
    <Field id={selectId} label={label} hint={hint} error={error} required={required} className={className}>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(selectId, error, hint)}
          className={cn(controlStyles(error), 'h-10 appearance-none pr-9')}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
      </div>
    </Field>
  );
}
