import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarCheck, CreditCard, BarChart3, Bell, Bot, Settings, Megaphone } from 'lucide-react';
import useAuthStore from '../store/authStore';

const cards = [
  {
    id: 'dashboard',
    title: 'DASHBOARD',
    subtitle: 'System Overview & Core Metrics',
    icon: LayoutDashboard,
    path: '/dashboard',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=1000',
  },
  {
    id: 'attendance',
    title: 'ATTENDANCE',
    subtitle: 'Live Tracking & Access Control',
    icon: CalendarCheck,
    path: '/attendance',
    image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1000',
  },
  {
    id: 'members',
    title: 'MEMBERS',
    subtitle: 'Client Management & Profiles',
    icon: Users,
    path: '/members',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=1000',
  },
  {
    id: 'payments',
    title: 'PAYMENTS',
    subtitle: 'Revenue & Transaction Logs',
    icon: CreditCard,
    path: '/payments',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1000',
  },
  {
    id: 'reports',
    title: 'REPORTS',
    subtitle: 'Advanced Analytics & Growth',
    icon: BarChart3,
    path: '/reports',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000',
  },
  {
    id: 'alerts',
    title: 'SYSTEM ALERTS',
    subtitle: 'Warnings & Automated Notices',
    icon: Bell,
    path: '/alerts',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1000',
  },
  {
    id: 'assistant',
    title: 'SMART ASSISTANT',
    subtitle: 'AI Operational Intelligence',
    icon: Bot,
    path: '/assistant',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1000',
  },
  {
    id: 'marketing',
    title: 'MARKETING',
    subtitle: 'WhatsApp Campaigns & Reach',
    icon: Megaphone,
    path: '/marketing',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1000',
  },
  {
    id: 'settings',
    title: 'SETTINGS',
    subtitle: 'System Configuration & Auth',
    icon: Settings,
    path: '/settings',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1000',
  },
];

const Launchpad = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border pb-6">
        <div>
          <h1 className="font-display font-extrabold text-3xl md:text-5xl text-white uppercase tracking-wider mb-2">
            Welcome, <span className="text-accent-primary">{user?.username || 'Operator'}</span>
          </h1>
          <p className="text-sm font-mono text-text-muted uppercase tracking-widest">
            Select a module to initiate operational sequence
          </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs font-body font-bold text-text-secondary uppercase tracking-wider">System Status</p>
          <div className="flex items-center justify-end gap-2 mt-1">
            <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
            <span className="text-accent-primary font-mono text-xs font-bold uppercase tracking-widest">ONLINE</span>
          </div>
        </div>
      </div>

      {/* Grid Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => navigate(card.path)}
            className="group relative flex flex-col items-start justify-end h-64 rounded-xl overflow-hidden border border-border text-left transition-all duration-300 hover:border-accent-primary hover:shadow-glow-strong focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-bg-background"
          >
            {/* Background Image */}
            <div className="absolute inset-0 z-0 bg-black">
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 p-5 w-full">
              <div className="w-10 h-10 rounded bg-black/50 border border-border flex items-center justify-center mb-4 transition-colors group-hover:border-accent-primary group-hover:bg-accent-primary/10">
                <card.icon className="w-5 h-5 text-white group-hover:text-accent-primary transition-colors" strokeWidth={2} />
              </div>
              <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider mb-1 group-hover:text-accent-primary transition-colors">
                {card.title}
              </h2>
              <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest group-hover:text-text-secondary transition-colors line-clamp-1">
                {card.subtitle}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Launchpad;
