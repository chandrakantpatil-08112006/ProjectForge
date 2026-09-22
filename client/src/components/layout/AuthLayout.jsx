import { Outlet } from 'react-router';
import Logo from './Logo.jsx';

/** Centered card on the drafting-grid background for login and register. */
export default function AuthLayout() {
  return (
    <div className="bg-blueprint flex min-h-screen flex-col items-center px-4 py-10">
      <Logo />
      <main id="main" className="mt-8 w-full max-w-md rounded-2xl border border-line bg-white p-6 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
