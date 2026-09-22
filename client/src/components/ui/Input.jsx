import { useId } from 'react';
import { cn } from '../../lib/cn.js';
import Field, { controlStyles, describedBy } from './Field.jsx';

/** Works with react-hook-form's {...register('name')} because `ref` is an ordinary prop in React 19. */
export default function Input({ label, hint, error, required, id, className, ref, ...props }) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <Field id={inputId} label={label} hint={hint} error={error} required={required} className={className}>
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, error, hint)}
        className={cn(controlStyles(error), 'h-10')}
        {...props}
      />
    </Field>
  );
}
