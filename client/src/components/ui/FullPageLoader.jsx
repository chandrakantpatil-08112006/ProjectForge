import Spinner from './Spinner.jsx';

export default function FullPageLoader({ label = 'Loading' }) {
  return (
    <div role="status" className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-500">
      <Spinner className="h-6 w-6 text-brand-600" />
      <span className="text-sm">{label}…</span>
    </div>
  );
}
