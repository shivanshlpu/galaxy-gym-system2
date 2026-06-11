import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building, CreditCard, Bell, MessageCircle, User, Plus, Edit, Trash2, Loader2, Check, Wifi, WifiOff, Dumbbell, Megaphone, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import useAuthStore from '../store/authStore';

const Settings = () => {
  const [activeSection, setActiveSection] = useState('gym');
  const { user } = useAuthStore();

  const sections = [
    { id: 'gym', label: 'Gym Info', icon: Building },
    { id: 'plans', label: 'Membership Plans', icon: CreditCard },
    { id: 'trainers', label: 'Trainers', icon: Dumbbell },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { id: 'account', label: 'Account', icon: User },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <div className="lg:w-56 flex-shrink-0">
        <div className="iron-card p-2 flex lg:flex-col gap-1 overflow-x-auto">
          {sections.map((s) => (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-3 px-4 py-3 text-xs font-body font-bold uppercase tracking-wider transition-colors whitespace-nowrap rounded
                ${activeSection === s.id ? 'bg-bg-raised text-accent-primary border border-border' : 'border border-transparent text-text-secondary hover:text-white hover:bg-bg-surface'}`}>
              <s.icon className="w-4 h-4" strokeWidth={2} /> {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {activeSection === 'gym' && <GymInfoSection user={user} />}
        {activeSection === 'plans' && <PlansSection />}
        {activeSection === 'trainers' && <TrainersSection />}
        { activeSection === 'reminders' && <RemindersSection /> }
        { activeSection === 'whatsapp' && <WhatsAppSection /> }
        { activeSection === 'account' && <AccountSection /> }
      </div>
    </div>
  );
};

const GymInfoSection = ({ user }) => (
  <div className="iron-card p-6">
    <h2 className="text-xs font-body font-bold text-white uppercase tracking-wider mb-6 pb-4 border-b border-border">Gym Information</h2>
    <div className="space-y-5 max-w-md">
      <div>
        <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Gym Name</label>
        <input defaultValue={user?.gymName || 'GymOS Fitness Center'} className="input-field" />
      </div>
      <div>
        <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Contact Phone</label>
        <input placeholder="Gym contact number" className="input-field" />
      </div>
      <div>
        <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Address</label>
        <textarea placeholder="Gym address" className="input-field h-24 resize-none" />
      </div>
      <button className="btn-primary mt-4">SAVE CHANGES</button>
    </div>
  </div>
);

const PlansSection = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [form, setForm] = useState({ name: '', durationDays: '', price: '', description: '' });


  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => { const { data } = await api.get('/plans'); return data.data; },
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editPlan ? api.put(`/plans/${editPlan._id}`, data) : api.post('/plans', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success(editPlan ? 'Plan updated' : 'Plan created');
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/plans/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['plans'] }); toast.success('Plan deactivated'); },
  });

  const resetForm = () => { setShowForm(false); setEditPlan(null); setForm({ name: '', durationDays: '', price: '', description: '' }); };
  const startEdit = (plan) => { setEditPlan(plan); setForm({ name: plan.name, durationDays: plan.durationDays, price: plan.price, description: plan.description || '' }); setShowForm(true); };

  return (
    <div className="iron-card p-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <h2 className="text-xs font-body font-bold text-white uppercase tracking-wider">Membership Plans</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-[10px] flex items-center gap-2 py-1.5 px-3">
          <Plus className="w-3.5 h-3.5" strokeWidth={2} /> ADD PLAN
        </button>
      </div>

      <div className="space-y-3 mb-6">
        {plans?.map((plan) => (
          <div key={plan._id} className="flex items-center justify-between py-4 px-5 bg-bg-surface border border-border table-row-hover transition-colors">
            <div>
              <p className="text-sm font-body font-bold text-white uppercase tracking-wider">{plan.name}</p>
              <p className="text-[10px] font-mono text-text-secondary mt-1 tracking-widest">{plan.durationDays} DAYS • {plan.description?.toUpperCase() || ''}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono font-bold text-xl text-accent-primary">₹{plan.price}</span>
              <button onClick={() => startEdit(plan)} className="text-text-muted hover:text-white transition-colors p-1.5"><Edit className="w-4 h-4" strokeWidth={2} /></button>
              <button onClick={() => deleteMutation.mutate(plan._id)} className="text-text-muted hover:text-danger transition-colors p-1.5"><Trash2 className="w-4 h-4" strokeWidth={2} /></button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="border-t border-border pt-6 space-y-5 max-w-md">
          <h3 className="text-[10px] font-body font-bold text-white uppercase tracking-wider">{editPlan ? 'Edit Plan' : 'New Plan'}</h3>
          <input placeholder="PLAN NAME" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="DURATION (DAYS)" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} className="input-field" />
            <input type="number" placeholder="PRICE (₹)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" />
          </div>
          <input placeholder="DESCRIPTION" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" />
          

          <div className="flex gap-3 pt-2">
            <button onClick={() => saveMutation.mutate({ ...form, durationDays: parseInt(form.durationDays), price: parseFloat(form.price) })}
              disabled={saveMutation.isPending} className="btn-primary flex-1 flex justify-center items-center gap-2">
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} SAVE
            </button>
            <button onClick={resetForm} className="px-4 py-2 bg-transparent border border-border text-white text-xs font-bold font-body uppercase tracking-widest rounded hover:bg-bg-raised transition-colors flex-1">CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
};

const RemindersSection = () => {
  const queryClient = useQueryClient();
  const [cronTime, setCronTime] = useState('08:00');
  
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => { 
      const { data } = await api.get('/settings'); 
      if (data.data?.cronTime) setCronTime(data.data.cronTime);
      return data.data; 
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data) => api.put('/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Reminder time updated! Cron job rescheduled.');
    },
  });

  const handleSave = () => {
    saveMutation.mutate({ cronTime });
  };

  return (
    <div className="iron-card p-6">
      <h2 className="text-xs font-body font-bold text-white uppercase tracking-wider mb-6 pb-4 border-b border-border">Reminder Settings</h2>
      
      <div className="bg-bg-raised border border-border border-l-4 border-l-accent-primary p-4 mb-6">
        <p className="text-xs font-body text-text-secondary">
          WhatsApp Reminders are automatically sent daily starting from <strong>5 days before</strong> a member's expiry date.
        </p>
      </div>

      <div className="space-y-4 max-w-sm">
        <div>
          <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Daily Execution Time</label>
          <input 
            type="time" 
            value={cronTime} 
            onChange={(e) => setCronTime(e.target.value)} 
            className="input-field" 
          />
        </div>
      </div>

      <button 
        onClick={handleSave} 
        disabled={saveMutation.isPending}
        className="btn-primary mt-6 flex justify-center items-center gap-2"
      >
        {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        SAVE SETTINGS
      </button>
    </div>
  );
};

const WhatsAppSection = () => {
  const queryClient = useQueryClient();
  const { data: status } = useQuery({
    queryKey: ['whatsappStatus'],
    queryFn: async () => { const { data } = await api.get('/whatsapp/status'); return data.data; },
    refetchInterval: (query) => (query?.state?.data?.connected ? 30000 : 3000), // poll every 3s if disconnected
  });

  const connectMutation = useMutation({
    mutationFn: async () => await api.post('/whatsapp/connect'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsappStatus'] });
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => await api.post('/whatsapp/disconnect'),
    onSuccess: () => {
      toast.success('Disconnected! Waiting for new QR...');
      queryClient.invalidateQueries({ queryKey: ['whatsappStatus'] });
    }
  });

  const [testForm, setTestForm] = useState({ phone: '', messageText: '', template: 'Custom' });
  const [imageFile, setImageFile] = useState(null);
  
  const testMutation = useMutation({
    mutationFn: async () => {
      if (!testForm.phone || !testForm.messageText) throw new Error('Phone and message are required');
      const formData = new FormData();
      formData.append('phone', testForm.phone);
      formData.append('messageText', testForm.messageText);
      if (imageFile) formData.append('image', imageFile);
      
      const { data } = await api.post('/whatsapp/test', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      toast.success('Test message sent successfully!');
      setTestForm({ ...testForm, messageText: '', template: 'Custom' });
      setImageFile(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || err.message || 'Failed to send test message');
    }
  });

  const handleTemplateChange = (e) => {
    const template = e.target.value;
    let text = '';
    if (template === 'Welcome') text = '*Welcome to Galaxy Fitness Club!* 🏋️‍♂️\n\nYour membership has been activated. Let\'s get those gains! 💪';
    else if (template === 'Reminder') text = 'Hi! Your membership is expiring soon. Please renew to continue your fitness journey! 🏃‍♂️';
    
    setTestForm({ ...testForm, template, messageText: text });
  };

  return (
    <div className="space-y-6">
      <div className="iron-card p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <h2 className="text-xs font-body font-bold text-white uppercase tracking-wider">WhatsApp Integration</h2>
          {status?.connected && (
            <button onClick={() => disconnectMutation.mutate()} disabled={disconnectMutation.isPending} className="px-3 py-1 bg-danger/10 border border-danger text-danger hover:bg-danger hover:text-white transition-colors text-[10px] font-bold font-body uppercase tracking-widest rounded flex items-center gap-2">
              {disconnectMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <WifiOff className="w-3 h-3" />}
              DISCONNECT
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-3 mb-5">
          {status?.connected ? (
            <><Wifi className="w-5 h-5 text-accent-primary" strokeWidth={2} /><span className="text-accent-primary font-mono font-bold text-sm tracking-widest uppercase">Connected</span></>
          ) : (
            <><WifiOff className="w-5 h-5 text-danger" strokeWidth={2} /><span className="text-danger font-mono font-bold text-sm tracking-widest uppercase">Disconnected</span></>
          )}
        </div>
        <p className="text-[10px] font-body uppercase tracking-tag text-text-secondary mb-5">
          {status?.connected ? 'WhatsApp service is active and connected to your device.' : (status?.isIdle ? 'WhatsApp service is idle. Click connect to generate a QR code.' : 'WhatsApp service requires authentication. Please scan the QR code below.')}
        </p>

        {!status?.connected && (
          <div className="bg-bg-raised border border-border flex flex-col items-center justify-center p-6 mb-6 rounded">
            {status?.isIdle ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <WifiOff className="w-8 h-8 text-text-muted mb-2" />
                <p className="text-xs text-text-secondary font-mono tracking-widest uppercase">Service is Idle</p>
                <button 
                  onClick={() => connectMutation.mutate()} 
                  disabled={connectMutation.isPending}
                  className="btn-primary mt-2 flex items-center gap-2"
                >
                  {connectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                  {connectMutation.isPending ? 'CONNECTING...' : 'CONNECT WHATSAPP'}
                </button>
              </div>
            ) : status?.qr ? (
              <div className="flex flex-col items-center">
                <p className="text-xs font-bold text-white mb-4 uppercase tracking-wider">Scan to Connect</p>
                <div className="bg-white p-2 rounded">
                  <img src={status.qr} alt="WhatsApp QR Code" className="w-48 h-48" />
                </div>
                <p className="text-[10px] text-text-muted mt-4">Open WhatsApp on your phone &gt; Linked Devices &gt; Link a Device</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-text-muted py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs font-mono uppercase tracking-widest">Generating QR Code...</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="iron-card p-6">
        <h2 className="text-xs font-body font-bold text-white uppercase tracking-wider mb-6 pb-4 border-b border-border">Test WhatsApp Notifications</h2>
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Test Phone Number (with Country Code)</label>
            <input placeholder="e.g. 919876543210" value={testForm.phone} onChange={(e) => setTestForm({ ...testForm, phone: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Message Template</label>
            <select value={testForm.template} onChange={handleTemplateChange} className="input-field">
              <option value="Custom">Custom Message</option>
              <option value="Welcome">Welcome Message Test</option>
              <option value="Reminder">Expiry Reminder Test</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Message Text</label>
            <textarea placeholder="Type your message..." value={testForm.messageText} onChange={(e) => setTestForm({ ...testForm, messageText: e.target.value })} className="input-field h-32 resize-none" />
          </div>
          <div>
            <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Attach Image (Optional, PNG/JPG)</label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer bg-bg-raised border border-border px-4 py-2 rounded text-xs font-body font-bold text-white hover:border-accent-primary transition-colors flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                {imageFile ? 'CHANGE IMAGE' : 'SELECT IMAGE'}
                <input type="file" accept="image/png, image/jpeg, image/jpg" className="hidden" onChange={(e) => {
                  if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
                }} />
              </label>
              {imageFile && <span className="text-xs text-accent-primary font-mono truncate max-w-[200px]">{imageFile.name}</span>}
            </div>
            <p className="text-[10px] text-text-muted mt-2">Maximum file size: 5MB.</p>
          </div>
          <button 
            onClick={() => testMutation.mutate()} 
            disabled={testMutation.isPending || !status?.connected}
            className="btn-primary mt-4 flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {testMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} /> : <MessageCircle className="w-4 h-4" />}
            SEND TEST MESSAGE
          </button>
        </div>
      </div>
    </div>
  );
};

const AccountSection = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const mutation = useMutation({
    mutationFn: (data) => api.put('/auth/change-password', data),
    onSuccess: () => { toast.success('Password changed'); setForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return toast.error('Passwords do not match');
    mutation.mutate({ currentPassword: form.currentPassword, newPassword: form.newPassword });
  };

  return (
    <div className="iron-card p-6">
      <h2 className="text-xs font-body font-bold text-white uppercase tracking-wider mb-6 pb-4 border-b border-border">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
        <div>
          <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Current Password</label>
          <input type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} className="input-field" required />
        </div>
        <div>
          <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">New Password</label>
          <input type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} className="input-field" required minLength={6} />
        </div>
        <div>
          <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Confirm New Password</label>
          <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} className="input-field" required />
        </div>
        <button type="submit" disabled={mutation.isPending} className="btn-primary flex items-center justify-center gap-2 mt-6 w-full sm:w-auto">
          {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />} UPDATE PASSWORD
        </button>
      </form>
    </div>
  );
};

const TrainersSection = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editTrainer, setEditTrainer] = useState(null);
  const [form, setForm] = useState({ name: '', experienceYears: '', price: '', dietCharge: '' });

  const { data: trainers } = useQuery({
    queryKey: ['trainers'],
    queryFn: async () => { const { data } = await api.get('/trainers/all'); return data.data; },
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editTrainer ? api.put(`/trainers/${editTrainer._id}`, data) : api.post('/trainers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainers'] });
      toast.success(editTrainer ? 'Trainer updated' : 'Trainer created');
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/trainers/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trainers'] }); toast.success('Trainer removed'); },
  });

  const resetForm = () => { setShowForm(false); setEditTrainer(null); setForm({ name: '', experienceYears: '', price: '', dietCharge: '' }); };
  const startEdit = (trainer) => { setEditTrainer(trainer); setForm({ name: trainer.name, experienceYears: trainer.experienceYears, price: trainer.price, dietCharge: trainer.dietCharge }); setShowForm(true); };

  return (
    <div className="iron-card p-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <h2 className="text-xs font-body font-bold text-white uppercase tracking-wider">Trainers</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-[10px] flex items-center gap-2 py-1.5 px-3">
          <Plus className="w-3.5 h-3.5" strokeWidth={2} /> ADD TRAINER
        </button>
      </div>

      <div className="space-y-3 mb-6">
        {trainers?.map((trainer) => (
          <div key={trainer._id} className="flex items-center justify-between py-4 px-5 bg-bg-surface border border-border table-row-hover transition-colors">
            <div>
              <p className="text-sm font-body font-bold text-white uppercase tracking-wider">{trainer.name}</p>
              <p className="text-[10px] font-mono text-text-secondary mt-1 tracking-widest">{trainer.experienceYears} YRS EXP • DIET: ₹{trainer.dietCharge}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-mono font-bold text-xl text-accent-primary">₹{trainer.price}</span>
              <button onClick={() => startEdit(trainer)} className="text-text-muted hover:text-white transition-colors p-1.5"><Edit className="w-4 h-4" strokeWidth={2} /></button>
              <button onClick={() => deleteMutation.mutate(trainer._id)} className="text-text-muted hover:text-danger transition-colors p-1.5"><Trash2 className="w-4 h-4" strokeWidth={2} /></button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="border-t border-border pt-6 space-y-5 max-w-md">
          <h3 className="text-[10px] font-body font-bold text-white uppercase tracking-wider">{editTrainer ? 'Edit Trainer' : 'New Trainer'}</h3>
          <input placeholder="TRAINER NAME" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" placeholder="EXPERIENCE (YRS)" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} className="input-field" />
            <input type="number" placeholder="CHARGE (₹)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input-field" />
          </div>
          <input type="number" placeholder="DIET CHARGE (₹)" value={form.dietCharge} onChange={(e) => setForm({ ...form, dietCharge: e.target.value })} className="input-field" />
          <div className="flex gap-3 pt-2">
            <button onClick={() => saveMutation.mutate({ ...form, experienceYears: parseInt(form.experienceYears), price: parseFloat(form.price), dietCharge: parseFloat(form.dietCharge) })}
              disabled={saveMutation.isPending} className="btn-primary flex-1 flex justify-center items-center gap-2">
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} SAVE
            </button>
            <button onClick={resetForm} className="px-4 py-2 bg-transparent border border-border text-white text-xs font-bold font-body uppercase tracking-widest rounded hover:bg-bg-raised transition-colors flex-1">CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
};



export default Settings;
