import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import Alert from '../../components/ui/Alert.jsx';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import { loginUser } from '../../features/auth/authSlice.js';
import { loginSchema } from '../../features/auth/schemas.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { applyServerErrors } from '../../lib/formErrors.js';

export default function Login() {
  useDocumentTitle('Log in');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (values) => {
    setFormError(null);
    try {
      await dispatch(loginUser(values)).unwrap();
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname ?? '/dashboard', { replace: true });
    } catch (error) {
      setFormError(applyServerErrors(error, setError));
    }
  };

  return (
    <>
      <h1 className="text-2xl font-semibold">Log in</h1>
      <p className="mt-1 text-sm text-slate-600">Pick up where you left off.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        {formError && <Alert>{formError}</Alert>}
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>Log in</Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        No account yet? <Link to="/register" className="font-medium text-brand-700 underline">Sign up</Link>
      </p>
    </>
  );
}
