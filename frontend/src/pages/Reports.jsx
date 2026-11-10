import { useEffect, useState } from 'react';
import { Users, FolderKanban, TrendingUp, Download, FileText, History } from 'lucide-react';
import { reportApi } from '../api/reportApi';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import { formatDateTime } from '../utils/dateHelpers';

const REPORT_TYPES = [
  {
    type: 'employee',
    title: 'Employee Report',
    description: 'Full roster with department, designation, status, and join date.',
    icon: Users,
  },
  {
    type: 'project',
    title: 'Project Report',
    description: 'Every project with manager, status, priority, progress, and team size.',
    icon: FolderKanban,
  },
  {
    type: 'productivity',
    title: 'Productivity Report',
    description: 'Per-employee task totals, completion rate, and overdue counts.',
    icon: TrendingUp,
  },
];

const Reports = () => {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState('');

  const loadHistory = () => {
    setLoadingHistory(true);
    reportApi
      .getHistory()
      .then((res) => setHistory(res.reports))
      .catch((err) => setError(err.message))
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDownload = async (type, format) => {
    setDownloading(`${type}-${format}`);
    setError('');
    try {
      await reportApi.download(type, format);
      loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {REPORT_TYPES.map(({ type, title, description, icon: Icon }) => (
          <div key={type} className="card p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-light text-brand">
              <Icon size={19} />
            </div>
            <h3 className="mt-3 font-display text-sm font-semibold text-ink">{title}</h3>
            <p className="mt-1 text-xs text-ink-muted">{description}</p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={downloading === `${type}-pdf`}
                onClick={() => handleDownload(type, 'pdf')}
                className="btn-secondary flex-1 !text-xs"
              >
                <Download size={13} /> PDF
              </button>
              <button
                type="button"
                disabled={downloading === `${type}-csv`}
                onClick={() => handleDownload(type, 'csv')}
                className="btn-secondary flex-1 !text-xs"
              >
                <Download size={13} /> CSV
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && <div className="card p-3 text-sm text-signal-urgent">{error}</div>}

      <div className="card">
        <div className="flex items-center gap-2 border-b border-line px-5 py-4">
          <History size={16} className="text-ink-muted" />
          <h3 className="font-display text-sm font-semibold text-ink">Generation history</h3>
        </div>
        {loadingHistory ? (
          <Loader />
        ) : history.length === 0 ? (
          <EmptyState icon={FileText} title="No reports generated yet" description="Your downloads will be logged here." />
        ) : (
          <div className="divide-y divide-line">
            {history.map((r) => (
              <div key={r._id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium capitalize text-ink">
                    {r.type} report <span className="text-ink-faint">· {r.format.toUpperCase()}</span>
                  </p>
                  <p className="text-xs text-ink-faint">
                    {r.generatedBy?.name} · {formatDateTime(r.createdAt)}
                  </p>
                </div>
                <span className="font-mono text-xs text-ink-muted">{r.recordCount} records</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
