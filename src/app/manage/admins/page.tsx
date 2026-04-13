'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Plus, ShieldCheck, Loader2, Mail, Shield, Save } from 'lucide-react';
import Link from 'next/link';
import MobileNav from '@/components/layout/MobileNav';
import { supabase } from '@/lib/supabase';
import { createUserAccount } from '@/app/actions/teachers';
import { RoleGuard } from '@/components/auth/RoleGuard';
import Modal from '@/components/ui/Modal';

export default function AdminsManagementPage() {
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  
  // New admin form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin')
      .order('name');
    
    if (data) setAdmins(data);
    setLoading(false);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const result = await createUserAccount(name, email, password, 'admin');

    if (result.success) {
      setModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      fetchAdmins();
    } else {
      alert(result.error);
    }
    setSubmitting(false);
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="container animate-fade-in">
        <header style={{ marginBottom: '2.5rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link href="/manage" className="glass" style={{ padding: '0.6rem', borderRadius: '50%', color: 'var(--muted-foreground)', display: 'flex' }}>
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Administrators</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>Authorative Staff</p>
          </div>
        </header>

        <section style={{ marginBottom: '5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>Admin Directory</h2>
            <button onClick={() => setModalOpen(true)} className="btn-primary" style={{ width: 'auto', padding: '0.6rem 1.25rem', borderRadius: '14px', fontSize: '0.9rem' }}>
              <Plus size={18} />
              Add Admin
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 className="animate-spin" size={32} color="var(--primary)" />
            </div>
          ) : (
            <div className="grid-responsive">
              {admins.map((admin) => (
                <div key={admin.id} className="card glass" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', margin: 0 }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--secondary), #b45309)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.2rem' }}>
                    {admin.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{admin.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                      <Mail size={14} />
                      <span>{admin.email}</span>
                    </div>
                  </div>
                </div>
              ))}
              {admins.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '2rem', gridColumn: '1 / -1' }}>No administrators added yet.</p>
              )}
            </div>
          )}
        </section>

        <Modal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          title="Add New Administrator"
        >
          <form onSubmit={handleAddAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Admin Name" 
                value={name}
                onChange={e => setName(e.target.value)}
                required 
              />
            </div>
            
            <div className="input-group">
              <label className="input-label">Email</label>
              <input 
                type="email" 
                className="input-field" 
                placeholder="admin@example.com" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input 
                type="password" 
                className="input-field" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary" style={{ marginTop: '0.5rem' }}>
              {submitting ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
              Authorize & Create Account
            </button>
          </form>
        </Modal>

        <MobileNav />
      </div>
    </RoleGuard>
  );
}
