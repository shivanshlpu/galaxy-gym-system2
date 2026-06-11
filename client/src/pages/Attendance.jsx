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
      const { data } = await api.get(`/attendance/today?date=${selectedDate}`);
      return data;
    },
  });

  const markMutation = useMutation({
    mutationFn: (records) => api.post('/attendance/bulk', { records, date: selectedDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayAttendance'] });
      toast.success('Attendance updated');
    },
  });



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
          <thead className="hidden lg:table-header-group">
            <tr className="border-b border-border bg-bg-surface">
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4">Member</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4">Phone</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4">Plan</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4 text-center">Last 7 Days</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4 text-center">Today</th>
            </tr>
          </thead>
          <tbody className="flex flex-col lg:table-row-group">
            {isLoading ? (
              <tr className="flex lg:table-row"><td colSpan={5} className="w-full text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-text-muted" strokeWidth={2} /></td></tr>
            ) : data?.data?.length === 0 ? (
              <tr className="flex lg:table-row"><td colSpan={5} className="w-full text-center py-12 text-text-muted font-body text-xs uppercase tracking-widest">No active members</td></tr>
            ) : data?.data?.map((member) => (
              <tr key={member._id} className="border-b border-border flex flex-col lg:table-row p-4 lg:p-0 gap-4 lg:gap-0 table-row-hover">
                <td className="px-2 lg:px-6 lg:py-4 flex justify-between items-start lg:table-cell">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 lg:w-8 lg:h-8 rounded bg-bg-raised border border-border flex items-center justify-center font-mono font-bold text-sm lg:text-xs text-text-primary flex-shrink-0">
                      {member.fullName?.[0]}
                    </div>
                    <div>
                      <p className="text-base lg:text-sm font-semibold font-body text-white">{member.fullName}</p>
                      <p className="text-xs font-mono text-text-secondary mt-0.5">{member.memberId} <span className="lg:hidden"> • {member.phone}</span></p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-body text-text-secondary hidden lg:table-cell">{member.phone}</td>
                <td className="px-6 py-4 text-sm font-body text-text-secondary hidden lg:table-cell">{member.membershipPlan?.name || '—'}</td>
                <td className="px-2 lg:px-5 lg:py-4 block lg:table-cell w-full">
                  <div className="flex items-center justify-between lg:justify-center w-full bg-bg-surface lg:bg-transparent p-3 lg:p-0 rounded border border-border lg:border-none">
                    <span className="lg:hidden text-[10px] font-bold text-text-muted uppercase tracking-wider">Last 7 Days</span>
                    <div className="flex items-center justify-center gap-1.5 lg:gap-1">
                      {Array.from({ length: 7 }).map((_, idx) => {
                        const dayRecord = member.weekStreak?.find((r) => {
                          const recordDate = new Date(r.date).toDateString();
                          const targetDate = new Date();
                          targetDate.setDate(targetDate.getDate() - (6 - idx));
                          return recordDate === targetDate.toDateString();
                        });
                        return (
                          <div key={idx}
                            className={`w-3.5 h-3.5 lg:w-3 lg:h-3 rounded-sm border border-border ${dayRecord?.status === 'Present' ? 'bg-accent-primary border-accent-primary shadow-[0_0_8px_rgba(204,255,0,0.4)]' : dayRecord?.status === 'Absent' ? 'bg-danger border-danger' : 'bg-bg-raised'}`}
                            title={dayRecord?.status || 'No data'} />
                        );
                      })}
                    </div>
                  </div>
                </td>
                <td className="px-2 lg:px-6 lg:py-4 block lg:table-cell w-full">
                  <div className="flex justify-between lg:justify-center items-center gap-2 mt-1 lg:mt-0">
                    <button
                      onClick={() => markMutation.mutate([{ memberId: member._id, status: 'Present' }])}
                      disabled={markMutation.isPending}
                      className={`flex-1 lg:flex-none px-3 py-2.5 lg:py-1.5 rounded text-xs font-bold font-body uppercase tracking-widest transition-all duration-150 min-w-[80px] border
                        ${member.todayStatus === 'Present'
                          ? 'bg-accent-primary text-black border-accent-primary shadow-[0_0_12px_rgba(204,255,0,0.2)]'
                          : 'bg-transparent text-text-muted border-border hover:border-accent-primary hover:text-accent-primary'}`}
                    >
                      PRESENT
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
