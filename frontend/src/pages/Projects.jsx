import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, FolderKanban, Users2, CalendarDays } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { projectApi } from '../api/projectApi';
import { userApi } from '../api/userApi';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import Pagination from '../components/common/Pagination';
import { formatDate } from '../utils/dateHelpers';

const STATUSES = ['planning', 'in-progress', 'on-hold', 'completed', 'cancelled'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const emptyForm = {
  name: '',
  description: '',
  manager: '',
  teamMembers: [],
  status: 'planning',
  priority: 'medium',
  startDate: '',
  endDate: '',
  budget: '',
};

const ProgressBar = ({ value }) => (
  <div className="h-1.5 w-full overflow-hidden rounded-full bg-canvas">
    <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${value}%` }} />
  </div>
);

const Projects = () => {
  const { user } = useAuth();
  const canCreate = ['admin', 'manager'].includes(user.role);

  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [managers, setManagers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProjects = useCallback(
    (page = 1) => {
      setLoading(true);
      projectApi
        .list({ search: search || undefined, status: status || undefined, page })
        .then((res) => {
          setProjects(res.projects);
          setPagination(res.pagination);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    },
    [search, status]
  );

  useEffect(() => {
    loadProjects(1);
  }, [loadProjects]);

  useEffect(() => {
    if (canCreate) {
      userApi.list({ role: 'manager' }).then((res) => setManagers(res.users)).catch(() => {});
      userApi.list({ role: 'employee' }).then((res) => setEmployees(res.users)).catch(() => {});
    }
  }, [canCreate]);

  const openCreateModal = () => {
    setForm({ ...emptyForm, manager: user.role === 'manager' ? user.id || user._id : '' });
    setFormError('');
    setModalOpen(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleTeamMember = (id) => {
    setForm((f) => ({
      ...f,
      teamMembers: f.teamMembers.includes(id)
        ? f.teamMembers.filter((m) => m !== id)
        : [...f.teamMembers, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setFormError('End date must be on or after the start date');
      return;
    }
    setSaving(true);
    try {
      await projectApi.create({
        name: form.name,
        description: form.description,
        manager: form.manager || undefined,
        teamMembers: form.teamMembers,
        status: form.status,
        priority: form.priority,
        startDate: form.startDate,
        endDate: form.endDate,
        budget: form.budget ? Number(form.budget) : 0,
      });
      setModalOpen(false);
      loadProjects(1);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 sm:max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              className="input pl-9"
              placeholder="Search projects…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace('-', ' ')}</option>
            ))}
          </select>
        </div>
        {canCreate && (
          <button type="button" className="btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> New project
          </button>
        )}
      </div>

      {error && <div className="card p-3 text-sm text-signal-urgent">{error}</div>}

      {loading ? (
        <Loader />
      ) : projects.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={FolderKanban}
            title="No projects found"
            description={canCreate ? 'Get started by creating your first project.' : 'No projects assigned yet.'}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p._id}
              to={`/projects/${p._id}`}
              className="card flex flex-col gap-3 p-4 transition-shadow hover:shadow-panel"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-sm font-semibold leading-snug text-ink">{p.name}</h3>
                <Badge kind="priority" value={p.priority} />
              </div>
              <p className="line-clamp-2 text-xs text-ink-muted">{p.description || 'No description provided.'}</p>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-ink-faint">
                  <span>Progress</span>
                  <span className="font-mono">{p.progress}%</span>
                </div>
                <ProgressBar value={p.progress} />
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-line pt-3">
                <div className="flex items-center gap-1.5 text-xs text-ink-faint">
                  <Users2 size={13} /> {p.teamMembers.length} members
                </div>
                <div className="flex items-center gap-1.5 text-xs text-ink-faint">
                  <CalendarDays size={13} /> {formatDate(p.endDate)}
                </div>
              </div>
              <Badge kind="project" value={p.status} />
            </Link>
          ))}
        </div>
      )}

      <Pagination {...pagination} onPageChange={loadProjects} />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New project" width="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-sm border border-signal-urgent/30 bg-signal-urgent/5 px-3 py-2 text-sm text-signal-urgent">
              {formError}
            </div>
          )}
          <div>
            <label className="label">Project name</label>
            <input name="name" required className="input" value={form.name} onChange={handleChange} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              name="description"
              rows={3}
              className="input resize-none"
              value={form.description}
              onChange={handleChange}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {user.role === 'admin' && (
              <div>
                <label className="label">Manager</label>
                <select name="manager" required className="input" value={form.manager} onChange={handleChange}>
                  <option value="">Select a manager</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="label">Priority</label>
              <select name="priority" className="input" value={form.priority} onChange={handleChange}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
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
                value={form.startDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label">End date</label>
              <input
                name="endDate"
                type="date"
                required
                className="input"
                value={form.endDate}
                onChange={handleChange}
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
              value={form.budget}
              onChange={handleChange}
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
                    checked={form.teamMembers.includes(emp.id)}
                    onChange={() => toggleTeamMember(emp.id)}
                    className="accent-brand"
                  />
                  {emp.name}
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Projects;
