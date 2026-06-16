import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Loader2, Image as ImageIcon, Trash2, Upload, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';

const Marketing = () => {
  const queryClient = useQueryClient();
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [messageText, setMessageText] = useState('We miss you! Come back to Galaxy Fitness Club and check out our latest membership plans. Renew today to keep your fitness journey going! 💪');
  const [marketingImage, setMarketingImage] = useState('');
  const [memberFilter, setMemberFilter] = useState('Active');

  const { data: members } = useQuery({
    queryKey: ['marketingMembers', memberFilter],
    queryFn: async () => { 
      const query = memberFilter === 'All' ? '' : `&status=${memberFilter}`;
      const { data } = await api.get(`/members?limit=1000${query}`); 
      return data.data; 
    },
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => { const { data } = await api.get('/settings'); return data.data; },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (data) => api.put('/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Assets updated successfully!');
    },
  });

  const sendMarketingMutation = useMutation({
    mutationFn: (payload) => api.post('/whatsapp/send-marketing', payload),
    onSuccess: (data) => {
      const successes = data.data.data.filter(r => r.success).length;
      toast.success(`Successfully sent ${successes} marketing messages!`);
      setSelectedMembers([]);
      setMarketingImage('');
    },
  });

  const handleImageUpload = (e, callback) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error('Image must be less than 5MB');
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateAsset = (key, value) => {
    saveSettingsMutation.mutate({ [key]: value });
  };

  const handleAddReminderPoster = (base64) => {
    const current = settings?.reminderPosters || [];
    saveSettingsMutation.mutate({ reminderPosters: [...current, base64] });
  };

  const handleRemoveReminderPoster = (index) => {
    const current = [...(settings?.reminderPosters || [])];
    current.splice(index, 1);
    saveSettingsMutation.mutate({ reminderPosters: current });
  };

  const toggleMember = (id) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedMembers.length === members?.length) setSelectedMembers([]);
    else setSelectedMembers(members?.map(m => m._id) || []);
  };

  const handleSend = () => {
    if (selectedMembers.length === 0) return toast.error('Select at least one member');
    if (!messageText.trim()) return toast.error('Message text cannot be empty');
    sendMarketingMutation.mutate({ memberIds: selectedMembers, messageText, mediaBase64: marketingImage });
  };

  const renderUploadBox = (label, image, onUpload, onRemove) => (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary">{label}</label>
      {image ? (
        <div className="relative w-full h-32 rounded overflow-hidden border border-border group">
          <img src={image} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <button onClick={onRemove} className="p-2 bg-danger text-white rounded-full hover:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded cursor-pointer hover:border-accent-primary transition-colors bg-bg-surface">
          <Upload className="w-5 h-5 text-text-muted mb-2" />
          <span className="text-[10px] uppercase font-bold text-text-secondary">Upload Image</span>
          <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageUpload(e, onUpload)} />
        </label>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Marketing Assets */}
      <div className="iron-card p-6">
        <h2 className="text-xs font-body font-bold text-white uppercase tracking-wider mb-6 pb-4 border-b border-border flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-accent-primary" /> Automated Message Posters
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {renderUploadBox("Welcome Poster", settings?.welcomePoster, (b64) => handleUpdateAsset('welcomePoster', b64), () => handleUpdateAsset('welcomePoster', null))}
          {renderUploadBox("Thank You (Expired) Poster", settings?.expiredPoster, (b64) => handleUpdateAsset('expiredPoster', b64), () => handleUpdateAsset('expiredPoster', null))}
          {renderUploadBox("Welcome Again (Reactivation) Poster", settings?.activationPoster, (b64) => handleUpdateAsset('activationPoster', b64), () => handleUpdateAsset('activationPoster', null))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary">Reminder Memes Pool (Shuffled randomly)</label>
            <label className="text-[10px] font-bold text-accent-primary cursor-pointer hover:text-white transition-colors flex items-center gap-1">
              <Plus className="w-3 h-3" /> ADD MEME
              <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => handleImageUpload(e, handleAddReminderPoster)} />
            </label>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {settings?.reminderPosters?.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded overflow-hidden border border-border group">
                <img src={img} alt={`Reminder ${idx}`} className="w-full h-full object-cover" />
                <button onClick={() => handleRemoveReminderPoster(idx)} className="absolute top-1 right-1 p-1.5 bg-danger text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}
            {(!settings?.reminderPosters || settings.reminderPosters.length === 0) && (
              <div className="col-span-full py-8 border-2 border-dashed border-border rounded flex flex-col items-center justify-center text-text-muted">
                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">No reminder posters uploaded yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Bulk Marketing */}
      <div className="iron-card p-6">
        <h2 className="text-xs font-body font-bold text-white uppercase tracking-wider mb-6 pb-4 border-b border-border flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-accent-primary" /> Manual Bulk Marketing
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary">Target Audience</h3>
                <select 
                  value={memberFilter} 
                  onChange={(e) => { setMemberFilter(e.target.value); setSelectedMembers([]); }} 
                  className="bg-bg-raised border border-border rounded text-xs text-white p-1 ml-2 outline-none"
                >
                  <option value="Active">Active Members</option>
                  <option value="Expired">Expired Members</option>
                  <option value="All">All Members</option>
                </select>
              </div>
              <button onClick={handleSelectAll} className="text-xs text-accent-primary hover:text-white transition-colors">
                {selectedMembers.length === members?.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {members?.length === 0 && <p className="text-sm text-text-muted">No members found.</p>}
              {members?.map(member => (
                <label key={member._id} className="flex items-center gap-3 p-3 border border-border bg-bg-surface rounded cursor-pointer hover:border-accent-primary transition-colors">
                  <input type="checkbox" checked={selectedMembers.includes(member._id)} onChange={() => toggleMember(member._id)} className="w-4 h-4 accent-accent-primary bg-transparent border-border" />
                  <div>
                    <p className="text-sm font-bold text-white">{member.fullName}</p>
                    <p className="text-[10px] font-mono text-text-muted">
                      {member.phone} • {member.status === 'Active' ? 'Active' : 'Expired'}: {new Date(member.membershipExpiryDate).toLocaleDateString()}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            {renderUploadBox("Custom Promotional Image (Optional)", marketingImage, setMarketingImage, () => setMarketingImage(''))}
            
            <div>
              <label className="block text-[10px] font-body font-semibold uppercase tracking-tag text-text-secondary mb-1.5">Marketing Message</label>
              <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} className="input-field h-32 resize-none" placeholder="Type your marketing message..." />
            </div>

            <button onClick={handleSend} disabled={sendMarketingMutation.isPending || selectedMembers.length === 0} className="btn-primary w-full flex justify-center items-center gap-2">
              {sendMarketingMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} SEND TO {selectedMembers.length} MEMBERS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketing;
