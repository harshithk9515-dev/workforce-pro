import { format, formatDistanceToNow, isPast, isToday } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy');
};

export const formatDateTime = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy · h:mm a');
};

export const timeAgo = (date) => {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const isOverdue = (dueDate, status) => {
  if (!dueDate || status === 'completed') return false;
  return isPast(new Date(dueDate)) && !isToday(new Date(dueDate));
};

export const isDueToday = (dueDate) => {
  if (!dueDate) return false;
  return isToday(new Date(dueDate));
};
