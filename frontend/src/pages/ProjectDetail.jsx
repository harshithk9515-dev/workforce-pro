import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, ListChecks, CalendarDays, Wallet, UserCog, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { projectApi } from '../api/projectApi';
import { taskApi } from '../api/taskApi';
import { userApi } from '../api/userApi';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { formatDate, isOverdue } from '../utils/dateHelpers';
import { getTaskStatusMeta } from '../utils/statusStyles';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const STATUSES = ['planning', 'in-progress', 'on-hold', 'completed', 'cancelled'];
const TASK_STATUSES = ['todo', 'in-progress', 'review', 'completed'];

const emptyTaskForm = { title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '', estimatedHours: '' };

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [taskBreakdown, setTaskBreakdown] = useState(null);
  const [progress, setProgress] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);
  const [taskFormError, setTaskFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [employees, setEmployees] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editFormError, setEditFormError] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const canManage = ['admin', 'manager'].includes(user.role);

  const loadProject = useCallback(() => {
    setLoading(true);
    Promise.all([projectApi.getById(id), taskApi.list({ project: id, limit: 50 })])
      .then(([projectRes, taskRes]) => {
        setProject(projectRes.project);
        setTaskBreakdown(projectRes.taskBreakdown);
        setProgress(projectRes.progress);
        setTasks(taskRes.tasks);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    if (canManage) {
      userApi.list({ role: 'employee' }).then((res) => setEmployees(res.users)).catch(() => {});
    }
  }, [canManage]);

  const handleStatusChange = async (taskId, status) => {
    try {
      await taskApi.updateStatus(taskId, { status });
      loadProject();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleProjectStatusChange = async (status) => {
    try {
      await projectApi.update(id, { status });
      loadProject();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEditModal = () => {
    setEditForm({
      name: project.name,
      description: project.description || '',
      priority: project.priority,
      status: project.status,
      startDate: project.startDate ? project.startDate.slice(0, 10) : '',
      endDate: project.endDate ? project.endDate.slice(0, 10) : '',
      budget: project.budget || '',
      teamMembers: project.teamMembers.map((m) => m._id),
    });
    setEditFormError('');
    setEditModalOpen(true);
  };

  const handleEditChange = (e) => setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const toggleEditTeamMember = (memberId) => {
    setEditForm((f) => ({
      ...f,
      teamMembers: f.teamMembers.includes(memberId)
        ? f.teamMembers.filter((m) => m !== memberId)
        : [...f.teamMembers, memberId],
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditFormError('');
    if (new Date(editForm.endDate) < new Date(editForm.startDate)) {
      setEditFormError('End date must be on or after the start date');
      return;
    }
    setEditSaving(true);
    try {
      await projectApi.update(id, {
        name: editForm.name,
        description: editForm.description,
        priority: editForm.priority,
        status: editForm.status,
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        budget: editForm.budget ? Number(editForm.budget) : 0,
        teamMembers: editForm.teamMembers,
      });
      setEditModalOpen(false);
      loadProject();
    } catch (err) {
      setEditFormError(err.message);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      await projectApi.remove(id);
      navigate('/projects', { replace: true });
    } catch (err) {
      setError(err.message);
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  const openTaskModal = () => {
    setTaskForm(emptyTaskForm);
    setTaskFormError('');
    setTaskModalOpen(true);
  };

  const handleTaskChange = (e) => setTaskForm({ ...taskForm, [e.target.name]: e.target.value });

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setTaskFormError('');
    setSaving(true);
    try {
      await taskApi.create({
        title: taskForm.title,
        description: taskForm.description,
        project: id,
        assignedTo: taskForm.assignedTo,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate,
        estimatedHours: taskForm.estimatedHours ? Number(taskForm.estimatedHours) : undefined,
      });
      setTaskModalOpen(false);
      loadProject();
    } catch (err) {
      setTaskFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader full label="Loading project…" />;
  if (error && !project) {
    return <div className="card p-4 text-sm text-signal-urgent">{error}</div>;
  }
  if (!project) return null;

  const isOwnProject = user.role === 'admin' || String(project.manager?._id) === String(user.id);

  return (
    <div className="space-y-5">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={15} /> Back to projects
      </Link>

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-semibold text-ink">{project.name}</h2>
              <Badge kind="priority" value={project.priority} />
            </div>
            <p className="mt-1.5 max-w-2xl text-sm text-ink-muted">{project.description}</p>
          </div>
          {canManage && isOwnProject ? (
            <div className="flex items-center gap-2">
              <select
                className="input w-44"
                value={project.status}
                onChange={(e) => handleProjectStatusChange(e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace('-', ' ')}</option>
                ))}
              </select>
              <button type="button" className="btn-secondary !px-2.5" onClick={openEditModal} aria-label="Edit project">
                <Pencil size={15} />
              </button>
              {user.role === 'admin' && (
                <button
                  type="button"
                  className="btn-danger !px-2.5"
                  onClick={() => setDeleteConfirmOpen(true)}
                  aria-label="Delete project"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ) : (
            <Badge kind="project" value={project.status} />
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
          <Stat icon={UserCog} label="Manager" value={project.manager?.name || '—'} />
          <Stat icon={CalendarDays} label="Timeline" value={`${formatDate(project.startDate)} – ${formatDate(project.endDate)}`} />
          <Stat icon={Wallet} label="Budget" value={project.budget ? `$${project.budget.toLocaleString()}` : '—'} />
          <Stat icon={ListChecks} label="Progress" value={`${progress}%`} />
        </div>

        {project.teamMembers?.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">Team:</span>
            {project.teamMembers.map((m) => (
              <span key={m._id} className="badge bg-canvas text-ink-muted">
                {m.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {taskBreakdown && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TASK_STATUSES.map((s) => (
            <div key={s} className={`card signal-rail signal-rail--${s} p-3`}>
              <p className="text-xs text-ink-muted">{getTaskStatusMeta(s).label}</p>
              <p className="mt-1 font-display text-lg font-semibold text-ink">{taskBreakdown[s] || 0}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-display text-sm font-semibold text-ink">Tasks</h3>
          {canManage && isOwnProject && (
            <button type="button" className="btn-primary !py-1.5" onClick={openTaskModal}>
              <Plus size={15} /> Add task
            </button>
          )}
        </div>

        {tasks.length === 0 ? (
          <EmptyState icon={ListChecks} title="No tasks yet" description="Tasks created for this project will show up here." />
        ) : (
          <div className="divide-y divide-line">
            {tasks.map((t) => {
              const canEditStatus = user.role !== 'employee' || String(t.assignedTo._id) === String(user.id);
              return (
                <div key={t._id} className={`signal-rail signal-rail--${t.status} flex flex-wrap items-center justify-between gap-3 px-5 py-3`}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{t.title}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      Assigned to {t.assignedTo?.name} ·{' '}
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} title="Add task">
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          {taskFormError && (
            <div className="rounded-sm border border-signal-urgent/30 bg-signal-urgent/5 px-3 py-2 text-sm text-signal-urgent">
              {taskFormError}
            </div>
          )}
          <div>
            <label className="label">Task title</label>
            <input name="title" required className="input" value={taskForm.title} onChange={handleTaskChange} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              rows={2}
              className="input resize-none"
              value={taskForm.description}
              onChange={handleTaskChange}
            />
          </div>
          <div>
            <label className="label">Assign to</label>
            <select name="assignedTo" required className="input" value={taskForm.assignedTo} onChange={handleTaskChange}>
              <option value="">Select team member</option>
              {(project.teamMembers || []).map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Priority</label>
              <select name="priority" className="input" value={taskForm.priority} onChange={handleTaskChange}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Due date</label>
              <input
                name="dueDate"
                type="date"
                required
                className="input"
                value={taskForm.dueDate}
                onChange={handleTaskChange}
              />
            </div>
            <div>
              <label className="label">Est. hours</label>
              <input
                name="estimatedHours"
                type="number"
                min="0"
                className="input"
                value={taskForm.estimatedHours}
                onChange={handleTaskChange}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setTaskModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Creating…' : 'Create task'}
            </button>
          </div>
        </form>
      </Modal>

      {editForm && (
        <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit project" width="max-w-xl">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {editFormError && (
              <div className="rounded-sm border border-signal-urgent/30 bg-signal-urgent/5 px-3 py-2 text-sm text-signal-urgent">
                {editFormError}
              </div>
            )}
            <div>
              <label className="label">Project name</label>
              <input name="name" required className="input" value={editForm.name} onChange={handleEditChange} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea
                name="description"
                rows={3}
                className="input resize-none"
                value={editForm.description}
                onChange={handleEditChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Priority</label>
                <select name="priority" className="input" value={editForm.priority} onChange={handleEditChange}>
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select name="status" className="input" value={editForm.status} onChange={handleEditChange}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace('-', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start date</label>
                <input
                  name="startDate"
                  type="date"
                  required
                  className="input"
                  value={editForm.startDate}
                  onChange={handleEditChange}
                />
              </div>
              <div>
                <label className="label">End date</label>
                <input
                  name="endDate"
                  type="date"
                  required
                  className="input"
                  value={editForm.endDate}
                  onChange={handleEditChange}
                />
              </div>
            </div>
            <div>
              <label className="label">Budget (USD)</label>
              <input
                name="budget"
                type="number"
                min="0"
                className="input"
                value={editForm.budget}
                onChange={handleEditChange}
              />
            </div>
            <div>
              <label className="label">Team members</label>
              <div className="max-h-36 space-y-1 overflow-y-auto rounded-sm border border-line p-2">
                {employees.length === 0 && <p className="px-1 py-1 text-xs text-ink-faint">No employees available</p>}
                {employees.map((emp) => (
                  <label key={emp.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-canvas">
                    <input
                      type="checkbox"
                      checked={editForm.teamMembers.includes(emp.id)}
                      onChange={() => toggleEditTeamMember(emp.id)}
                      className="accent-brand"
                    />
                    {emp.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-secondary" onClick={() => setEditModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={editSaving} className="btn-primary">
                {editSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <Modal open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Delete project" width="max-w-sm">
        <p className="text-sm text-ink-muted">
          Delete <span className="font-medium text-ink">{project.name}</span>? All of its tasks will be permanently
          deleted too. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </button>
          <button type="button" disabled={deleting} className="btn-danger" onClick={handleDeleteProject}>
            {deleting ? 'Deleting…' : 'Delete project'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

const Stat = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2">
    <Icon size={15} className="mt-0.5 text-ink-faint" />
    <div>
      <p className="text-xs text-ink-faint">{label}</p>
      <p className="text-sm font-medium text-ink">{value}</p>
    </div>
  </div>
);

export default ProjectDetail;
