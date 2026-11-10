import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../api/notificationApi';
import { getRoleMeta } from '../../utils/statusStyles';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employees',
  '/projects': 'Projects',
  '/tasks': 'Tasks',
  '/reports': 'Reports',
  '/notifications': 'Notifications',
  '/profile': 'Profile',
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const title =
    PAGE_TITLES[location.pathname] ||
    Object.entries(PAGE_TITLES).find(([path]) => location.pathname.startsWith(path))?.[1] ||
    'WorkForce Pro';

  useEffect(() => {
    let active = true;
    const fetchUnread = async () => {
      try {
        const { unreadCount: count } = await notificationApi.list({ unreadOnly: 'true', limit: 1 });
        if (active) setUnreadCount(count);
      } catch {
        // silently ignore - non-critical UI element
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleMeta = getRoleMeta(user?.role);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-line bg-surface px-6">
      <h1 className="font-display text-lg font-semibold text-ink">{title}</h1>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-ink-muted hover:bg-canvas hover:text-ink"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-signal-urgent px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-md py-1.5 pl-1.5 pr-2.5 hover:bg-canvas"
          >
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: user?.avatarColor || '#0F6B5C' }}
            >
              {user?.name?.charAt(0)?.toUpperCase()}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-none text-ink">{user?.name}</span>
              <span className={`mt-1 inline-block text-[10px] font-medium uppercase tracking-wide ${roleMeta.text}`}>
                {roleMeta.label}
              </span>
            </span>
            <ChevronDown size={14} className="text-ink-faint" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-md border border-line bg-surface shadow-panel">
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink hover:bg-canvas"
              >
                <UserCircle size={16} /> Profile settings
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="flex w-full items-center gap-2 border-t border-line px-4 py-2.5 text-left text-sm text-signal-urgent hover:bg-signal-urgent/5"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
