import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ListChecks,
  FileBarChart,
  Bell,
  Boxes,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'employee'] },
  { to: '/employees', label: 'Employees', icon: Users, roles: ['admin', 'manager'] },
  { to: '/projects', label: 'Projects', icon: FolderKanban, roles: ['admin', 'manager', 'employee'] },
  { to: '/tasks', label: 'Tasks', icon: ListChecks, roles: ['admin', 'manager', 'employee'] },
  { to: '/reports', label: 'Reports', icon: FileBarChart, roles: ['admin', 'manager'] },
  { to: '/notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'manager', 'employee'] },
];

const Sidebar = () => {
  const { user } = useAuth();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-navy text-white md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-white">
          <Boxes size={18} />
        </div>
        <div>
          <p className="font-display text-sm font-semibold leading-none text-white">WorkForce Pro</p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-white/40">Enterprise Suite</p>
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-0.5 px-3">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-sm border-l-[3px] px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'border-brand bg-white/[0.06] font-medium text-white'
                  : 'border-transparent text-white/60 hover:bg-white/[0.04] hover:text-white'
              }`
            }
          >
            <Icon size={17} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-navy-border px-5 py-4 text-[11px] text-white/35">
        WorkForce Pro v1.0
      </div>
    </aside>
  );
};

export default Sidebar;
