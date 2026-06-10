import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, CalendarX, Percent, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../lib/axios';

const Attendance = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['todayAttendance', selectedDate],
    queryFn: async () => {
      const { data } = await api.get('/attendance/today');
      return data;
    },
  });

  const markMutation = useMutation({
    mutationFn: (records) => api.post('/attendance/bulk', { records, date: selectedDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayAttendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceToday'] });
      toast.success('Attendance updated');
    },
  });

  const handleToggle = (memberId, currentStatus) => {
    const newStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
    markMutation.mutate([{ memberId, status: newStatus }]);
  };

  const handleMarkAllPresent = () => {
    if (!data?.data) return;
    const records = data.data.filter((m) => m.todayStatus !== 'Present').map((m) => ({ memberId: m._id, status: 'Present' }));
    if (records.length > 0) markMutation.mutate(records);
  };

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field py-2 h-[38px] min-h-0 text-sm font-mono" />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button onClick={handleMarkAllPresent} disabled={markMutation.isPending} className="btn-secondary flex items-center gap-2 justify-center w-full sm:w-auto py-2 h-[38px] min-h-0 text-sm">
            <CalendarCheck className="w-4 h-4" strokeWidth={2} /> MARK ALL PRESENT
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="iron-card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded border border-border bg-bg-raised flex items-center justify-center"><CalendarCheck className="w-5 h-5 text-accent-primary" strokeWidth={2} /></div>
          <div><p className="font-mono font-bold text-3xl text-white leading-none">{stats?.present ?? 0}</p><p className="text-[10px] font-body uppercase tracking-tag text-text-muted mt-1">Present</p></div>
        </div>
        <div className="iron-card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded border border-border bg-bg-raised flex items-center justify-center"><CalendarX className="w-5 h-5 text-danger" strokeWidth={2} /></div>
          <div><p className="font-mono font-bold text-3xl text-white leading-none">{stats?.absent ?? 0}</p><p className="text-[10px] font-body uppercase tracking-tag text-text-muted mt-1">Absent</p></div>
        </div>
        <div className="iron-card p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded border border-border bg-bg-raised flex items-center justify-center"><Percent className="w-5 h-5 text-text-primary" strokeWidth={2} /></div>
          <div><p className="font-mono font-bold text-3xl text-white leading-none">{stats?.rate ?? 0}%</p><p className="text-[10px] font-body uppercase tracking-tag text-text-muted mt-1">Rate</p></div>
        </div>
      </div>

      {/* Attendance Grid */}
      <div className="iron-card p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-bg-surface">
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4">Member</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4 hidden md:table-cell">Phone</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4 hidden lg:table-cell">Plan</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4 hidden lg:table-cell text-center">Last 7 Days</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4 text-center">Today</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-text-muted" strokeWidth={2} /></td></tr>
            ) : data?.data?.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-text-muted font-body text-xs uppercase tracking-widest">No active members</td></tr>
            ) : data?.data?.map((member) => (
              <tr key={member._id} className="border-b border-border table-row-hover">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded bg-bg-raised border border-border flex items-center justify-center font-mono font-bold text-xs text-text-primary flex-shrink-0">
                      {member.fullName?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold font-body text-white">{member.fullName}</p>
                      <p className="text-xs font-mono text-text-secondary">{member.memberId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-body text-text-secondary hidden md:table-cell">{member.phone}</td>
                <td className="px-6 py-4 text-sm font-body text-text-secondary hidden lg:table-cell">{member.membershipPlan?.name || '—'}</td>
                <td className="px-5 py-4 hidden lg:table-cell">
                  <div className="flex items-center justify-center gap-1">
                    {Array.from({ length: 7 }).map((_, idx) => {
                      const dayRecord = member.weekStreak?.find((r) => {
                        const recordDate = new Date(r.date).toDateString();
                        const targetDate = new Date();
                        targetDate.setDate(targetDate.getDate() - (6 - idx));
                        return recordDate === targetDate.toDateString();
                      });
                      return (
                        <div key={idx}
                          className={`w-3 h-3 rounded-sm border border-border ${dayRecord?.status === 'Present' ? 'bg-accent-primary border-accent-primary shadow-[0_0_8px_rgba(204,255,0,0.4)]' : dayRecord?.status === 'Absent' ? 'bg-danger border-danger' : 'bg-bg-raised'}`}
                          title={dayRecord?.status || 'No data'} />
                      );
                    })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <button
                      onClick={() => handleToggle(member._id, member.todayStatus)}
                      disabled={markMutation.isPending}
                      className={`px-4 py-1.5 rounded text-xs font-bold font-body uppercase tracking-widest transition-all duration-150 min-w-[90px] border
                        ${member.todayStatus === 'Present'
                          ? 'bg-accent-primary text-black border-accent-primary shadow-[0_0_12px_rgba(204,255,0,0.2)]'
                          : member.todayStatus === 'Absent'
                          ? 'bg-danger text-white border-danger shadow-[0_0_12px_rgba(255,51,51,0.2)]'
                          : 'bg-transparent text-text-muted border-border hover:border-accent-primary hover:text-accent-primary'}`}
                    >
                      {member.todayStatus || 'MARK'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Attendance;
