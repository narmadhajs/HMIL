import { useNavigate } from 'react-router-dom';
import { removeToken, removeUser, getUser } from '../utils/api';
import { Button } from './ui/button';
import { LogOut, Bell } from 'lucide-react';
import { toast } from 'sonner';

export default function Header() {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    removeToken();
    removeUser();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between" data-testid="header">
      <div>
        <h2 className="text-xl font-bold text-primary" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {user?.role === 'admin' ? 'Admin Panel' : 'Book Your Hall'}
        </h2>
        <p className="text-sm text-secondary">Manage seminar hall bookings efficiently</p>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/notifications')}
          className="relative"
          data-testid="header-notifications-button"
        >
          <Bell className="w-5 h-5" />
        </Button>

        <Button
          variant="outline"
          onClick={handleLogout}
          className="flex items-center gap-2"
          data-testid="header-logout-button"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </Button>
      </div>
    </header>
  );
}