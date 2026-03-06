import { useNavigate, useLocation } from 'react-router-dom';
import { getUser } from '../utils/api';
import { Building2, Calendar, History, Bell, LayoutDashboard, Users, Ban } from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const isAdmin = user?.role === 'admin';

  const userMenuItems = [
    { icon: LayoutDashboard, label: 'Halls', path: '/dashboard', testId: 'sidebar-halls-link' },
    { icon: History, label: 'My Bookings', path: '/my-bookings', testId: 'sidebar-my-bookings-link' },
    { icon: Bell, label: 'Notifications', path: '/notifications', testId: 'sidebar-notifications-link' },
  ];

  const adminMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', testId: 'sidebar-admin-dashboard-link' },
    { icon: Users, label: 'All Bookings', path: '/admin/bookings', testId: 'sidebar-admin-bookings-link' },
    { icon: Ban, label: 'Block Slot', path: '/admin/block-slot', testId: 'sidebar-admin-block-slot-link' },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  return (
    <aside className="w-64 bg-slate-900 text-white flex-col p-6 hidden md:flex" data-testid="sidebar">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-8 h-8" strokeWidth={1.5} />
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Manrope, sans-serif' }}>HMIL Halls</h1>
        </div>
        <p className="text-sm text-slate-400">Hall Booking System</p>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              data-testid={item.testId}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-slate-700">
        <div className="text-sm text-slate-400">
          <p className="font-medium text-white mb-1">{user?.name}</p>
          <p>{user?.emp_id}</p>
          <p className="capitalize mt-1 text-xs text-accent">{user?.role}</p>
        </div>
      </div>
    </aside>
  );
}