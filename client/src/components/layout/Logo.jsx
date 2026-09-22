import { Link } from 'react-router';

export function LogoMark({ className = 'h-7 w-7' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#2a3fd6" />
      <path d="M9 9h9a5 5 0 0 1 0 10h-4v4H9z" fill="#fff" />
      <circle cx="14" cy="14" r="1.8" fill="#2a3fd6" />
    </svg>
  );
}

export default function Logo({ to = '/' }) {
  return (
    <Link to={to} className="inline-flex items-center gap-2 rounded-md">
      <LogoMark />
      <span className="font-display text-lg font-semibold tracking-tight">ProjectForge</span>
    </Link>
  );
}
