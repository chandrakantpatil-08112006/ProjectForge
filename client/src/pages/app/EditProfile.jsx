import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import PageHeader from '../../components/common/PageHeader.jsx';
import SkillPicker from '../../components/common/SkillPicker.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Avatar from '../../components/ui/Avatar.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Select from '../../components/ui/Select.jsx';
import Textarea from '../../components/ui/Textarea.jsx';
import { selectUser, updateProfile } from '../../features/auth/authSlice.js';
import { profileSchema } from '../../features/profile/schemas.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { EXPERIENCE_LEVELS, LIMITS } from '../../lib/constants.js';
import { applyServerErrors } from '../../lib/formErrors.js';

export default function EditProfile() {
  useDocumentTitle('Edit profile');
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const [formError, setFormError] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      bio: user.bio ?? '',
      location: user.location ?? '',
      avatarUrl: user.avatarUrl ?? '',
      experienceLevel: user.experienceLevel,
      githubUsername: user.githubUsername ?? '',
      linkedinUrl: user.linkedinUrl ?? '',
      portfolioUrl: user.portfolioUrl ?? '',
      skills: user.skills,
    },
  });

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      const updated = await dispatch(updateProfile({ ...values, skills: values.skills.map((skill) => skill.id) })).unwrap();
      reset({ ...values, skills: updated.skills });
      toast.success('Profile saved');
    } catch (error) {
      setFormError(applyServerErrors(error, setError));
    }
  };

  return (
    <>
      <PageHeader title="Edit profile" description="This is what project owners see when you apply." />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="max-w-3xl space-y-8">
        {formError && <Alert>{formError}</Alert>}

        <section className="space-y-4 rounded-xl border border-line bg-white p-5 sm:p-6" aria-labelledby="about">
          <h2 id="about" className="text-lg font-semibold">About you</h2>
          <div className="flex items-start gap-4">
            <Avatar name={watch('name')} src={watch('avatarUrl')} size="xl" />
            <Input
              className="flex-1"
              label="Profile image URL"
              type="url"
              placeholder="https://…"
              hint="Paste a link to an image. Uploading arrives in a later update."
              error={errors.avatarUrl?.message}
              {...register('avatarUrl')}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" required error={errors.name?.message} {...register('name')} />
            <Input label="Location" placeholder="City, Country" error={errors.location?.message} {...register('location')} />
          </div>
          <Textarea
            label="Bio"
            rows={4}
            placeholder="What do you like to build? What are you learning?"
            count={watch('bio')?.length}
            max={LIMITS.BIO_MAX}
            error={errors.bio?.message}
            {...register('bio')}
          />
          <Select label="Experience level" error={errors.experienceLevel?.message} {...register('experienceLevel')}>
            {EXPERIENCE_LEVELS.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
          </Select>
        </section>

        <section className="space-y-4 rounded-xl border border-line bg-white p-5 sm:p-6" aria-labelledby="skills">
          <h2 id="skills" className="text-lg font-semibold">Skills</h2>
          <Controller
            control={control}
            name="skills"
            render={({ field }) => (
              <SkillPicker
                label="Your skills"
                value={field.value}
                onChange={field.onChange}
                max={LIMITS.SKILLS_MAX}
                hint="Pick from the list. These are used to match you with projects."
                error={errors.skills?.message}
              />
            )}
          />
        </section>

        <section className="space-y-4 rounded-xl border border-line bg-white p-5 sm:p-6" aria-labelledby="links">
          <h2 id="links" className="text-lg font-semibold">Links</h2>
          <Input
            label="GitHub username"
            placeholder="octocat"
            hint="Just the username. We don't verify it yet."
            error={errors.githubUsername?.message}
            {...register('githubUsername')}
          />
          <Input label="LinkedIn URL" type="url" placeholder="https://www.linkedin.com/in/…" error={errors.linkedinUrl?.message} {...register('linkedinUrl')} />
          <Input label="Portfolio URL" type="url" placeholder="https://…" error={errors.portfolioUrl?.message} {...register('portfolioUrl')} />
        </section>

        <div className="flex justify-end gap-3">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>Save changes</Button>
        </div>
      </form>
    </>
  );
}
