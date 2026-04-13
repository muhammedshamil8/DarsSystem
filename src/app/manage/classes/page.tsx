'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Users, BookOpen, GraduationCap, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import MobileNav from '@/components/layout/MobileNav';
import { supabase } from '@/lib/supabase';
import { RoleGuard } from '@/components/auth/RoleGuard';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function ClassesManagementPage() {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const { showToast } = useToast();

  // Form state
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [bRes, sRes, tRes, aRes] = await Promise.all([
      supabase.from('batches').select('*'),
      supabase.from('subjects').select('*'),
      supabase.from('profiles').select('*').eq('role', 'teacher'),
      supabase.from('batch_subjects').select('*, batches(name), subjects(name), profiles(name)')
    ]);

    if (bRes.data) setBatches(bRes.data);
    if (sRes.data) setSubjects(sRes.data);
    if (tRes.data) setTeachers(tRes.data);
    if (aRes.data) setAssignments(aRes.data);
    
    setLoading(false);
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { error } = await supabase
      .from('batch_subjects')
      .upsert({
        batch_id: selectedBatch,
        subject_id: selectedSubject,
        teacher_id: selectedTeacher
      }, { onConflict: 'batch_id,subject_id' });

    if (error) {
      showToast(error.message, 'error');
    } else {
      setModalOpen(false);
      showToast('Teacher successfully assigned to class');
      fetchData();
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Schedule</h1>
        </header>

        <section style={{ marginBottom: '5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--muted-foreground)' }}>Active Assignments</h2>
            <button onClick={() => setModalOpen(true)} className="btn-primary" style={{ width: 'auto', padding: '0.6rem 1.25rem', borderRadius: '14px', fontSize: '0.9rem' }}>
              <Plus size={18} />
              Assign
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 className="animate-spin" size={32} color="var(--primary)" />
            </div>
          ) : (
            <div className="grid-responsive">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="card glass" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: 0 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{assignment.batches?.name}</h3>
                      <span className="glass" style={{ fontSize: '0.65rem', padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)', fontWeight: 600 }}>{assignment.subjects?.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
                      <Users size={14} />
                      <span>{assignment.profiles?.name || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>
              ))}
              {assignments.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '2rem', gridColumn: '1 / -1' }}>No assignments created yet.</p>
              )}
            </div>
          )}
        </section>

        <Modal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          title="Assign Teacher"
        >
          <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="input-group">
              <label className="input-label">Batch</label>
              <select className="input-field" value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)} required>
                <option value="">Select Batch</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Subject</label>
              <select className="input-field" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} required>
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Teacher (Usthad)</label>
              <select className="input-field" value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)} required>
                <option value="">Select Teacher</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary" style={{ marginTop: '0.5rem' }}>
              {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Confirm Assignment
            </button>
          </form>
        </Modal>

        <MobileNav />
      </div>
    </RoleGuard>
  );
}
