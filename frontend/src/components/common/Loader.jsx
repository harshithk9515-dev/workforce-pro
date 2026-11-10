import { Loader2 } from 'lucide-react';

const Loader = ({ label = 'Loading…', full = false }) => (
  <div className={`flex items-center justify-center gap-2 text-ink-muted ${full ? 'py-24' : 'py-10'}`}>
    <Loader2 size={18} className="animate-spin" />
    <span className="text-sm">{label}</span>
  </div>
);

export default Loader;
