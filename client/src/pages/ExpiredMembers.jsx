import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, RotateCcw, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../lib/axios';

const ExpiredMembers = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [renewingMember, setRenewingMember] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['members', search, 'Expired', page],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 20, status: 'Expired' });
      if (search) params.set('search', search);
      const { data } = await api.get(`/members?${params}`);
      return data;
    },
  });

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => { const { data } = await api.get('/plans'); return data.data; },
  });

  const renewMutation = useMutation({
    mutationFn: (formData) => api.post(`/members/${renewingMember._id}/renew`, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['memberStats'] });
      toast.success('Member renewed successfully!');
      setShowForm(false);
      setRenewingMember(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to renew member');
    }
  });

  const handleRenew = (member) => { setRenewingMember(member); setShowForm(true); };

  const statusBadge = (status) => {
    const colors = { Active: 'bg-accent-glow text-accent-primary', Expired: 'bg-danger-surface text-danger', Inactive: 'bg-warning-surface text-warning' };
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${colors[status] || 'bg-bg-raised text-text-muted'}`}>{status}</span>;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
          <div className="flex items-center bg-bg-card border border-border rounded px-3 py-2 gap-2 w-full sm:w-72 focus-within:border-accent-primary focus-within:ring-1 focus-within:ring-accent-primary/20 transition-all">
            <Search className="w-4 h-4 text-text-muted" strokeWidth={2} />
            <input type="text" placeholder="Search expired members..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="bg-transparent border-none outline-none text-sm text-white placeholder-text-muted w-full font-body" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="iron-card p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-bg-surface">
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4">Member</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4 hidden md:table-cell">Phone</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4 hidden lg:table-cell">Previous Plan</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4 hidden lg:table-cell">Expired On</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4">Status</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12 text-text-muted"><Loader2 className="w-6 h-6 animate-spin mx-auto" strokeWidth={2} /></td></tr>
            ) : data?.data?.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-text-muted text-sm font-body uppercase tracking-widest">No expired members found</td></tr>
            ) : data?.data?.map((member) => (
                <tr key={member._id} className={`border-b border-border table-row-hover opacity-80`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded bg-bg-raised border border-border flex items-center justify-center font-mono font-bold text-xs text-text-primary flex-shrink-0">
                        {member.fullName?.[0]}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold font-body text-white`}>{member.fullName}</p>
                        <p className="text-xs font-body text-text-secondary">{member.memberId}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-sm font-body text-text-secondary hidden md:table-cell`}>{member.phone}</td>
                  <td className={`px-6 py-4 text-sm font-body text-text-secondary hidden lg:table-cell`}>{member.membershipPlan?.name || '—'}</td>
                  <td className={`px-6 py-4 text-sm font-body text-text-secondary hidden lg:table-cell`}>{member.membershipExpiryDate ? format(new Date(member.membershipExpiryDate), 'dd MMM yyyy') : '—'}</td>
                  <td className="px-6 py-4">{statusBadge(member.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => navigate(`/members/${member._id}`)} className="text-text-muted hover:text-white p-1 transition-colors"><Eye className="w-4 h-4" strokeWidth={2} /></button>
                      <button onClick={() => handleRenew(member)} className="flex items-center gap-1 text-[10px] font-bold font-body uppercase tracking-wider text-accent-primary bg-accent-glow px-3 py-1 rounded hover:bg-accent-primary hover:text-black transition-colors border border-accent-primary/20"><RotateCcw className="w-3 h-3" strokeWidth={2.5} /> Renew</button>
                    </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {data?.pagination?.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-bg-surface">
            <p className="text-[10px] text-text-muted uppercase tracking-wider">Page {data.pagination.page} of {data.pagination.pages} <span className="mx-1">•</span> {data.pagination.total} members</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page <= 1} className="p-1.5 text-text-muted hover:text-white disabled:opacity-30 border border-border rounded hover:bg-bg-raised"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => setPage(page + 1)} disabled={page >= data.pagination.pages} className="p-1.5 text-text-muted hover:text-white disabled:opacity-30 border border-border rounded hover:bg-bg-raised"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Renew Slide-over */}
      {showForm && <RenewSlideOver member={renewingMember} plans={plans} onClose={() => { setShowForm(false); setRenewingMember(null); }} onSave={(d) => renewMutation.mutate(d)} isLoading={renewMutation.isPending} />}
    </div>
  );
};

const RenewSlideOver = ({ member, plans, onClose, onSave, isLoading }) => {
  const [form, setForm] = useState({
    membershipPlan: member?.membershipPlan?._id || member?.membershipPlan || '',
    membershipStartDate: format(new Date(), 'yyyy-MM-dd'),
    paymentStatus: 'Paid',
    paymentMethod: 'Cash',
    notes: 'Renewal Payment',
  });

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const selectedPlan = plans?.find(p => p._id === form.membershipPlan);
  const planPrice = selectedPlan ? selectedPlan.price : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-bg-surface border-l border-border h-full overflow-y-auto animate-slide-in shadow-2xl">
        <div className="sticky top-0 bg-bg-surface border-b border-border px-6 py-5 flex items-center justify-between z-10">
          <h2 className="font-body font-bold text-lg text-white uppercase tracking-wider">Renew Membership</h2>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors"><X className="w-5 h-5" strokeWidth={2} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="mb-4 bg-bg-raised p-4 rounded border border-border">
            <p className="text-sm text-text-secondary font-body">Renewing for:</p>
            <p className="text-lg font-bold text-white font-body">{member?.fullName}</p>
          </div>

          <div>
            <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">New Membership Plan *</label>
            <select value={form.membershipPlan} onChange={(e) => handleChange('membershipPlan', e.target.value)} className="input-field" required>
              <option value="">Select plan</option>
              {plans?.map((p) => <option key={p._id} value={p._id}>{p.name} — ₹{p.price} ({p.durationDays} days)</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">New Start Date *</label>
            <input type="date" value={form.membershipStartDate} onChange={(e) => handleChange('membershipStartDate', e.target.value)} className="input-field" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Payment Status</label>
              <select value={form.paymentStatus} onChange={(e) => handleChange('paymentStatus', e.target.value)} className="input-field">
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Payment Method</label>
              <select value={form.paymentMethod} onChange={(e) => handleChange('paymentMethod', e.target.value)} className="input-field">
                <option value="Cash">Cash</option>
                <option value="Online">Online (UPI/Bank)</option>
                <option value="Card">Card/POS</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} className="input-field h-20 resize-none" />
          </div>
          
          <div className="bg-bg-raised p-4 border border-border rounded">
            <div className="flex justify-between items-center text-xs text-text-secondary font-body mb-2">
              <span>Plan: {selectedPlan?.name || 'None'}</span>
              <span>₹{planPrice}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-white font-body font-bold uppercase tracking-wider pt-2 border-t border-border mt-2">
              <span>Total Amount to Pay</span>
              <span className="text-accent-primary text-lg">₹{planPrice}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={isLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : null}
              CONFIRM RENEWAL
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-transparent border border-border text-white text-xs font-bold font-body uppercase tracking-widest rounded hover:bg-bg-raised transition-colors flex-1">CANCEL</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpiredMembers;
