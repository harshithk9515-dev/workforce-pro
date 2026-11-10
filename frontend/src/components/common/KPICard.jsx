const RAIL_COLOR = {
  brand: 'border-brand',
  todo: 'border-signal-todo',
  progress: 'border-signal-progress',
  review: 'border-signal-review',
  completed: 'border-signal-completed',
  urgent: 'border-signal-urgent',
};

const KPICard = ({ label, value, icon: Icon, rail = 'brand', sublabel, trend }) => (
  <div className={`card border-l-[3px] ${RAIL_COLOR[rail]} p-4`}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
        <p className="mt-2 font-display text-2xl font-semibold text-ink">{value}</p>
        {sublabel && <p className="mt-1 text-xs text-ink-faint">{sublabel}</p>}
      </div>
      {Icon && (
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-canvas text-ink-muted">
          <Icon size={18} strokeWidth={1.75} />
        </div>
      )}
    </div>
    {trend && <p className="mt-3 text-xs font-medium text-ink-muted">{trend}</p>}
  </div>
);

export default KPICard;
