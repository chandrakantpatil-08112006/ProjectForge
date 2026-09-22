import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useWatch } from 'react-hook-form';
import Button from '../../../components/ui/Button.jsx';
import Input from '../../../components/ui/Input.jsx';
import Textarea from '../../../components/ui/Textarea.jsx';
import { LIMITS } from '../../../lib/constants.js';
import { pluralize } from '../../../lib/formatters.js';

/** The list of roles the owner wants to fill (react-hook-form field array). */
export default function RolesEditor({ control, register, errors, error }) {
  const { fields, append, remove } = useFieldArray({ control, name: 'roles' });
  const roles = useWatch({ control, name: 'roles' }) ?? [];
  const teamSize = useWatch({ control, name: 'teamSize' });

  const totalSlots = roles.reduce((sum, role) => sum + (Number.isFinite(role?.slots) ? role.slots : 0), 0);
  const room = Number.isFinite(teamSize) ? teamSize - 1 : null;

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium text-slate-800">Roles you need</legend>
      <p className="text-sm text-slate-500">
        Each role is a position someone can apply for.
        {room !== null && (
          <>
            {' '}You&apos;ve planned <strong className={totalSlots > room ? 'text-rose-700' : 'text-ink'}>{pluralize(totalSlots, 'spot')}</strong>{' '}
            and your team size leaves room for {room}.
          </>
        )}
      </p>

      {fields.length === 0 && (
        <p className="rounded-lg border border-dashed border-line bg-white p-4 text-sm text-slate-500">
          No roles yet. You can save a draft without roles, but you need at least one to publish.
        </p>
      )}

      <ul className="space-y-3">
        {fields.map((field, index) => {
          const roleErrors = errors?.roles?.[index];
          return (
            <li key={field.id} className="space-y-3 rounded-lg border border-line bg-white p-4">
              {/* Existing roles keep their id so their identity survives edits. */}
              <input type="hidden" {...register(`roles.${index}.id`)} />
              <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
                <Input
                  label="Role title"
                  placeholder="e.g. Frontend developer"
                  error={roleErrors?.title?.message}
                  {...register(`roles.${index}.title`)}
                />
                <Input
                  label="Spots"
                  type="number"
                  min={1}
                  max={LIMITS.ROLE_SLOTS_MAX}
                  error={roleErrors?.slots?.message}
                  {...register(`roles.${index}.slots`, { valueAsNumber: true })}
                />
              </div>
              <Textarea
                label="What will they do?"
                rows={2}
                placeholder="Optional: tasks, tools, expectations"
                error={roleErrors?.description?.message}
                {...register(`roles.${index}.description`)}
              />
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => remove(index)} aria-label={`Remove role ${index + 1}`}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" /> Remove
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {error && <p className="text-sm text-rose-700" role="alert">{error}</p>}

      <Button
        variant="secondary"
        size="sm"
        onClick={() => append({ title: '', description: '', slots: 1 })}
        disabled={fields.length >= LIMITS.ROLES_MAX}
      >
        <Plus className="h-4 w-4" aria-hidden="true" /> Add a role
      </Button>
    </fieldset>
  );
}
