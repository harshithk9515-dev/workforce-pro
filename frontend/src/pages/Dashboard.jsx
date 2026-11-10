import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../api/dashboardApi';
import KPICard from '../components/common/KPICard';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';
import StatusDistributionChart from '../components/charts/StatusDistributionChart';
import ProductivityChart from '../components/charts/ProductivityChart';
import { formatDate, isOverdue } from '../utils/dateHelpers';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    dashboardApi
      .getMine()
      .then((res) => active && setData(res))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <Loader full label="Loading your dashboard…" />;
  if (error) {
    return (
      <div className="card flex items-center gap-2 p-4 text-sm text-signal-urgent">
        <AlertTriangle size={16} /> {error}
      </div>
    );
  }

  if (user.role === 'employee') return <EmployeeDashboard data={data} />;
  return <OrgDashboard data={data} role={user.role} />;
};

const OrgDashboard = ({ data, role }) => {
  const { kpis, statusDistribution, productivityByUser, recentProjects, projects, departmentCounts } = data;

  const chartData = (productivityByUser || []).map((p) => ({
    name: p.name.split(' ')[0],
    completed: p.completed,
    pending: p.pending,
  }));

  const projectList = recentProjects || projects || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Active employees" value={kpis.totalEmployees} icon={Users} rail="brand" />
        <KPICard
          label="Projects in progress"
          value={kpis.activeProjects}
          sublabel={`${kpis.totalProjects} total`}
          icon={FolderKanban}
          rail="progress"
        />
        <KPICard
          label="Tasks completed"
          value={kpis.completedTasks}
          sublabel={`${kpis.overallCompletionRate}% completion rate`}
          icon={CheckCircle2}
          rail="completed"
        />
        <KPICard
          label="Overdue tasks"
          value={kpis.overdueTasks}
          sublabel={`${kpis.pendingTasks} pending total`}
          icon={AlertTriangle}
          rail="urgent"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-ink">Team productivity</h3>
            <TrendingUp size={16} className="text-ink-faint" />
          </div>
          <ProductivityChart data={chartData} />
        </div>
        <div className="card p-5">
          <h3 className="mb-3 font-display text-sm font-semibold text-ink">Task status distribution</h3>
          <StatusDistributionChart distribution={statusDistribution} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-ink">
              {role === 'admin' ? 'Recently created projects' : 'Your projects'}
            </h3>
            <Link to="/projects" className="text-xs font-medium text-brand hover:underline">
              View all
            </Link>
          </div>
          {projectList.length === 0 ? (
            <EmptyState icon={FolderKanban} title="No projects yet" />
          ) : (
            <div className="divide-y divide-line">
              {projectList.map((p) => (
                <div key={p._id} className="flex items-center justify-between py-3">
                  <div>
                    <Link to={`/projects/${p._id}`} className="text-sm font-medium text-ink hover:text-brand">
                      {p.name}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      Manager: {p.manager?.name || '—'} · Due {formatDate(p.endDate)}
                    </p>
                  </div>
                  <Badge kind="project" value={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="mb-3 font-display text-sm font-semibold text-ink">
            {departmentCounts ? 'Employees by department' : 'Project priorities'}
          </h3>
          {departmentCounts ? (
            <ul className="space-y-2.5">
              {departmentCounts.map((d) => (
                <li key={d.department} className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted">{d.department}</span>
                  <span className="font-mono font-medium text-ink">{d.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-2.5">
              {(projects || []).slice(0, 6).map((p) => (
                <li key={p._id} className="flex items-center justify-between text-sm">
                  <span className="truncate pr-2 text-ink-muted">{p.name}</span>
                  <Badge kind="priority" value={p.priority} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

const EmployeeDashboard = ({ data }) => {
  const { productivity, upcomingTasks } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard label="Total tasks" value={productivity.total} icon={FolderKanban} rail="brand" />
        <KPICard label="Completed" value={productivity.completed} icon={CheckCircle2} rail="completed" />
        <KPICard
          label="In progress / review"
          value={
            (productivity.breakdown['in-progress'] || 0) + (productivity.breakdown.review || 0)
          }
          icon={Clock}
          rail="progress"
        />
        <KPICard label="Overdue" value={productivity.overdue} icon={AlertTriangle} rail="urgent" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h3 className="mb-3 font-display text-sm font-semibold text-ink">Your task breakdown</h3>
          <StatusDistributionChart distribution={productivity.breakdown} />
          <p className="mt-2 text-center text-xs text-ink-faint">
            {productivity.completionRate}% of your tasks are complete
          </p>
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-ink">Upcoming tasks</h3>
            <Link to="/tasks" className="text-xs font-medium text-brand hover:underline">
              View all
            </Link>
          </div>
          {upcomingTasks.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="You're all caught up" description="No pending tasks." />
          ) : (
            <div className="divide-y divide-line">
              {upcomingTasks.map((t) => (
                <div key={t._id} className={`flex items-center justify-between py-3 signal-rail signal-rail--${t.status}`}>
                  <div>
                    <p className="text-sm font-medium text-ink">{t.title}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {t.project?.name} ·{' '}
                      <span className={isOverdue(t.dueDate, t.status) ? 'font-medium text-signal-urgent' : ''}>
                        Due {formatDate(t.dueDate)}
                      </span>
                    </p>
                  </div>
                  <Badge kind="task" value={t.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
