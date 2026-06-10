import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Clock, UserX, CreditCard, Eye, CheckCircle, Bell, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../lib/axios';

const tabs = [
  { id: 'all', label: 'All Alerts', icon: Bell },
  { id: 'expiry', label: 'Membership Expiry', icon: Clock },
  { id: 'inactive', label: 'Inactive Members', icon: UserX },
  { id: 'payment', label: 'Payment Pending', icon: CreditCard },
];

const Alerts = () => {
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', activeTab],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeTab === 'expiry') params.set('type', 'expiry_7d,expiry_5d,expiry_3d,expiry_tomorrow,expired');
      if (activeTab === 'inactive') params.set('type', 'absent_3d,absent_5d,absent_10d');
      if (activeTab === 'payment') params.set('type', 'payment_pending');
      const { data } = await api.get(`/notifications?${params}`);
      return data;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => api.put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
      toast.success('All marked as read');
    },
  });

  const getSeverityColor = (type) => {
    if (type?.includes('expired') || type?.includes('10d')) return 'border-danger bg-danger/5 text-danger';
    if (type?.includes('3d') || type?.includes('5d') || type?.includes('tomorrow')) return 'border-warning bg-warning/5 text-warning';
    return 'border-accent-primary bg-accent-primary/5 text-accent-primary';
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 text-[10px] font-body font-bold uppercase tracking-wider transition-colors whitespace-nowrap border-b-2
              ${activeTab === tab.id ? 'border-accent-primary text-accent-primary' : 'border-transparent text-text-muted hover:text-white'}`}>
            <tab.icon className="w-4 h-4" strokeWidth={2} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      <div className="flex justify-end">
        <button onClick={() => markAllReadMutation.mutate()} className="btn-secondary py-1.5 px-3 text-[10px] flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5" strokeWidth={2} /> MARK ALL READ
        </button>
      </div>

      {/* Alert Cards */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-text-muted" strokeWidth={2} /></div>
        ) : data?.data?.length === 0 ? (
          <div className="iron-card p-12 text-center border-dashed">
            <Bell className="w-8 h-8 text-text-muted mx-auto mb-4" strokeWidth={2} />
            <p className="text-text-muted font-body text-xs uppercase tracking-widest">No alerts in this category</p>
          </div>
        ) : data?.data?.map((notification) => {
          const colors = getSeverityColor(notification.type);
          return (
            <div key={notification._id}
              className={`p-5 bg-bg-surface border border-border border-l-4 transition-all
                ${notification.isRead ? 'opacity-50 border-l-border' : colors.split(' ')[0]}`}>
              <div className="flex items-start gap-5">
                <div className="mt-1">
                  <div className={`w-8 h-8 rounded border flex items-center justify-center ${notification.isRead ? 'bg-bg-raised border-border text-text-muted' : colors}`}>
                    <AlertCircle className="w-4 h-4" strokeWidth={2} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                    <p className="text-sm font-body font-bold text-white uppercase tracking-wider">{notification.member?.fullName || 'Unknown'}</p>
                    <span className="text-[10px] font-mono text-text-muted">{notification.member?.phone}</span>
                  </div>
                  <p className="text-xs font-body text-text-secondary">{notification.message}</p>
                  <p className="text-[10px] font-mono text-text-muted mt-3 uppercase tracking-widest">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!notification.isRead && (
                    <button onClick={() => markReadMutation.mutate(notification._id)}
                      className="px-3 py-1.5 border border-border bg-transparent hover:bg-bg-raised hover:text-white text-[10px] font-bold font-body uppercase tracking-widest text-text-secondary rounded transition-colors">
                      DISMISS
                    </button>
                  )}
                  {notification.member?._id && (
                    <button onClick={() => navigate(`/members/${notification.member._id}`)}
                      className="p-1.5 text-text-muted hover:text-white transition-colors">
                      <Eye className="w-4 h-4" strokeWidth={2} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Alerts;
