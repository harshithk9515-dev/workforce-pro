import { getTaskStatusMeta, getProjectStatusMeta, getPriorityMeta, getRoleMeta } from '../../utils/statusStyles';

const METAS = {
  task: getTaskStatusMeta,
  project: getProjectStatusMeta,
  priority: getPriorityMeta,
  role: getRoleMeta,
};

const Badge = ({ kind, value, className = '' }) => {
  const resolver = METAS[kind];
  const meta = resolver ? resolver(value) : { label: value, text: 'text-ink-muted', bg: 'bg-canvas' };
  return (
    <span className={`badge ${meta.bg} ${meta.text} ${className}`}>
      {meta.dot && <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />}
      {meta.label}
    </span>
  );
};

export default Badge;
