import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, Users, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { employeeApi } from '../api/employeeApi';
import { userApi } from '../api/userApi';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import { formatDate } from '../utils/dateHelpers';

const DEPARTMENTS = ['Engineering', 'Product', 'Design', 'QA', 'Marketing', 'Sales', 'Operations', 'HR', 'Finance'];

const emptyForm = {
  name: '',
  email: '',
  password: '',
  department: 'Engineering',
  designation: '',
  phone: '',
  dateOfJoining: '',
  manager: '',
  skills: '',
  status: 'active',
};

const Employees = () => {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';

  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadEmployees = useCallback(
    (page = 1) => {
      setLoading(true);
      employeeApi
        .list({ search: search || undefined, department: department || undefined, page })
        .then((res) => {
          setEmployees(res.employees);
          setPagination(res.pagination);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    },
    [search, department]
  );

  useEffect(() => {
    loadEmployees(1);
  }, [loadEmployees]);

  useEffect(() => {
    if (isAdmin) {
      userApi.list({ role: 'manager' }).then((res) => setManagers(res.users)).catch(() => {});
    }
  }, [isAdmin]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (emp) => {
    setEditingId(emp._id);
    setForm({
      name: emp.user?.name || '',
      email: emp.user?.email || '',
      password: '',
      department: emp.department,
      designation: emp.designation,
      phone: emp.phone || '',
      dateOfJoining: emp.dateOfJoining ? emp.dateOfJoining.slice(0, 10) : '',
      manager: emp.manager?._id || '',
      skills: (emp.skills || []).join(', '),
      status: emp.status,
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const skillsArray = form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (editingId) {
        await employeeApi.update(editingId, {
          name: form.name,
          department: form.department,
          designation: form.designation,
          phone: form.phone,
          manager: form.manager || null,
          skills: skillsArray,
          status: form.status,
        });
      } else {
        await employeeApi.create({
          name: form.name,
          email: form.email,
          password: form.password,
          department: form.department,
          designation: form.designation,
          phone: form.phone,
          dateOfJoining: form.dateOfJoining || undefined,
          manager: form.manager || undefined,
          skills: skillsArray,
        });
      }
      setModalOpen(false);
      loadEmployees(pagination.page);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await employeeApi.remove(deleteTarget._id);
      setDeleteTarget(null);
      loadEmployees(pagination.page);
    } catch (err) {
      setError(err.message);
      setDeleteTarget(null);
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
              placeholder="Search by name, email, or employee ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input w-44" value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">All departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        {isAdmin && (
          <button type="button" className="btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> Add employee
          </button>
        )}
      </div>

      {error && <div className="card p-3 text-sm text-signal-urgent">{error}</div>}

      <div className="card overflow-hidden">
        {loading ? (
          <Loader />
        ) : employees.length === 0 ? (
          <EmptyState icon={Users} title="No employees found" description="Try adjusting your search or filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas text-xs font-medium uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Manager</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Status</th>
                  {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-canvas/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: emp.user?.avatarColor || '#94A3B8' }}
                        >
                          {emp.user?.name?.charAt(0)?.toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium text-ink">{emp.user?.name}</p>
                          <p className="font-mono text-xs text-ink-faint">{emp.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{emp.department}</td>
                    <td className="px-4 py-3 text-ink-muted">{emp.designation}</td>
                    <td className="px-4 py-3 text-ink-muted">{emp.manager?.name || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-faint">{formatDate(emp.dateOfJoining)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          emp.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : emp.status === 'on-leave'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(emp)}
                            className="rounded-sm p-1.5 text-ink-muted hover:bg-canvas hover:text-brand"
                            aria-label="Edit employee"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(emp)}
                            className="rounded-sm p-1.5 text-ink-muted hover:bg-signal-urgent/5 hover:text-signal-urgent"
                            aria-label="Delete employee"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination {...pagination} onPageChange={loadEmployees} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit employee' : 'Add employee'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-sm border border-signal-urgent/30 bg-signal-urgent/5 px-3 py-2 text-sm text-signal-urgent">
              {formError}
            </div>
          )}
          <div>
            <label className="label">Full name</label>
            <input name="name" required className="input" value={form.name} onChange={handleChange} />
          </div>
          {!editingId && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="input"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="label">Temporary password</label>
                <input
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className="input"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Department</label>
              <select name="department" className="input" value={form.department} onChange={handleChange}>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Designation</label>
              <input
                name="designation"
                required
                className="input"
                placeholder="e.g. Software Engineer"
                value={form.designation}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Phone</label>
              <input name="phone" className="input" value={form.phone} onChange={handleChange} />
            </div>
            {!editingId && (
              <div>
                <label className="label">Date of joining</label>
                <input
                  name="dateOfJoining"
                  type="date"
                  className="input"
                  value={form.dateOfJoining}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Reporting manager</label>
              <select name="manager" className="input" value={form.manager} onChange={handleChange}>
                <option value="">Unassigned</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            {editingId && (
              <div>
                <label className="label">Status</label>
                <select name="status" className="input" value={form.status} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="on-leave">On leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="label">Skills (comma-separated)</label>
            <input
              name="skills"
              className="input"
              placeholder="e.g. Node.js, React, MongoDB"
              value={form.skills}
              onChange={handleChange}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create employee'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete employee" width="max-w-sm">
        <p className="text-sm text-ink-muted">
          Are you sure you want to delete <span className="font-medium text-ink">{deleteTarget?.user?.name}</span>?
          This will also remove their login account and cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => setDeleteTarget(null)}>
            Cancel
          </button>
          <button type="button" className="btn-danger" onClick={handleDelete}>
            <X size={15} /> Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Employees;
