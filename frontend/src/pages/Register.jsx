import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Boxes, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setSubmitting(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand text-white">
            <Boxes size={20} />
          </div>
        </div>
        <h1 className="text-center font-display text-2xl font-semibold text-ink">Create your account</h1>
        <p className="mt-1 text-center text-sm text-ink-muted">
          New accounts are created with employee access by default.
        </p>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-sm border border-signal-urgent/30 bg-signal-urgent/5 px-3 py-2.5 text-sm text-signal-urgent">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              required
              className="input"
              placeholder="Jane Doe"
              value={form.name}
              onChange={handleChange}
            />
          </div>
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
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="label" htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="input"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange}
            />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
