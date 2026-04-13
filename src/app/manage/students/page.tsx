'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Search, Filter, GraduationCap, Loader2, Save, MapPin, Phone, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import MobileNav from '@/components/layout/MobileNav';
import { supabase } from '@/lib/supabase';
import { RoleGuard } from '@/components/auth/RoleGuard';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function StudentsManagementPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const { showToast } = useToast();
  
  // New student form
  const [newName, setNewName] = useState('');
  const [mobile, setMobile] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentMobile, setParentMobile] = useState('');
  const [place, setPlace] = useState('');
  const [targetBatchId, setTargetBatchId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedBatch]);

  const fetchData = async () => {
    setLoading(true);
    const { data: batchesData } = await supabase.from('batches').select('*');
    if (batchesData) setBatches(batchesData);

    let query = supabase.from('students').select('*, batch_students(batch_id, batches(name))').order('name');
    
    if (selectedBatch !== 'all') {
      const { data: batchStudentIds } = await supabase
        .from('batch_students')
        .select('student_id')
        .eq('batch_id', selectedBatch);
      
      const ids = batchStudentIds?.map(b => b.student_id) || [];
      query = query.in('id', ids);
    }

    const { data: studentsData } = await query;
    if (studentsData) setStudents(studentsData);
    setLoading(false);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert({ 
          name: newName, 
          phone: mobile,
          parent_name: parentName,
          parent_phone: parentMobile,
          place: place
        })
        .select()
        .single();

      if (studentError) throw studentError;

      if (targetBatchId) {
        await supabase.from('batch_students').insert({
          student_id: student.id,
          batch_id: targetBatchId
        });
      }

      setModalOpen(false);
      setNewName('');
      setMobile('');
      setParentName('');
      setParentMobile('');
      setPlace('');
      setTargetBatchId('');
      showToast('Student registered successfully');
      fetchData();
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="container animate-fade-in">
        <header style={{ marginBottom: '1.5rem', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/manage" className="glass" style={{ padding: '0.5rem', borderRadius: '50%', color: 'var(--muted-foreground)', display: 'flex' }}>
            <ChevronLeft size={24} />
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Students</h1>
        </header>

        <section style={{ marginBottom: '5rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <select 
                value={selectedBatch} 
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="input-field"
                style={{ appearance: 'none', paddingLeft: '3rem' }}
              >
                <option value="all">All Batches</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <Filter size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
            </div>
            <button onClick={() => setModalOpen(true)} className="btn-primary" style={{ width: 'auto', padding: '0 1.25rem' }}>
              <Plus size={20} />
            </button>
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 className="animate-spin" size={32} color="var(--primary)" />
            </div>
          ) : (
            <div className="grid-responsive">
              {students.map((student) => (
                <Link key={student.id} href={`/students/${student.id}`} className="card glass" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', margin: 0 }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{student.name}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>
                      {student.batch_students?.[0]?.batches?.name || 'No Batch'} • {student.place || 'Unknown'}
                    </p>
                  </div>
                </Link>
              ))}
              {students.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--muted-foreground)', padding: '2rem', gridColumn: '1 / -1' }}>No students found.</p>
              )}
            </div>
          )}
        </section>

        <Modal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          title="Register Student"
        >
          <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: '0.75rem' }}>
              <label className="input-label">Full Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Student Name" 
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Mobile</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="tel" 
                    className="input-field" 
                    placeholder="999..." 
                    value={mobile}
                    onChange={e => setMobile(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Phone size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Place</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Place" 
                    value={place}
                    onChange={e => setPlace(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <MapPin size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Parent Name</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Parent" 
                    value={parentName}
                    onChange={e => setParentName(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <UserIcon size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                </div>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Parent No.</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="tel" 
                    className="input-field" 
                    placeholder="999..." 
                    value={parentMobile}
                    onChange={e => setParentMobile(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Phone size={14} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                </div>
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="input-label">Assign to Batch</label>
              <select 
                className="input-field" 
                value={targetBatchId} 
                onChange={e => setTargetBatchId(e.target.value)}
              >
                <option value="">Select a batch</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Save Student
            </button>
          </form>
        </Modal>

        <MobileNav />
      </div>
    </RoleGuard>
  );
}
