import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import Alert from '../../../components/ui/Alert.jsx';
import Button from '../../../components/ui/Button.jsx';
import Input from '../../../components/ui/Input.jsx';
import Select from '../../../components/ui/Select.jsx';
import Textarea from '../../../components/ui/Textarea.jsx';
import SkillPicker from '../../../components/common/SkillPicker.jsx';
import { DIFFICULTIES, LIMITS, PROJECT_CATEGORIES } from '../../../lib/constants.js';
import { applyServerErrors } from '../../../lib/formErrors.js';
import { emptyProjectValues, formValuesToPayload, projectSchema } from '../schemas.js';
import RolesEditor from './RolesEditor.jsx';

/**
 * Shared by "Create project" and "Edit project".
 * `onSave(payload, { publish })` must return a promise and throw the normalised API error on failure;
 * field errors from the server are mapped back onto the matching inputs.
 */
export default function ProjectForm({ defaultValues = emptyProjectValues, mode, onSave }) {
  const [formError, setFormError] = useState(null);
  const {
    register,
    control,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(projectSchema), defaultValues });

  const submit = (publish) =>
    handleSubmit(async (values) => {
      setFormError(null);
      if (publish && values.roles.length === 0) {
        setError('roles', { type: 'manual', message: 'Add at least one role before publishing.' });
        return;
      }
      try {
        await onSave(formValuesToPayload(values), { publish });
      } catch (error) {
        setFormError(applyServerErrors(error, setError));
      }
    });

  const rolesError = errors.roles?.message ?? errors.roles?.root?.message;

  return (
    <form onSubmit={submit(false)} noValidate className="space-y-8">
      {formError && <Alert>{formError}</Alert>}

      <section className="space-y-4 rounded-xl border border-line bg-white p-5 sm:p-6" aria-labelledby="basics">
        <h2 id="basics" className="text-lg font-semibold">The idea</h2>
        <Input label="Title" required placeholder="e.g. Campus carpool finder" error={errors.title?.message} {...register('title')} />
        <Textarea
          label="Short summary"
          required
          rows={2}
          hint="One or two sentences shown on project cards."
          count={watch('summary')?.length}
          max={LIMITS.PROJECT_SUMMARY_MAX}
          error={errors.summary?.message}
          {...register('summary')}
        />
        <Textarea
          label="Description"
          required
          rows={8}
          hint="What are you building, why, and what would a teammate do? Line breaks are kept."
          count={watch('description')?.length}
          max={LIMITS.PROJECT_DESCRIPTION_MAX}
          error={errors.description?.message}
          {...register('description')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Category" required error={errors.category?.message} {...register('category')}>
            <option value="">Choose a category</option>
            {PROJECT_CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </Select>
          <Select label="Difficulty" required error={errors.difficulty?.message} {...register('difficulty')}>
            <option value="">Choose a difficulty</option>
            {DIFFICULTIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </Select>
        </div>
        <Input
          label="Banner image URL"
          type="url"
          placeholder="https://…"
          hint="Optional. Image upload arrives in a later update, so paste a link for now."
          error={errors.bannerUrl?.message}
          {...register('bannerUrl')}
        />
      </section>

      <section className="space-y-4 rounded-xl border border-line bg-white p-5 sm:p-6" aria-labelledby="scope">
        <h2 id="scope" className="text-lg font-semibold">Scope and team</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Expected duration (weeks)"
            type="number"
            min={1}
            max={LIMITS.DURATION_WEEKS_MAX}
            required
            error={errors.expectedDurationWeeks?.message}
            {...register('expectedDurationWeeks', { valueAsNumber: true })}
          />
          <Input
            label="Team size"
            type="number"
            min={LIMITS.TEAM_SIZE_MIN}
            max={LIMITS.TEAM_SIZE_MAX}
            required
            hint="Total people including you."
            error={errors.teamSize?.message}
            {...register('teamSize', { valueAsNumber: true })}
          />
        </div>

        <Controller
          control={control}
          name="requiredSkills"
          render={({ field }) => (
            <SkillPicker
              label="Required skills"
              value={field.value}
              onChange={field.onChange}
              max={LIMITS.PROJECT_SKILLS_MAX}
              hint="The technologies and abilities the project needs."
              error={errors.requiredSkills?.message}
            />
          )}
        />

        <RolesEditor control={control} register={register} errors={errors} error={rolesError} />
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {mode === 'create' ? (
          <>
            <Button variant="secondary" type="submit" loading={isSubmitting}>Save as draft</Button>
            <Button onClick={submit(true)} loading={isSubmitting}>Publish project</Button>
          </>
        ) : (
          <Button type="submit" loading={isSubmitting}>Save changes</Button>
        )}
      </div>
    </form>
  );
}
