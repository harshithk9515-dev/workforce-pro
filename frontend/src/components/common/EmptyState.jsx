const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
    {Icon && (
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-canvas text-ink-faint">
        <Icon size={22} strokeWidth={1.5} />
      </div>
    )}
    <div>
      <p className="font-display font-medium text-ink">{title}</p>
      {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
    </div>
    {action}
  </div>
);

export default EmptyState;
