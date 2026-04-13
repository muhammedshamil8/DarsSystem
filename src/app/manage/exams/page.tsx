'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Plus, FileText, Calendar, Loader2, Save, Trash2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import MobileNav from '@/components/layout/MobileNav';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function ExamsManagePage() {
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    batch_subject_id: ''
  });

  useEffect(() => {
    fetchExams();
    fetchClasses();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('exams')
      .select(`
        *,
        batch_subjects(
          batches(name),
          subjects(name)
        )
      `)
      .order('date', { ascending: false });
    if (data) setExams(data);
    setLoading(false);
  };

  const fetchClasses = async () => {
    const { data } = await supabase
      .from('batch_subjects')
      .select(`
        id,
        batches(name),
        subjects(name)
      `);
    if (data) setClasses(data);
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.batch_subject_id) {
      showToast('Please select a class', 'error');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('exams').insert(formData);
    if (error) {
      showToast(error.message, 'error');
    } else {
      setModalOpen(false);
      setFormData({ name: '', date: new Date().toISOString().split('T')[0], batch_subject_id: '' });
      showToast('Examination scheduled successfully');
      fetchExams();
    }
    setSubmitting(false);
  };

  const deleteExam = async (id: string) => {
    if (confirm('Are you sure? This will delete all marks for this exam.')) {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Exam and associated results deleted');
        fetchExams();
      }
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="container animate-fade-in">
        <header style={{ marginBottom: '2rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link href="/manage" className="glass" style={{ padding: '0.6rem', borderRadius: '50%', color: 'var(--muted-foreground)', display: 'flex' }}>
            <ChevronLeft size={24} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Exams & Grading</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>Manage examinations and results</p>
          </div>
        </header>

        <section style={{ marginBottom: '5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Recent Examinations</h2>
            <button onClick={() => setModalOpen(true)} className="glass" style={{ padding: '0.6rem', borderRadius: '12px', color: 'var(--primary)', border: 'none' }}>
              <Plus size={24} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {exams.map(exam => (
                <div key={exam.id} className="card glass" style={{ margin: 0, padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.8rem', borderRadius: '14px', color: 'var(--secondary)' }}>
                      <FileText size={28} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{exam.name}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
                        {exam.batch_subjects?.batches?.name} • {exam.batch_subjects?.subjects?.name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                        <Calendar size={12} /> {exam.date}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => deleteExam(exam.id)} style={{ color: '#ef4444', opacity: 0.4, padding: '0.5rem' }}>
                      <Trash2 size={20} />
                    </button>
                    <Link href={`/manage/exams/${exam.id}`} className="glass" style={{ padding: '0.6rem 1.25rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                      Enter Marks <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              ))}
              {exams.length === 0 && (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <p style={{ color: 'var(--muted-foreground)', fontWeight: 600 }}>No exams created yet.</p>
                </div>
              )}
            </div>
          )}
        </section>

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Exam">
          <form onSubmit={handleCreateExam} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="input-group">
              <label className="input-label">Exam Title</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g., Mid-Term, Final Exam" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            
            <div className="input-group">
              <label className="input-label">Class (Batch & Subject)</label>
              <select 
                className="input-field"
                value={formData.batch_subject_id}
                onChange={e => setFormData({ ...formData, batch_subject_id: e.target.value })}
                required
              >
                <option value="">Select a class...</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id} style={{ background: '#05140d' }}>
                    {c.batches.name} - {c.subjects.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Exam Date</label>
              <input 
                type="date" 
                className="input-field" 
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <button type="submit" disabled={submitting} className="btn-primary" style={{ height: '3.5rem' }}>
              {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Schedule Exam
            </button>
          </form>
        </Modal>

        <MobileNav />
      </div>
    </RoleGuard>
  );
}
