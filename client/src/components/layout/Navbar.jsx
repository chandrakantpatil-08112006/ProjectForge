import { Menu, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { NavLink } from 'react-router';
import { selectAuth } from '../../features/auth/authSlice.js';
import { cn } from '../../lib/cn.js';
import { LinkButton } from '../ui/Button.jsx';
import Logo from './Logo.jsx';
import UserMenu from './UserMenu.jsx';

const linkStyles = ({ isActive }) =>
  cn(
    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-ink',
  );

export default function Navbar() {
  const { user, status } = useSelector(selectAuth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const authed = status === 'authed';

  const links = [
    { to: '/explore', label: 'Explore' },
    ...(authed
      ? [
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/my-projects', label: 'My projects' },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Logo to={authed ? '/dashboard' : '/'} />

        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkStyles}>{link.label}</NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {status === 'checking' && <span className="h-8 w-24 rounded-full bg-slate-100 motion-safe:animate-pulse" aria-hidden="true" />}

          {authed && (
            <>
              <LinkButton to="/projects/new" size="sm" className="hidden sm:inline-flex">
                <Plus className="h-4 w-4" aria-hidden="true" /> New project
              </LinkButton>
              <UserMenu user={user} />
            </>
          )}

          {status === 'guest' && (
            <>
              <LinkButton to="/login" variant="ghost" size="sm">Log in</LinkButton>
              <LinkButton to="/register" size="sm">Sign up</LinkButton>
            </>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-line bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkStyles} onClick={() => setMobileOpen(false)}>
                {link.label}
              </NavLink>
            ))}
            {authed && (
              <NavLink to="/projects/new" className={linkStyles} onClick={() => setMobileOpen(false)}>
                New project
              </NavLink>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
