import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { cn } from '../../lib/cn.js';

const tones = {
  error: { box: 'border-rose-200 bg-rose-50 text-rose-900', icon: AlertCircle, iconClass: 'text-rose-600' },
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-900', icon: CheckCircle2, iconClass: 'text-emerald-600' },
  info: { box: 'border-brand-200 bg-brand-50 text-brand-900', icon: Info, iconClass: 'text-brand-600' },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-900', icon: TriangleAlert, iconClass: 'text-amber-600' },
};

export default function Alert({ tone = 'error', title, children, className }) {
  const { box, icon: Icon, iconClass } = tones[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-lg border p-3 text-sm', box, className)}>
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconClass)} aria-hidden="true" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : undefined}>{children}</div>}
      </div>
    </div>
  );
}
