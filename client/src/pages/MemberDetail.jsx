import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, CreditCard, Clock, User } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import api from '../lib/axios';
import { useState } from 'react';

const MemberDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: memberData, isLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: async () => { const { data } = await api.get(`/members/${id}`); return data.data; },
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['memberAttendance', id],
    queryFn: async () => { const { data } = await api.get(`/attendance/member/${id}`); return data.data; },
    enabled: activeTab === 'attendance',
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['memberPayments', id],
    queryFn: async () => { const { data } = await api.get(`/payments/member/${id}`); return data.data; },
    enabled: activeTab === 'payments',
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="loading-dot w-1.5 h-1.5 rounded-full bg-accent-primary inline-block mx-1" /><div className="loading-dot w-1.5 h-1.5 rounded-full bg-accent-primary inline-block mx-1" /><div className="loading-dot w-1.5 h-1.5 rounded-full bg-accent-primary inline-block mx-1" /></div>;
  if (!memberData) return <div className="text-center py-12 text-text-muted text-[10px] uppercase tracking-widest font-body font-bold">Member not found</div>;

  const member = memberData;
  const daysLeft = member.membershipExpiryDate ? differenceInDays(new Date(member.membershipExpiryDate), new Date()) : null;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'attendance', label: 'Attendance History' },
    { id: 'payments', label: 'Payment History' },
  ];

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/members')} className="flex items-center gap-2 text-text-muted hover:text-white text-xs font-body font-bold uppercase tracking-wider transition-colors">
        <ArrowLeft className="w-4 h-4" /> BACK TO MEMBERS
      </button>

      {/* Profile Header */}
      <div className="iron-card p-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-20 h-20 bg-bg-raised border border-border flex items-center justify-center text-white font-mono font-bold text-2xl">
            {member.fullName?.[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h2 className="font-body font-bold text-2xl text-white uppercase tracking-wider">{member.fullName}</h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${member.status === 'Active' ? 'bg-accent-glow text-accent-primary' : 'bg-danger-surface text-danger'}`}>
                {member.status}
              </span>
            </div>
            <p className="text-text-muted text-xs font-mono uppercase tracking-widest mb-4">{member.memberId}</p>
            <div className="flex flex-wrap gap-6 text-xs text-text-secondary font-body">
              {member.phone && <span className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{member.phone}</span>}
              {member.email && <span className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{member.email}</span>}
              {member.gender && <span className="flex items-center gap-2"><User className="w-3.5 h-3.5" />{member.gender}, {member.age}</span>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-tag text-text-muted mb-1">Days Remaining</p>
              <p className={`font-mono font-bold text-3xl leading-none ${daysLeft > 30 ? 'text-white' : daysLeft > 7 ? 'text-warning' : 'text-danger'}`}>
                {daysLeft !== null ? (daysLeft > 0 ? daysLeft : 0) : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-border">
          <div className="text-center">
            <p className="font-mono font-bold text-2xl text-white mb-1">{member.stats?.totalAttendance || 0}</p>
            <p className="text-text-muted font-body font-semibold text-[10px] uppercase tracking-tag">Total Attendance</p>
          </div>
          <div className="text-center border-l border-r border-border">
            <p className="font-mono font-bold text-2xl text-white mb-1">₹{(member.stats?.totalPayments || 0).toLocaleString()}</p>
            <p className="text-text-muted font-body font-semibold text-[10px] uppercase tracking-tag">Total Paid</p>
          </div>
          <div className="text-center">
            <p className="font-mono font-bold text-2xl text-white mb-1">{member.membershipPlan?.name || '—'}</p>
            <p className="text-text-muted font-body font-semibold text-[10px] uppercase tracking-tag">Current Plan</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-[10px] font-body font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === tab.id ? 'border-accent-primary text-accent-primary' : 'border-transparent text-text-muted hover:text-white'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="iron-card p-0 overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-body font-bold text-sm text-white uppercase tracking-wider">Member Details</h3>
          </div>
          <div className="flex flex-col">
            {[
              { label: 'Joining Date', value: member.joiningDate ? format(new Date(member.joiningDate), 'dd MMM yyyy') : '—' },
              { label: 'Start Date', value: member.membershipStartDate ? format(new Date(member.membershipStartDate), 'dd MMM yyyy') : '—' },
              { label: 'Expiry Date', value: member.membershipExpiryDate ? format(new Date(member.membershipExpiryDate), 'dd MMM yyyy') : '—' },
              { label: 'Payment Status', value: member.paymentStatus },
              { label: 'Address', value: member.address || '—' },
              { label: 'WhatsApp Opt-in', value: member.whatsappOptIn ? 'Yes' : 'No' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between p-5 border-b border-border last:border-b-0 table-row-hover">
                <span className="text-text-secondary font-body font-semibold text-xs uppercase tracking-wider">{item.label}</span>
                <span className="text-white font-mono font-bold text-sm">{item.value}</span>
              </div>
            ))}
          </div>
          {member.notes && <div className="p-5 bg-warning-surface border-t border-warning/30"><p className="text-warning font-body font-bold text-xs uppercase tracking-wider">NOTES: {member.notes}</p></div>}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="iron-card p-0 overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-body font-bold text-sm text-white uppercase tracking-wider">Attendance History</h3>
          </div>
          {attendanceData?.length > 0 ? (
            <div className="flex flex-col">
              {attendanceData.map((record) => (
                <div key={record._id} className="flex items-center justify-between p-5 border-b border-border last:border-b-0 table-row-hover">
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">{format(new Date(record.date), 'EEE, dd MMM yyyy')}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${record.status === 'Present' ? 'bg-accent-glow text-accent-primary' : 'bg-danger-surface text-danger'}`}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-muted font-body font-bold text-[10px] uppercase tracking-widest text-center py-8">No attendance records found</p>
          )}
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="iron-card p-0 overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="font-body font-bold text-sm text-white uppercase tracking-wider">Payment History</h3>
          </div>
          {paymentsData?.length > 0 ? (
            <div className="flex flex-col">
              {paymentsData.map((payment) => (
                <div key={payment._id} className="flex items-center justify-between p-5 border-b border-border last:border-b-0 table-row-hover">
                  <div>
                    <p className="text-sm font-mono font-bold text-white mb-1">₹{payment.amount.toLocaleString()} <span className="text-text-muted font-body text-xs font-normal ml-2">via {payment.paymentMethod}</span></p>
                    <p className="text-[10px] font-body font-bold text-text-secondary uppercase tracking-widest">{payment.receiptNumber} <span className="mx-2">•</span> {payment.plan?.name || ''}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">{format(new Date(payment.paymentDate), 'dd MMM yyyy')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-muted font-body font-bold text-[10px] uppercase tracking-widest text-center py-8">No payment records found</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MemberDetail;
