import { cn } from '../../lib/cn.js';

export default function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn('rounded-md bg-slate-200/70 motion-safe:animate-pulse', className)} />;
}
