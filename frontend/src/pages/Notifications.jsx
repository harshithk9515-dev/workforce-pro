import { useEffect, useState, useCallback } from 'react';
import { Bell, CheckCheck, Trash2, UserPlus, CheckCircle2, AlarmClock, FolderKanban } from 'lucide-react';
import { notificationApi } from '../api/notificationApi';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import Pagination from '../components/common/Pagination';
import { timeAgo } from '../utils/dateHelpers';

const TYPE_ICON = {
  task_assigned: UserPlus,
  task_completed: CheckCircle2,
  deadline_reminder: AlarmClock,
  project_update: FolderKanban,
};

const TYPE_COLOR = {
  task_assigned: 'bg-blue-50 text-blue-700',
  task_completed: 'bg-emerald-50 text-emerald-700',
  deadline_reminder: 'bg-amber-50 text-amber-700',
  project_update: 'bg-brand-light text-brand',
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(
    (page = 1) => {
      setLoading(true);
      notificationApi
        .list({ unreadOnly: unreadOnly ? 'true' : undefined, page })
        .then((res) => {
          setNotifications(res.notifications);
          setPagination(res.pagination);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    },
    [unreadOnly]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      load(pagination.page);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationApi.remove(id);
      load(pagination.page);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            className="accent-brand"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
          />
          Unread only
        </label>
        <button type="button" className="btn-secondary" onClick={handleMarkAllRead}>
          <CheckCheck size={15} /> Mark all as read
        </button>
      </div>

      {error && <div className="card p-3 text-sm text-signal-urgent">{error}</div>}

      <div className="card overflow-hidden">
        {loading ? (
          <Loader />
        ) : notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
        ) : (
          <div className="divide-y divide-line">
            {notifications.map((n) => {
              const Icon = TYPE_ICON[n.type] || Bell;
              return (
                <div
                  key={n._id}
                  className={`flex items-start gap-3 px-5 py-3.5 ${!n.isRead ? 'bg-brand-light/30' : ''}`}
                >
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${TYPE_COLOR[n.type] || 'bg-canvas text-ink-muted'}`}>
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{n.title}</p>
                    <p className="mt-0.5 text-sm text-ink-muted">{n.message}</p>
                    <p className="mt-1 text-xs text-ink-faint">{timeAgo(n.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(n._id)}
                        className="rounded-sm p-1.5 text-ink-muted hover:bg-canvas hover:text-brand"
                        aria-label="Mark as read"
                      >
                        <CheckCheck size={15} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(n._id)}
                      className="rounded-sm p-1.5 text-ink-muted hover:bg-signal-urgent/5 hover:text-signal-urgent"
                      aria-label="Delete notification"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Pagination {...pagination} onPageChange={load} />
      </div>
    </div>
  );
};

export default Notifications;
