import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, DollarSign, TrendingUp, Clock, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import api from '../lib/axios';

const Payments = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: revenueSummary } = useQuery({
    queryKey: ['revenueSummary'],
    queryFn: async () => { const { data } = await api.get('/payments/revenue/summary'); return data.data; },
  });

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', methodFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 20 });
      if (methodFilter) params.set('method', methodFilter);
      const { data } = await api.get(`/payments?${params}`);
      return data;
    },
  });

  const { data: monthlyRevenue } = useQuery({
    queryKey: ['monthlyRevenue'],
    queryFn: async () => { const { data } = await api.get('/payments/revenue/monthly'); return data.data; },
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartData = monthlyRevenue?.map((m) => ({ name: monthNames[m.month - 1], revenue: m.total })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select value={methodFilter} onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
            className="input-field w-full sm:w-auto py-2 h-[38px] min-h-0 text-sm">
            <option value="">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
          </select>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 py-2 h-[38px] min-h-0 text-sm w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4" strokeWidth={2} /> RECORD PAYMENT
        </button>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="iron-card p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded border border-border bg-bg-raised flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-accent-primary" strokeWidth={2} />
            </div>
            <p className="text-[10px] font-body uppercase tracking-tag text-text-muted">This Month's Revenue</p>
          </div>
          <p className="font-mono font-bold text-4xl text-white">₹{(revenueSummary?.thisMonth || 0).toLocaleString()}</p>
        </div>
        <div className="iron-card p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded border border-border bg-bg-raised flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-accent-primary" strokeWidth={2} />
            </div>
            <p className="text-[10px] font-body uppercase tracking-tag text-text-muted">Total Collected</p>
          </div>
          <p className="font-mono font-bold text-4xl text-white">₹{(revenueSummary?.totalCollected || 0).toLocaleString()}</p>
        </div>
        <div className="iron-card p-6 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded border border-border bg-bg-raised flex items-center justify-center">
              <Clock className="w-4 h-4 text-warning" strokeWidth={2} />
            </div>
            <p className="text-[10px] font-body uppercase tracking-tag text-text-muted">Pending Payments</p>
          </div>
          <p className="font-mono font-bold text-4xl text-white">{revenueSummary?.pendingCount || 0}</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="iron-card p-6">
        <h3 className="text-xs font-body font-bold text-white uppercase tracking-wider mb-6">Monthly Revenue Breakdown</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A3D" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#9494A8', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} dy={10} />
              <YAxis tick={{ fill: '#9494A8', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(value) => `₹${value / 1000}k`} />
              <Tooltip 
                contentStyle={{ background: '#0F0F16', border: '1px solid #2A2A3D', borderRadius: '0px', color: '#FFFFFF', fontSize: '12px', fontFamily: 'JetBrains Mono' }}
                cursor={{ fill: '#2A2A3D', opacity: 0.4 }}
                formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#CCFF00" radius={[2, 2, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Payments Table */}
      <div className="iron-card p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-bg-surface">
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4">Receipt</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4">Member</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4">Amount</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4 hidden md:table-cell">Method</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4 hidden lg:table-cell">Plan</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-text-muted" strokeWidth={2} /></td></tr>
            ) : payments?.data?.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-text-muted text-[10px] font-body uppercase tracking-widest">No payments found</td></tr>
            ) : payments?.data?.map((payment) => (
              <tr key={payment._id} className="border-b border-border table-row-hover">
                <td className="px-6 py-4 text-xs text-text-secondary font-mono">{payment.receiptNumber}</td>
                <td className="px-6 py-4 text-sm font-body font-semibold text-white">{payment.member?.fullName || '—'}</td>
                <td className="px-6 py-4 text-sm font-mono font-bold text-accent-primary">₹{payment.amount.toLocaleString()}</td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <span className="px-2 py-0.5 rounded border border-border bg-bg-raised text-[10px] font-bold text-text-secondary uppercase tracking-wider">{payment.paymentMethod}</span>
                </td>
                <td className="px-6 py-4 text-xs font-body text-text-secondary hidden lg:table-cell">{payment.plan?.name || '—'}</td>
                <td className="px-6 py-4 text-xs font-mono text-text-secondary">{format(new Date(payment.paymentDate), 'dd MMM yyyy')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal */}
      {showModal && <PaymentModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

const PaymentModal = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ member: '', amount: '', paymentDate: format(new Date(), 'yyyy-MM-dd'), paymentMethod: 'Cash', plan: '', notes: '' });

  const { data: members } = useQuery({
    queryKey: ['allMembers'],
    queryFn: async () => { const { data } = await api.get('/members?limit=500'); return data.data; },
  });

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => { const { data } = await api.get('/plans'); return data.data; },
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/payments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['revenueSummary'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyRevenue'] });
      toast.success('Payment recorded');
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ ...form, amount: parseFloat(form.amount) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative iron-card w-full max-w-md p-6 animate-slide-in shadow-2xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <h2 className="font-body font-bold text-lg text-white uppercase tracking-wider">Record Payment</h2>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors"><X className="w-5 h-5" strokeWidth={2} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Member *</label>
            <select value={form.member} onChange={(e) => setForm({ ...form, member: e.target.value })} className="input-field" required>
              <option value="">Select member</option>
              {members?.map((m) => <option key={m._id} value={m._id}>{m.fullName} ({m.memberId})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Amount (₹) *</label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input-field" required min="1" />
            </div>
            <div>
              <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Date *</label>
              <input type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} className="input-field" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Method *</label>
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="input-field" required>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Plan *</label>
              <select value={form.plan} onChange={(e) => setForm({ ...form, plan: e.target.value })} className="input-field" required>
                <option value="">Select plan</option>
                {plans?.map((p) => <option key={p._id} value={p._id}>{p.name} — ₹{p.price}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field h-20 resize-none" />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />} RECORD PAYMENT
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-transparent border border-border text-white text-xs font-bold font-body uppercase tracking-widest rounded hover:bg-bg-raised transition-colors flex-1">CANCEL</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Payments;
