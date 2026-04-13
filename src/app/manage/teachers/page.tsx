'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Users, Loader2, Mail, Shield, Save } from 'lucide-react';
import Link from 'next/link';
import MobileNav from '@/components/layout/MobileNav';
import { supabase } from '@/lib/supabase';
import { createTeacher } from '@/app/actions/teachers';
import { RoleGuard } from '@/components/auth/RoleGuard';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function TeachersManagementPage() {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const { showToast } = useToast();
  
  // New teacher form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'teacher')
      .order('name');
    
    if (data) setTeachers(data);
    setLoading(false);
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const result = await createTeacher(email, password, name);

    if (result.success) {
      setModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      fetchTeachers();
      showToast('Teacher account created successfully');
    } else {
      showToast(result.error || 'Failed to create teacher account', 'error');
    }
    setSubmitting(false);
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="container animate-fade-in">
        <header style={{ marginBottom: '1.5rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/manage" className="glass" style={{ padding: '0.5rem', borderRadius: '50%', color: 'var(--muted-foreground)' }}>
            <ChevronLeft size={24} />
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Teachers</h1>
        </header>

        <section style={{ marginBottom: '5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>Staff Directory</h2>
            <button onClick={() => setModalOpen(true)} className="btn-primary" style={{ width: 'auto', padding: '0.6rem 1.25rem', borderRadius: '14px', fontSize: '0.9rem' }}>
              <Plus size={18} />
              Add Teacher
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 className="animate-spin" size={32} color="var(--primary)" />
            </div>
          ) : (
            <div className="grid-responsive">
              {teachers.map((teacher) => (
                <div key={teacher.id} className="card glass" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', margin: 0 }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--primary), #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1.2rem' }}>
                    {teacher.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{teacher.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                      <Mail size={14} />
                      <span>{teacher.email}</span>
                    </div>
                  </div>
                </div>
              ))}
              {teachers.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '2rem', gridColumn: '1 / -1' }}>No teachers added yet.</p>
              )}
            </div>
          )}
        </section>

        <Modal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          title="Add New Teacher"
        >
          <form onSubmit={handleAddTeacher} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Teacher Name" 
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
                placeholder="usthad@example.com" 
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
              {submitting ? <Loader2 className="animate-spin" size={20} /> : <Shield size={20} />}
              Authorize & Create Account
            </button>
          </form>
        </Modal>

        <MobileNav />
      </div>
    </RoleGuard>
  );
}
