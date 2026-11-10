import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const DashboardLayout = () => (
  <div className="flex h-screen bg-canvas">
    <Sidebar />
    <div className="flex min-w-0 flex-1 flex-col">
      <Navbar />
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  </div>
);

export default DashboardLayout;
