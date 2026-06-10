import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, Clock, UserX, CalendarCheck, CalendarX, DollarSign, AlertCircle, Eye } from 'lucide-react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';

const StatCard = ({ icon: Icon, label, value, valueColor = 'text-white', subtext }) => (
  <div className="stat-card flex flex-col justify-between h-full">
    <div className="flex items-center justify-between mb-4">
      <p className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted">{label}</p>
      <Icon className="w-5 h-5 text-text-muted" strokeWidth={2} />
    </div>
    <div>
      <p className={`font-body font-bold text-5xl tracking-tight leading-none ${valueColor}`}>{value ?? '—'}</p>
      {subtext && <p className="text-[12px] text-text-secondary mt-2 font-body uppercase tracking-wider">{subtext}</p>}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-bg-raised border border-border p-3 font-body">
        <p className="text-text-muted text-[10px] uppercase tracking-tag mb-1">{label}</p>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
            <p className="text-sm font-bold text-white">
              {p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('revenue') ? `₹${p.value.toLocaleString()}` : p.value}
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();

  const { data: memberStats } = useQuery({
    queryKey: ['memberStats'],
    queryFn: async () => { const { data } = await api.get('/members/stats/summary'); return data.data; },
  });

  const { data: attendanceToday } = useQuery({
    queryKey: ['attendanceToday'],
    queryFn: async () => { const { data } = await api.get('/attendance/today'); return data.stats; },
  });

  const { data: revenueSummary } = useQuery({
    queryKey: ['revenueSummary'],
    queryFn: async () => { const { data } = await api.get('/payments/revenue/summary'); return data.data; },
  });

  const { data: attendanceStats } = useQuery({
    queryKey: ['attendanceStats'],
    queryFn: async () => { const { data } = await api.get('/attendance/stats?period=30'); return data.data; },
  });

  const { data: monthlyRevenue } = useQuery({
    queryKey: ['monthlyRevenue'],
    queryFn: async () => { const { data } = await api.get('/payments/revenue/monthly'); return data.data; },
  });

  const { data: expiringMembers } = useQuery({
    queryKey: ['expiringMembers'],
    queryFn: async () => { const { data } = await api.get('/members/expiring'); return data.data; },
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueChartData = monthlyRevenue?.map((m) => ({ name: monthNames[m.month - 1], revenue: m.total })) || [];

  const attendanceChartData = attendanceStats?.map((s) => ({
    name: format(new Date(s._id), 'dd MMM'),
    present: s.present,
    absent: s.absent,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Alert Strip */}
      {(memberStats?.expiringSoon > 0 || attendanceToday?.absent > 5) && (
        <div className="alert-card border-l-warning flex items-center justify-between bg-warning-surface">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" strokeWidth={2} />
            <p className="text-sm font-semibold font-body text-white">
              <span className="text-[10px] uppercase tracking-tag text-warning mr-2">SYSTEM ALERT</span>
              {memberStats?.expiringSoon > 0 && `${memberStats.expiringSoon} membership${memberStats.expiringSoon > 1 ? 's' : ''} expiring soon. `}
              {attendanceToday?.absent > 5 && `${attendanceToday.absent} members absent today.`}
            </p>
          </div>
          <button onClick={() => navigate('/alerts')} className="text-xs font-bold font-body text-warning hover:text-white transition-colors uppercase tracking-widest">
            VIEW DETAILS
          </button>
        </div>
      )}

      {/* Row 1 — Member Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Members" value={memberStats?.total} />
        <StatCard icon={UserCheck} label="Active Members" value={memberStats?.active} valueColor="text-accent-primary" />
        <StatCard icon={Clock} label="Expiring Soon" value={memberStats?.expiringSoon} valueColor="text-warning" subtext="Next 7 days" />
        <StatCard icon={UserX} label="Expired" value={memberStats?.expired} valueColor="text-danger" />
      </div>

      {/* Row 2 — Today's Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarCheck} label="Today's Present" value={attendanceToday?.present ?? 0} valueColor="text-accent-primary" />
        <StatCard icon={CalendarX} label="Today's Absent" value={attendanceToday?.absent ?? 0} valueColor="text-danger" />
        <StatCard icon={DollarSign} label="Monthly Revenue" value={`₹${(revenueSummary?.thisMonth || 0).toLocaleString()}`} />
        <StatCard icon={AlertCircle} label="Pending Payments" value={revenueSummary?.pendingCount ?? 0} valueColor="text-warning" />
      </div>

      {/* Row 3 — Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <div className="iron-card flex flex-col p-0 overflow-hidden">
          <div className="p-5 pb-2">
            <h3 className="font-body font-bold text-sm text-white uppercase tracking-wider">Monthly Attendance</h3>
          </div>
          <div className="h-64 mt-4 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#555555', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#555555', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Bar dataKey="present" name="Present" fill="#CCFF00" radius={[2, 2, 0, 0]} barSize={8} />
                <Bar dataKey="absent" name="Absent" fill="#FF4444" radius={[2, 2, 0, 0]} barSize={8} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="iron-card flex flex-col p-0 overflow-hidden">
          <div className="p-5 pb-2">
            <h3 className="font-body font-bold text-sm text-white uppercase tracking-wider">Revenue Overview</h3>
          </div>
          <div className="h-64 mt-4 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#CCFF00" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#CCFF00" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#555555', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#555555', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#CCFF00" fill="url(#revGrad)" strokeWidth={2} activeDot={{ r: 4, fill: '#000', stroke: '#CCFF00', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4 — Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Memberships */}
        <div className="iron-card p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="font-body font-bold text-sm text-white uppercase tracking-wider">Expiring Memberships</h3>
            <button onClick={() => navigate('/alerts')} className="text-text-muted text-[10px] font-bold font-body uppercase tracking-widest hover:text-white transition-colors">VIEW ALL</button>
          </div>
          {expiringMembers?.length > 0 ? (
            <div className="flex flex-col">
              {expiringMembers.slice(0, 5).map((member) => {
                const daysLeft = differenceInDays(new Date(member.membershipExpiryDate), new Date());
                return (
                  <div key={member._id} className="flex items-center justify-between p-4 border-b border-border table-row-hover">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded bg-bg-raised border border-border flex items-center justify-center text-text-primary text-xs font-mono font-bold">
                        {member.fullName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold font-body text-white">{member.fullName}</p>
                        <p className="text-xs font-body text-text-secondary">{member.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                        ${daysLeft <= 1 ? 'bg-danger-surface text-danger' :
                          daysLeft <= 3 ? 'bg-warning-surface text-warning' :
                          'bg-accent-glow text-accent-primary'}`}>
                        {daysLeft <= 0 ? 'TODAY' : `${daysLeft}d left`}
                      </span>
                      <button onClick={() => navigate(`/members/${member._id}`)} className="text-text-muted hover:text-white transition-colors p-1">
                        <Eye className="w-4 h-4" strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-text-muted text-xs text-center py-8 uppercase tracking-widest">No memberships expiring soon</p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="iron-card p-0 overflow-hidden">
          <div className="p-5 border-b border-border">
            <h3 className="font-body font-bold text-sm text-white uppercase tracking-wider">Quick Overview</h3>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <span className="text-text-secondary font-body text-xs font-semibold uppercase tracking-wider">Attendance Rate Today</span>
              <span className="font-mono font-bold text-lg text-accent-primary">{attendanceToday?.rate ?? 0}%</span>
            </div>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <span className="text-text-secondary font-body text-xs font-semibold uppercase tracking-wider">Total Revenue (All Time)</span>
              <span className="font-mono font-bold text-lg text-white">₹{(revenueSummary?.totalCollected || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-5 border-b border-border">
              <span className="text-text-secondary font-body text-xs font-semibold uppercase tracking-wider">This Month's Revenue</span>
              <span className="font-mono font-bold text-lg text-white">₹{(revenueSummary?.thisMonth || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-5">
              <span className="text-text-secondary font-body text-xs font-semibold uppercase tracking-wider">Members Needing Attention</span>
              <span className="font-mono font-bold text-lg text-warning">{(memberStats?.expiringSoon || 0) + (revenueSummary?.pendingCount || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
