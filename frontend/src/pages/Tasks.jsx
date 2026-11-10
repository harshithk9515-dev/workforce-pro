import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, ListChecks, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { taskApi } from '../api/taskApi';
import { projectApi } from '../api/projectApi';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import Pagination from '../components/common/Pagination';
import { formatDate, isOverdue } from '../utils/dateHelpers';
import { getTaskStatusMeta } from '../utils/statusStyles';

const TASK_STATUSES = ['todo', 'in-progress', 'review', 'completed'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const emptyForm = { title: '', description: '', project: '', assignedTo: '', priority: 'medium', dueDate: '', estimatedHours: '' };

const Tasks = () => {
  const { user } = useAuth();
  const canManage = ['admin', 'manager'].includes(user.role);

  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedProject, setSelectedProject] = useState(null);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadTasks = useCallback(
    (page = 1) => {
      setLoading(true);
      taskApi
        .list({
          search: search || undefined,
          project: projectFilter || undefined,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          page,
        })
        .then((res) => {
          setTasks(res.tasks);
          setPagination(res.pagination);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    },
    [search, projectFilter, statusFilter, priorityFilter]
  );

  useEffect(() => {
    loadTasks(1);
  }, [loadTasks]);

  useEffect(() => {
    projectApi.list({ limit: 100 }).then((res) => setProjects(res.projects)).catch(() => {});
  }, []);

  const handleStatusChange = async (taskId, status) => {
    try {
      await taskApi.updateStatus(taskId, { status });
      loadTasks(pagination.page);
    } catch (err) {
      setError(err.message);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSelectedProject(null);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    const proj = projects.find((p) => p._id === task.project?._id) || null;
    setEditingId(task._id);
    setForm({
      title: task.title,
      description: task.description || '',
      project: task.project?._id || '',
      assignedTo: task.assignedTo?._id || '',
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
      estimatedHours: task.estimatedHours || '',
    });
    setSelectedProject(proj);
    setFormError('');
    setModalOpen(true);
  };

  const handleProjectSelect = (e) => {
    const projectId = e.target.value;
    setForm({ ...form, project: projectId, assignedTo: '' });
    setSelectedProject(projects.find((p) => p._id === projectId) || null);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        assignedTo: form.assignedTo,
        priority: form.priority,
        dueDate: form.dueDate,
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
      };
      if (editingId) {
        await taskApi.update(editingId, payload);
      } else {
        await taskApi.create({ ...payload, project: form.project });
      }
      setModalOpen(false);
      loadTasks(editingId ? pagination.page : 1);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await taskApi.remove(deleteTarget._id);
      setDeleteTarget(null);
      loadTasks(pagination.page);
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              className="input pl-9"
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input w-44" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <select className="input w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All statuses</option>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>{getTaskStatusMeta(s).label}</option>
            ))}
          </select>
          <select className="input w-32" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        {canManage && (
          <button type="button" className="btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> New task
          </button>
        )}
      </div>

      {error && <div className="card p-3 text-sm text-signal-urgent">{error}</div>}

      <div className="card overflow-hidden">
        {loading ? (
          <Loader />
        ) : tasks.length === 0 ? (
          <EmptyState icon={ListChecks} title="No tasks found" description="Try adjusting your filters." />
        ) : (
          <div className="divide-y divide-line">
            {tasks.map((t) => {
              const canEditStatus = user.role !== 'employee' || String(t.assignedTo._id) === String(user.id);
              return (
                <div
                  key={t._id}
                  className={`signal-rail signal-rail--${t.status} flex flex-wrap items-center justify-between gap-3 px-5 py-3.5`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{t.title}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {t.project?.name} · {t.assignedTo?.name} ·{' '}
                      <span className={isOverdue(t.dueDate, t.status) ? 'font-medium text-signal-urgent' : ''}>
                        Due {formatDate(t.dueDate)}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge kind="priority" value={t.priority} />
                    {canEditStatus ? (
                      <select
                        className="input w-32 !py-1 text-xs"
                        value={t.status}
                        onChange={(e) => handleStatusChange(t._id, e.target.value)}
                      >
                        {TASK_STATUSES.map((s) => (
                          <option key={s} value={s}>{getTaskStatusMeta(s).label}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge kind="task" value={t.status} />
                    )}
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => openEditModal(t)}
                        className="rounded-sm p-1.5 text-ink-muted hover:bg-canvas hover:text-brand"
                        aria-label="Edit task"
                      >
                        <Pencil size={15} />
                      </button>
                    )}
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(t)}
                        className="rounded-sm p-1.5 text-ink-muted hover:bg-signal-urgent/5 hover:text-signal-urgent"
                        aria-label="Delete task"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Pagination {...pagination} onPageChange={loadTasks} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit task' : 'New task'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-sm border border-signal-urgent/30 bg-signal-urgent/5 px-3 py-2 text-sm text-signal-urgent">
              {formError}
            </div>
          )}
          <div>
            <label className="label">Task title</label>
            <input name="title" required className="input" value={form.title} onChange={handleChange} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea name="description" rows={2} className="input resize-none" value={form.description} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Project</label>
              <select
                name="project"
                required
                className="input"
                value={form.project}
                onChange={handleProjectSelect}
                disabled={!!editingId}
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Assign to</label>
              <select
                name="assignedTo"
                required
                className="input"
                value={form.assignedTo}
                onChange={handleChange}
                disabled={!selectedProject}
              >
                <option value="">{selectedProject ? 'Select team member' : 'Pick a project first'}</option>
                {(selectedProject?.teamMembers || []).map((m) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Priority</label>
              <select name="priority" className="input" value={form.priority} onChange={handleChange}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Due date</label>
              <input name="dueDate" type="date" required className="input" value={form.dueDate} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Est. hours</label>
              <input name="estimatedHours" type="number" min="0" className="input" value={form.estimatedHours} onChange={handleChange} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete task" width="max-w-sm">
        <p className="text-sm text-ink-muted">
          Delete <span className="font-medium text-ink">{deleteTarget?.title}</span>? This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </button>
          <button type="button" className="btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Tasks;
