import { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { getRoleMeta } from '../utils/statusStyles';

const Profile = () => {
  const { user, updateUserCache } = useAuth();
  const [name, setName] = useState(user.name);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const roleMeta = getRoleMeta(user.role);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileError('');
    setSavingProfile(true);
    try {
      const { user: updated } = await authApi.updateMe({ name });
      updateUserCache(updated);
      setProfileMsg('Profile updated successfully');
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setSavingPassword(true);
    try {
      await authApi.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordMsg('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="card flex items-center gap-4 p-5">
        <span
          className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-semibold text-white"
          style={{ backgroundColor: user.avatarColor || '#0F6B5C' }}
        >
          {user.name?.charAt(0)?.toUpperCase()}
        </span>
        <div>
          <p className="font-display text-lg font-semibold text-ink">{user.name}</p>
          <p className="text-sm text-ink-muted">{user.email}</p>
          <span className={`badge mt-1.5 ${roleMeta.bg} ${roleMeta.text}`}>{roleMeta.label}</span>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-display text-sm font-semibold text-ink">Profile details</h3>
        {profileMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-sm border border-signal-completed/30 bg-signal-completed/5 px-3 py-2 text-sm text-signal-completed">
            <CheckCircle2 size={15} /> {profileMsg}
          </div>
        )}
        {profileError && (
          <div className="mt-3 flex items-center gap-2 rounded-sm border border-signal-urgent/30 bg-signal-urgent/5 px-3 py-2 text-sm text-signal-urgent">
            <AlertCircle size={15} /> {profileError}
          </div>
        )}
        <form onSubmit={handleProfileSubmit} className="mt-4 space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-canvas" value={user.email} disabled />
            <p className="mt-1 text-xs text-ink-faint">Email is managed by your administrator.</p>
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary">
            {savingProfile ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      <div className="card p-5">
        <h3 className="font-display text-sm font-semibold text-ink">Change password</h3>
        {passwordMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-sm border border-signal-completed/30 bg-signal-completed/5 px-3 py-2 text-sm text-signal-completed">
            <CheckCircle2 size={15} /> {passwordMsg}
          </div>
        )}
        {passwordError && (
          <div className="mt-3 flex items-center gap-2 rounded-sm border border-signal-urgent/30 bg-signal-urgent/5 px-3 py-2 text-sm text-signal-urgent">
            <AlertCircle size={15} /> {passwordError}
          </div>
        )}
        <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
          <div>
            <label className="label">Current password</label>
            <input
              type="password"
              className="input"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">New password</label>
              <input
                type="password"
                className="input"
                required
                minLength={8}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input
                type="password"
                className="input"
                required
                minLength={8}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>
          </div>
          <button type="submit" disabled={savingPassword} className="btn-primary">
            {savingPassword ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
