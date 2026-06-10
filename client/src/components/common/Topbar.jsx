import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import useAppStore from '../../store/appStore';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/members': 'Members',
  '/attendance': 'Attendance',
  '/payments': 'Payments & Revenue',
  '/reports': 'Advanced Analytics',
  '/alerts': 'System Alerts',
  '/assistant': 'Smart Assistant',
  '/settings': 'Settings',
  '/': 'Launchpad',
};

const Topbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleSidebar, globalSearch, setGlobalSearch } = useAppStore();

  const pageTitle = pageTitles[location.pathname] || 
    (location.pathname.startsWith('/members/') ? 'Member Detail' : 'GymOS');

  const { data: unreadCount } = useQuery({
    queryKey: ['notificationCount'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/count');
      return data.data.count;
    },
    refetchInterval: 30000,
  });

  const today = format(new Date(), 'EEEE, dd MMM yyyy');

  return (
    <header className="h-[56px] bg-bg-background border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="lg:hidden text-text-secondary hover:text-white">
          <Menu className="w-5 h-5" strokeWidth={2} />
        </button>
        
        {location.pathname !== '/' && (
          <button 
            onClick={() => navigate(-1)} 
            className="hidden lg:flex items-center justify-center p-1.5 rounded-md text-text-secondary hover:text-white hover:bg-bg-raised transition-colors mr-1"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
          </button>
        )}

        {location.pathname !== '/' && (
          <button 
            onClick={() => navigate(-1)} 
            className="lg:hidden flex items-center justify-center p-1 rounded-md text-text-secondary hover:text-white transition-colors mr-1"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
          </button>
        )}

        <h1 className="font-body font-bold text-lg text-white">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="hidden md:flex items-center bg-bg-card border border-border rounded px-3 py-1.5 gap-2 w-64 focus-within:border-accent-primary focus-within:ring-1 focus-within:ring-accent-primary/20 transition-all">
          <Search className="w-4 h-4 text-text-muted flex-shrink-0" strokeWidth={2} />
          <input
            type="text"
            placeholder="Search members..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-white placeholder-text-muted w-full font-body"
          />
        </div>

        {/* Notification bell */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 text-text-secondary hover:text-white hover:bg-bg-raised rounded transition-colors duration-150"
        >
          <Bell className="w-5 h-5" strokeWidth={2} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full border border-bg-background"></span>
          )}
        </button>

        {/* Date */}
        <span className="hidden lg:block text-xs text-text-muted font-mono uppercase tracking-tag">{today}</span>
      </div>
    </header>
  );
};

export default Topbar;
