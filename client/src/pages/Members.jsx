import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import api from '../lib/axios';

const Members = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setEditingMember(null);
      setShowForm(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['members', search, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/members?${params}`);
      return data;
    },
  });

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => { const { data } = await api.get('/plans'); return data.data; },
  });

  const { data: trainers } = useQuery({
    queryKey: ['trainers'],
    queryFn: async () => { const { data } = await api.get('/trainers'); return data.data; },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/members/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['members'] }); toast.success('Member deleted'); },
  });

  const saveMutation = useMutation({
    mutationFn: (formData) => editingMember ? api.put(`/members/${editingMember._id}`, formData) : api.post('/members', formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['memberStats'] });
      toast.success(editingMember ? 'Member updated' : 'Member added');
      setShowForm(false);
      setEditingMember(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to save member');
    },
  });

  const handleEdit = (member) => { setEditingMember(member); setShowForm(true); };
  const handleDelete = (id) => { if (confirm('Delete this member?')) deleteMutation.mutate(id); };

  const getDaysLeftBadge = (expiryDate) => {
    if (!expiryDate) return null;
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-danger-surface text-danger">EXPIRED</span>;
    if (days <= 6) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-warning-surface text-warning">{days}d</span>;
    if (days <= 30) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-accent-glow text-accent-primary">{days}d</span>;
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-bg-raised text-text-secondary">{days}d</span>;
  };

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
            <input type="text" placeholder="Search by name or phone..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="bg-transparent border-none outline-none text-sm text-white placeholder-text-muted w-full font-body" />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field w-full sm:w-auto py-2 h-[38px] min-h-0 text-sm">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <button onClick={() => { setEditingMember(null); setShowForm(true); }} className="btn-primary flex items-center gap-2 py-2 h-[38px] min-h-0 text-sm w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4" strokeWidth={2} /> ADD MEMBER
        </button>
      </div>

      {/* Table */}
      <div className="iron-card p-0 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-bg-surface">
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4">Member</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4 hidden md:table-cell">Phone</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4 hidden lg:table-cell">Plan</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4 hidden lg:table-cell">Expiry</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4">Days Left</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4">Status</th>
              <th className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-muted px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-12 text-text-muted"><Loader2 className="w-6 h-6 animate-spin mx-auto" strokeWidth={2} /></td></tr>
            ) : data?.data?.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-text-muted text-sm font-body uppercase tracking-widest">No members found</td></tr>
            ) : data?.data?.map((member) => {
              const isExpired = member.status === 'Expired';
              return (
                <tr key={member._id} className={`border-b border-border table-row-hover ${isExpired ? 'opacity-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded bg-bg-raised border border-border flex items-center justify-center font-mono font-bold text-xs text-text-primary flex-shrink-0">
                        {member.fullName?.[0]}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold font-body text-white ${isExpired ? 'line-through text-text-muted' : ''}`}>{member.fullName}</p>
                        <p className="text-xs font-body text-text-secondary">{member.memberId}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-sm font-body text-text-secondary hidden md:table-cell ${isExpired ? 'line-through' : ''}`}>{member.phone}</td>
                  <td className={`px-6 py-4 text-sm font-body text-text-secondary hidden lg:table-cell ${isExpired ? 'line-through' : ''}`}>{member.membershipPlan?.name || '—'}</td>
                  <td className={`px-6 py-4 text-sm font-body text-text-secondary hidden lg:table-cell ${isExpired ? 'line-through' : ''}`}>{member.membershipExpiryDate ? format(new Date(member.membershipExpiryDate), 'dd MMM yyyy') : '—'}</td>
                  <td className="px-6 py-4">{getDaysLeftBadge(member.membershipExpiryDate)}</td>
                  <td className="px-6 py-4">{statusBadge(member.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => navigate(`/members/${member._id}`)} className="text-text-muted hover:text-white p-1 transition-colors"><Eye className="w-4 h-4" strokeWidth={2} /></button>
                      <button onClick={() => handleEdit(member)} className="text-text-muted hover:text-white p-1 transition-colors"><Edit className="w-4 h-4" strokeWidth={2} /></button>
                      <button onClick={() => handleDelete(member._id)} className="text-text-muted hover:text-danger p-1 transition-colors"><Trash2 className="w-4 h-4" strokeWidth={2} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
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

      {/* Add/Edit Slide-over */}
      {showForm && <MemberSlideOver member={editingMember} plans={plans} trainers={trainers} onClose={() => { setShowForm(false); setEditingMember(null); }} onSave={(d) => saveMutation.mutate(d)} isLoading={saveMutation.isPending} />}
    </div>
  );
};

const MemberSlideOver = ({ member, plans, trainers, onClose, onSave, isLoading }) => {
  const [form, setForm] = useState({
    fullName: member?.fullName || '',
    phone: member?.phone || '',
    email: member?.email || '',
    address: member?.address || '',
    gender: member?.gender || 'Male',
    age: member?.age || '',
    membershipPlan: member?.membershipPlan?._id || member?.membershipPlan || '',
    joiningDate: member?.joiningDate ? format(new Date(member.joiningDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    membershipStartDate: member?.membershipStartDate ? format(new Date(member.membershipStartDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    paymentStatus: member?.paymentStatus || 'Pending',
    paymentMethod: member?.paymentMethod || 'Cash',
    trainerNeeded: member?.trainerNeeded || false,
    trainer: member?.trainer?._id || member?.trainer || '',
    notes: member?.notes || '',
  });

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, age: form.age ? parseInt(form.age) : undefined });
  };

  const selectedPlan = plans?.find(p => p._id === form.membershipPlan);
  const selectedTrainer = trainers?.find(t => t._id === form.trainer);
  
  const planPrice = selectedPlan ? selectedPlan.price : 0;
  const trainerPrice = (form.trainerNeeded && selectedTrainer) ? selectedTrainer.price : 0;
  const dietPrice = (form.trainerNeeded && selectedTrainer) ? selectedTrainer.dietCharge : 0;
  const totalAmount = planPrice + trainerPrice + dietPrice;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-bg-surface border-l border-border h-full overflow-y-auto animate-slide-in shadow-2xl">
        <div className="sticky top-0 bg-bg-surface border-b border-border px-6 py-5 flex items-center justify-between z-10">
          <h2 className="font-body font-bold text-lg text-white uppercase tracking-wider">{member ? 'Edit Member' : 'New Member'}</h2>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors"><X className="w-5 h-5" strokeWidth={2} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Full Name *</label>
            <input value={form.fullName} onChange={(e) => handleChange('fullName', e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Phone *</label>
            <input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Email</label>
            <input value={form.email} onChange={(e) => handleChange('email', e.target.value)} className="input-field" type="email" />
          </div>
          <div>
            <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Address</label>
            <input value={form.address} onChange={(e) => handleChange('address', e.target.value)} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Gender</label>
              <div className="flex gap-3">
                {['Male', 'Female', 'Other'].map((g) => (
                  <label key={g} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="gender" value={g} checked={form.gender === g} onChange={() => handleChange('gender', g)}
                      className="accent-accent-primary bg-bg-card border-border" />
                    <span className="text-xs text-text-secondary font-body">{g}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Age</label>
              <input value={form.age} onChange={(e) => handleChange('age', e.target.value)} className="input-field" type="number" min="10" max="100" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Membership Plan *</label>
            <select value={form.membershipPlan} onChange={(e) => handleChange('membershipPlan', e.target.value)} className="input-field" required>
              <option value="">Select plan</option>
              {plans?.map((p) => <option key={p._id} value={p._id}>{p.name} — ₹{p.price} ({p.durationDays} days)</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Joining Date *</label>
              <input type="date" value={form.joiningDate} onChange={(e) => handleChange('joiningDate', e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Start Date *</label>
              <input type="date" value={form.membershipStartDate} onChange={(e) => handleChange('membershipStartDate', e.target.value)} className="input-field" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Payment Status</label>
              <select value={form.paymentStatus} onChange={(e) => handleChange('paymentStatus', e.target.value)} className="input-field">
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
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
          
          <div>
            <label className="flex items-center gap-3 cursor-pointer mb-4 p-3 bg-bg-raised border border-border rounded hover:border-accent-primary transition-colors">
              <input type="checkbox" checked={form.trainerNeeded} onChange={(e) => handleChange('trainerNeeded', e.target.checked)} className="w-4 h-4 accent-accent-primary" />
              <span className="text-xs font-body font-bold text-white uppercase tracking-wider">Assign Personal Trainer</span>
            </label>
            {form.trainerNeeded && (
              <div className="animate-slide-in">
                <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Select Trainer *</label>
                <select value={form.trainer} onChange={(e) => handleChange('trainer', e.target.value)} className="input-field" required={form.trainerNeeded}>
                  <option value="">Choose a trainer...</option>
                  {trainers?.map((t) => (
                    <option key={t._id} value={t._id}>{t.name} — Exp: {t.experienceYears}y — Charge: ₹{t.price} (+ ₹{t.dietCharge} Diet)</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="bg-bg-raised p-4 border border-border rounded">
            <div className="flex justify-between items-center text-xs text-text-secondary font-body mb-2">
              <span>Plan: {selectedPlan?.name || 'None'}</span>
              <span>₹{planPrice}</span>
            </div>
            {form.trainerNeeded && selectedTrainer && (
              <>
                <div className="flex justify-between items-center text-xs text-text-secondary font-body mb-2">
                  <span>Trainer: {selectedTrainer.name}</span>
                  <span>₹{trainerPrice}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-text-secondary font-body mb-2 pb-2 border-b border-border">
                  <span>Diet Plan</span>
                  <span>₹{dietPrice}</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center text-sm text-white font-body font-bold uppercase tracking-wider pt-2 border-t border-border mt-2">
              <span>Total Invoice Amount</span>
              <span className="text-accent-primary text-lg">₹{totalAmount}</span>
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={isLoading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : null}
              {member ? 'UPDATE' : 'SAVE'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-transparent border border-border text-white text-xs font-bold font-body uppercase tracking-widest rounded hover:bg-bg-raised transition-colors flex-1">CANCEL</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Members;
