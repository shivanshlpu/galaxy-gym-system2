import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarCheck, CreditCard, BarChart3, Bell, Bot, Settings, LogOut, Menu, X, Plus, Home, Megaphone } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useAppStore from '../../store/appStore';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';

const navItems = [
  { label: 'MAIN', items: [
    { path: '/', icon: Home, label: 'Launchpad' },
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/members', icon: Users, label: 'Members' },
    { path: '/expired-members', icon: Users, label: 'Expired Members' },
    { path: '/attendance', icon: CalendarCheck, label: 'Attendance' },
    { path: '/payments', icon: CreditCard, label: 'Payments' },
  ]},
  { label: 'ANALYTICS', items: [
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/alerts', icon: Bell, label: 'Alerts', hasBadge: true },
  ]},
  { label: 'TOOLS', items: [
    { path: '/assistant', icon: Bot, label: 'Smart Assistant' },
    { path: '/marketing', icon: Megaphone, label: 'Marketing' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]},
];

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const navigate = useNavigate();

  const { data: unreadCount } = useQuery({
    queryKey: ['notificationCount'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/count');
      return data.data.count;
    },
    refetchInterval: 30000,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/80 z-40 lg:hidden" onClick={toggleSidebar} />
      )}

      <aside className={`fixed top-0 left-0 h-full z-50 transition-transform duration-150 ease-out
        w-[220px] bg-bg-surface border-r border-border flex flex-col
        ${sidebarCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
        lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex flex-col px-5 py-6 border-b border-border">
          <div className="flex items-center justify-between mb-1">
            <span className="font-display font-extrabold text-xl text-accent-primary uppercase tracking-wider">GALAXY FITNESS CLUB</span>
            <button onClick={toggleSidebar} className="lg:hidden text-text-secondary hover:text-white">
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>
          <span className="text-[10px] font-body uppercase tracking-[0.15em] text-text-muted">Elite Management</span>
          
          <button onClick={() => navigate('/members?action=add')} className="btn-primary w-full mt-6 flex justify-center py-2 h-10 min-h-0 text-sm">
            <Plus className="w-4 h-4 mr-1" strokeWidth={2.5} /> ADD MEMBER
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((group) => (
            <div key={group.label} className="mb-6">
              <p className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-5 mb-2">
                {group.label}
              </p>
              <div className="flex flex-col">
                {group.items.map((item, index) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-5 py-3 text-[14px] font-body transition-colors duration-100 border-b border-border-dashed border-opacity-40 relative
                      ${isActive
                        ? 'text-white bg-accent-glow'
                        : 'text-text-secondary hover:text-white hover:bg-bg-card'
                      }
                      ${index === group.items.length - 1 ? 'border-b-0' : ''}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent-active" />}
                        <item.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2} />
                        <span>{item.label}</span>
                        {item.hasBadge && unreadCount > 0 && (
                          <span className="ml-auto bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-border px-5 py-4 bg-bg-surface">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded bg-bg-card border border-border flex items-center justify-center text-text-primary font-mono text-sm">
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-body font-semibold text-white truncate">{user?.username || 'Admin'}</p>
              <p className="text-xs text-text-muted font-body truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-body text-danger border border-transparent hover:bg-danger-surface hover:border-danger rounded transition-colors duration-150"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
            <span>LOGOUT</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
