import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../lib/axios';

const CHART_COLORS = ['#CCFF00', '#00E5FF', '#FF00FF', '#FF3333', '#00FF66'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Reports = () => {
  const [period, setPeriod] = useState('monthly');
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;

  const { data: yearlyData } = useQuery({
    queryKey: ['yearlyReport', year],
    queryFn: async () => { const { data } = await api.get(`/reports/yearly?year=${year}`); return data.data; },
  });

  const { data: monthlyData } = useQuery({
    queryKey: ['monthlyReport', year, month],
    queryFn: async () => { const { data } = await api.get(`/reports/monthly?year=${year}&month=${month}`); return data.data; },
  });

  const { data: weeklyData } = useQuery({
    queryKey: ['weeklyReport'],
    queryFn: async () => { const { data } = await api.get(`/reports/weekly`); return data.data; },
  });

  const { data: dailyData } = useQuery({
    queryKey: ['dailyReport'],
    queryFn: async () => { const { data } = await api.get(`/reports/daily`); return data.data; },
  });

  const { data: revenueData } = useQuery({
    queryKey: ['revenueReport'],
    queryFn: async () => { const { data } = await api.get(`/reports/revenue?period=year&value=${year}`); return data.data; },
  });

  const attendanceChart = yearlyData?.attendanceByMonth?.map((m) => ({
    name: monthNames[m.month - 1],
    present: m.present,
    absent: m.absent,
  })) || [];

  const revenueChart = yearlyData?.revenueByMonth?.map((m) => ({
    name: monthNames[m.month - 1],
    revenue: m.total,
  })) || [];

  const memberGrowthChart = yearlyData?.memberGrowth?.map((m) => ({
    name: monthNames[m.month - 1],
    members: m.newMembers,
  })) || [];

  const paymentMethodData = revenueData?.byMethod?.map((m, i) => ({
    name: m._id,
    value: m.total,
    color: CHART_COLORS[i % CHART_COLORS.length],
  })) || [];

  const tabs = ['daily', 'weekly', 'monthly', 'yearly'];

  const getStats = () => {
    switch (period) {
      case 'daily':
        return {
          newMembers: dailyData?.newMembers?.count || 0,
          renewals: { count: 'N/A', revenue: 0 },
          activeMembers: monthlyData?.activeMembers || 0,
          expiredMembers: dailyData?.expiringToday || 0,
          label: 'Today'
        };
      case 'weekly':
        return {
          newMembers: weeklyData?.newMembers || 0,
          renewals: { count: 'N/A', revenue: 0 },
          activeMembers: monthlyData?.activeMembers || 0,
          expiredMembers: weeklyData?.inactiveMembers || 0,
          label: 'This week'
        };
      case 'yearly':
        return {
          newMembers: yearlyData?.memberGrowth?.reduce((sum, m) => sum + m.newMembers, 0) || 0,
          renewals: { count: 'N/A', revenue: 0 },
          activeMembers: monthlyData?.activeMembers || 0,
          expiredMembers: 'N/A',
          label: 'This year'
        };
      case 'monthly':
      default:
        return {
          newMembers: monthlyData?.newMembers || 0,
          renewals: monthlyData?.renewals || { count: 0, revenue: 0 },
          activeMembers: monthlyData?.activeMembers || 0,
          expiredMembers: monthlyData?.expiredMembers || 0,
          label: 'This month'
        };
    }
  };

  const currentStats = getStats();

  return (
    <div className="space-y-6">
      {/* Period Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setPeriod(tab)}
            className={`px-6 py-3 text-[10px] font-body font-bold uppercase tracking-wider transition-colors border-b-2
              ${period === tab ? 'border-accent-primary text-accent-primary' : 'border-transparent text-text-muted hover:text-white'}`}>
            {tab}
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="iron-card p-6 flex flex-col justify-between h-32">
          <p className="text-[10px] font-body uppercase tracking-tag text-text-muted">New Members</p>
          <div>
            <p className="font-mono font-bold text-4xl text-white leading-none mb-1">{currentStats.newMembers}</p>
            <p className="text-[10px] font-body text-text-secondary uppercase tracking-widest">{currentStats.label}</p>
          </div>
        </div>
        <div className="iron-card p-6 flex flex-col justify-between h-32">
          <p className="text-[10px] font-body uppercase tracking-tag text-text-muted">Renewals</p>
          <div>
            <p className="font-mono font-bold text-4xl text-white leading-none mb-1">{currentStats.renewals.count}</p>
            <p className="text-[10px] font-mono text-accent-primary uppercase tracking-widest">{currentStats.renewals.revenue ? `₹${currentStats.renewals.revenue.toLocaleString()}` : ''}</p>
          </div>
        </div>
        <div className="iron-card p-6 flex flex-col justify-between h-32">
          <p className="text-[10px] font-body uppercase tracking-tag text-text-muted">Active Members</p>
          <p className="font-mono font-bold text-4xl text-white leading-none">{currentStats.activeMembers}</p>
        </div>
        <div className="iron-card p-6 flex flex-col justify-between h-32">
          <p className="text-[10px] font-body uppercase tracking-tag text-text-muted">{period === 'weekly' ? 'Inactive' : 'Expired'}</p>
          <p className="font-mono font-bold text-4xl text-danger leading-none">{currentStats.expiredMembers}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <div className="iron-card p-6">
          <h3 className="text-xs font-body font-bold text-white uppercase tracking-wider mb-6">Attendance Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3D" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#9494A8', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: '#9494A8', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ background: '#0F0F16', border: '1px solid #2A2A3D', borderRadius: '0px', color: '#FFFFFF', fontSize: '12px', fontFamily: 'JetBrains Mono' }}
                  cursor={{ fill: '#2A2A3D', opacity: 0.4 }}
                />
                <Bar dataKey="present" name="Present" fill="#CCFF00" radius={[2, 2, 0, 0]} maxBarSize={30} />
                <Bar dataKey="absent" name="Absent" fill="#FF3333" radius={[2, 2, 0, 0]} maxBarSize={30} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="iron-card p-6">
          <h3 className="text-xs font-body font-bold text-white uppercase tracking-wider mb-6">Revenue Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3D" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#9494A8', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: '#9494A8', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip 
                  contentStyle={{ background: '#0F0F16', border: '1px solid #2A2A3D', borderRadius: '0px', color: '#FFFFFF', fontSize: '12px', fontFamily: 'JetBrains Mono' }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Line type="step" dataKey="revenue" name="Revenue (₹)" stroke="#00E5FF" strokeWidth={2} dot={{ fill: '#00E5FF', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#FFFFFF' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Member Growth Chart */}
        <div className="iron-card p-6">
          <h3 className="text-xs font-body font-bold text-white uppercase tracking-wider mb-6">Member Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={memberGrowthChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3D" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#9494A8', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: '#9494A8', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ background: '#0F0F16', border: '1px solid #2A2A3D', borderRadius: '0px', color: '#FFFFFF', fontSize: '12px', fontFamily: 'JetBrains Mono' }}
                />
                <Line type="monotone" dataKey="members" name="New Members" stroke="#FF00FF" strokeWidth={2} dot={{ fill: '#FF00FF', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#FFFFFF' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Method Pie */}
        <div className="iron-card p-6">
          <h3 className="text-xs font-body font-bold text-white uppercase tracking-wider mb-6">Payment Methods</h3>
          <div className="h-64">
            {paymentMethodData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentMethodData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} dataKey="value" stroke="none" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {paymentMethodData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#0F0F16', border: '1px solid #2A2A3D', borderRadius: '0px', color: '#FFFFFF', fontSize: '12px', fontFamily: 'JetBrains Mono' }}
                    formatter={(v) => `₹${v.toLocaleString()}`} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted font-body text-[10px] uppercase tracking-widest">No payment data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
