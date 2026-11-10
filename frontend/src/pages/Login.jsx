import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Boxes, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-navy p-12 text-white lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand">
            <Boxes size={20} />
          </div>
          <span className="font-display text-lg font-semibold">WorkForce Pro</span>
        </div>
        <div className="max-w-md">
          <h2 className="font-display text-3xl font-semibold leading-tight">
            One console for projects, tasks, and team performance.
          </h2>
          <p className="mt-4 text-sm text-white/55">
            Assign work, track progress, and see exactly where every project and employee stands —
            in real time.
          </p>
        </div>
        <p className="text-xs text-white/30">© {new Date().getFullYear()} WorkForce Pro</p>
      </div>

      <div className="flex w-full flex-col items-center justify-center bg-canvas px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-brand text-white">
              <Boxes size={20} />
            </div>
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-muted">Sign in to your WorkForce Pro account</p>

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-sm border border-signal-urgent/30 bg-signal-urgent/5 px-3 py-2.5 text-sm text-signal-urgent">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input"
                placeholder="you@company.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Sign in
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium text-brand hover:underline">
              Create one
            </Link>
          </p>

          <div className="mt-8 rounded-md border border-line bg-white px-4 py-3 text-xs text-ink-faint">
            <p className="font-medium text-ink-muted">Demo credentials (after seeding):</p>
            <p className="mt-1 font-mono">admin@workforcepro.com / Admin@12345</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
