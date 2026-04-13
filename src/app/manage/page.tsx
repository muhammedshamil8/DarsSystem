'use client';

import { useState, useEffect } from 'react';
import { Users, GraduationCap, BookOpen, ChevronLeft, Plus, Trash2, Loader2, ShieldCheck, Save, ClipboardList, FileText } from 'lucide-react';
import Link from 'next/link';
import MobileNav from '@/components/layout/MobileNav';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/ui/Modal';

export default function ManagePage() {
  const [activeTab, setActiveTab] = useState<'batches' | 'subjects'>('batches');
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: batchesData } = await supabase.from('batches').select('*').order('name');
    const { data: subjectsData } = await supabase.from('subjects').select('*').order('name');
    if (batchesData) setBatches(batchesData);
    if (subjectsData) setSubjects(subjectsData);
    setLoading(false);
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { data: dars } = await supabase.from('dars').select('id').limit(1).single();
    const { error } = await supabase.from('batches').insert({ name: newName, dars_id: dars?.id });
    if (error) alert(error.message);
    else { setBatchModalOpen(false); setNewName(''); fetchData(); }
    setSubmitting(false);
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { data: dars } = await supabase.from('dars').select('id').limit(1).single();
    const { error } = await supabase.from('subjects').insert({ name: newName, dars_id: dars?.id });
    if (error) alert(error.message);
    else { setSubjectModalOpen(false); setNewName(''); fetchData(); }
    setSubmitting(false);
  };

  const deleteBatch = async (id: string) => {
    if (confirm('Are you sure? This will delete all sessions for this batch.')) {
      await supabase.from('batches').delete().eq('id', id);
      fetchData();
    }
  };

  const deleteSubject = async (id: string) => {
    if (confirm('Are you sure?')) {
      await supabase.from('subjects').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="container animate-fade-in">
        <header style={{ marginBottom: '2.5rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link href="/" className="glass" style={{ padding: '0.6rem', borderRadius: '50%', color: 'var(--muted-foreground)', display: 'flex' }}>
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Management</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>Institution Configuration</p>
          </div>
        </header>

        <div className="grid-responsive" style={{ marginBottom: '3rem' }}>
          <Link href="/manage/teachers" className="card glass" style={{ margin: 0, padding: '1.5rem', textAlign: 'center' }}>
            <Users size={32} color="var(--primary)" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Usthad & Staff</p>
          </Link>
          <Link href="/manage/students" className="card glass" style={{ margin: 0, padding: '1.5rem', textAlign: 'center' }}>
            <GraduationCap size={32} color="var(--primary)" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Students</p>
          </Link>
          <Link href="/manage/classes" className="card glass" style={{ margin: 0, padding: '1.5rem', textAlign: 'center' }}>
            <ClipboardList size={32} color="var(--primary)" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Schedule</p>
          </Link>
          <Link href="/manage/exams" className="card glass" style={{ margin: 0, padding: '1.5rem', textAlign: 'center' }}>
            <FileText size={32} color="var(--secondary)" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Exams</p>
          </Link>
          <Link href="/manage/admins" className="card glass" style={{ margin: 0, padding: '1.5rem', textAlign: 'center' }}>
            <ShieldCheck size={32} color="#6366f1" style={{ margin: '0 auto 0.75rem' }} />
            <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>Administrators</p>
          </Link>
        </div>

        <div className="glass" style={{ display: 'flex', padding: '0.5rem', borderRadius: '18px', marginBottom: '2rem' }}>
          {['batches', 'subjects'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              style={{ flex: 1, background: activeTab === tab ? 'var(--primary)' : 'transparent', color: activeTab === tab ? 'white' : 'var(--muted-foreground)', padding: '0.75rem', borderRadius: '12px', border: 'none', fontWeight: 700, transition: 'all 0.2s' }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader2 className="animate-spin" size={40} color="var(--primary)" />
          </div>
        ) : (
          <div className="animate-fade-in">
            {activeTab === 'batches' ? (
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Total Batches ({batches.length}/7)</h2>
                  <button onClick={() => setBatchModalOpen(true)} className="glass" style={{ padding: '0.6rem', borderRadius: '12px', color: 'var(--primary)', border: 'none' }}><Plus size={24} /></button>
                </div>
                <div className="grid-responsive">
                  {batches.map(batch => (
                    <div key={batch.id} className="card glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '14px', color: 'var(--primary)' }}><GraduationCap size={24} /></div>
                        <span style={{ fontWeight: 700 }}>{batch.name}</span>
                      </div>
                      <button onClick={() => deleteBatch(batch.id)} style={{ color: '#ef4444', opacity: 0.6 }}><Trash2 size={18} /></button>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Total Subjects ({subjects.length}/12)</h2>
                  <button onClick={() => setSubjectModalOpen(true)} className="glass" style={{ padding: '0.6rem', borderRadius: '12px', color: 'var(--primary)', border: 'none' }}><Plus size={24} /></button>
                </div>
                <div className="grid-responsive">
                  {subjects.map(subject => (
                    <div key={subject.id} className="card glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: 'rgba(217, 119, 6, 0.1)', padding: '0.75rem', borderRadius: '14px', color: 'var(--secondary)' }}><BookOpen size={24} /></div>
                        <span style={{ fontWeight: 700 }}>{subject.name}</span>
                      </div>
                      <button onClick={() => deleteSubject(subject.id)} style={{ color: '#ef4444', opacity: 0.6 }}><Trash2 size={18} /></button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        <Modal isOpen={batchModalOpen} onClose={() => setBatchModalOpen(false)} title="Create New Batch">
          <form onSubmit={handleCreateBatch} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="input-group"><label className="input-label">Batch Name</label><input type="text" className="input-field" placeholder="e.g., degree 1" value={newName} onChange={e => setNewName(e.target.value)} required /></div>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Save Batch</button>
          </form>
        </Modal>

        <Modal isOpen={subjectModalOpen} onClose={() => setSubjectModalOpen(false)} title="Create New Subject">
          <form onSubmit={handleCreateSubject} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="input-group"><label className="input-label">Subject Name</label><input type="text" className="input-field" placeholder="e.g., Fiqh" value={newName} onChange={e => setNewName(e.target.value)} required /></div>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Save Subject</button>
          </form>
        </Modal>
        <MobileNav />
      </div>
    </RoleGuard>
  );
}
