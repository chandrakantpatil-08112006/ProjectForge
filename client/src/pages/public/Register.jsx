import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { registerUser } from '../../features/auth/authSlice.js';
import { registerSchema } from '../../features/auth/schemas.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { applyServerErrors } from '../../lib/formErrors.js';

export default function Register() {
  useDocumentTitle('Create account');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(registerSchema), defaultValues: { name: '', username: '', email: '', password: '' } });

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      await dispatch(registerUser(values)).unwrap();
      toast.success('Account created. Welcome to ProjectForge!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(applyServerErrors(error, setError));
    }
  };

  return (
    <>
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-slate-600">Post a project or join one that fits your skills.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        {formError && <Alert>{formError}</Alert>}
        <Input label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <Input
          label="Username"
          autoComplete="username"
          hint="Letters, numbers, hyphens and underscores."
          error={errors.username?.message}
          {...register('username')}
        />
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters."
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Create account</Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already registered? <Link to="/login" className="font-medium text-brand-700 underline">Log in</Link>
      </p>
    </>
  );
}
