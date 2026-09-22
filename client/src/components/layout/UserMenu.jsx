import { LogOut, Settings2, UserRound, Tags } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { logoutUser } from '../../features/auth/authSlice.js';
import Avatar from '../ui/Avatar.jsx';

const itemStyles = 'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100';

export default function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await dispatch(logoutUser());
    toast.success('Signed out');
    navigate('/', { replace: true });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full p-0.5 pr-2 hover:bg-slate-100"
      >
        <Avatar name={user.name} src={user.avatarUrl} size="sm" />
        <span className="hidden max-w-32 truncate text-sm font-medium sm:block">{user.name}</span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-line bg-white p-1.5">
          <div className="border-b border-line px-3 pb-2 pt-1.5">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-slate-500">@{user.username} · {user.email}</p>
          </div>
          <div className="pt-1.5">
            <Link role="menuitem" to="/profile/edit" onClick={() => setOpen(false)} className={itemStyles}>
              <UserRound className="h-4 w-4" aria-hidden="true" /> Edit profile
            </Link>
            {user.role === 'admin' && (
              <Link role="menuitem" to="/admin/skills" onClick={() => setOpen(false)} className={itemStyles}>
                <Tags className="h-4 w-4" aria-hidden="true" /> Manage skills
              </Link>
            )}
            <button role="menuitem" type="button" onClick={handleLogout} className={itemStyles}>
              <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
