// Central source of truth for how task/project statuses and priorities are
// labeled and colored across the app. Keeping this in one place is what makes
// the "signal rail" consistent everywhere it appears (KPI cards, table rows,
// project cards, notifications).

export const TASK_STATUS_META = {
  todo: { label: 'To Do', rail: 'signal-rail--todo', dot: 'bg-signal-todo', text: 'text-slate-600', bg: 'bg-slate-100' },
  'in-progress': {
    label: 'In Progress',
    rail: 'signal-rail--in-progress',
    dot: 'bg-signal-progress',
    text: 'text-blue-700',
    bg: 'bg-blue-50',
  },
  review: {
    label: 'In Review',
    rail: 'signal-rail--review',
    dot: 'bg-signal-review',
    text: 'text-amber-700',
    bg: 'bg-amber-50',
  },
  completed: {
    label: 'Completed',
    rail: 'signal-rail--completed',
    dot: 'bg-signal-completed',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
};

export const PROJECT_STATUS_META = {
  planning: { label: 'Planning', text: 'text-slate-600', bg: 'bg-slate-100' },
  'in-progress': { label: 'In Progress', text: 'text-blue-700', bg: 'bg-blue-50' },
  'on-hold': { label: 'On Hold', text: 'text-amber-700', bg: 'bg-amber-50' },
  completed: { label: 'Completed', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  cancelled: { label: 'Cancelled', text: 'text-red-700', bg: 'bg-red-50' },
};

export const PRIORITY_META = {
  low: { label: 'Low', text: 'text-slate-600', bg: 'bg-slate-100' },
  medium: { label: 'Medium', text: 'text-blue-700', bg: 'bg-blue-50' },
  high: { label: 'High', text: 'text-amber-700', bg: 'bg-amber-50' },
  urgent: { label: 'Urgent', text: 'text-red-700', bg: 'bg-red-50' },
};

export const ROLE_META = {
  admin: { label: 'Admin', text: 'text-brand', bg: 'bg-brand-light' },
  manager: { label: 'Manager', text: 'text-blue-700', bg: 'bg-blue-50' },
  employee: { label: 'Employee', text: 'text-slate-600', bg: 'bg-slate-100' },
};

export const getTaskStatusMeta = (status) => TASK_STATUS_META[status] || TASK_STATUS_META.todo;
export const getProjectStatusMeta = (status) => PROJECT_STATUS_META[status] || PROJECT_STATUS_META.planning;
export const getPriorityMeta = (priority) => PRIORITY_META[priority] || PRIORITY_META.medium;
export const getRoleMeta = (role) => ROLE_META[role] || ROLE_META.employee;
