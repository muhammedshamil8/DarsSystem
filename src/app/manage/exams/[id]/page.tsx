'use client';

import { useState, useEffect, use } from 'react';
import { ChevronLeft, Save, Loader2, User, Trophy, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import MobileNav from '@/components/layout/MobileNav';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { supabase } from '@/lib/supabase';

export default function ExamMarksPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [exam, setExam] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchExamData();
  }, [params.id]);

  const fetchExamData = async () => {
    setLoading(true);
    
    // 1. Fetch Exam & Class info
    const { data: examData } = await supabase
      .from('exams')
      .select(`
        *,
        batch_subjects(
          batch_id,
          batches(name),
          subjects(name)
        )
      `)
      .eq('id', params.id)
      .single();
    
    if (examData) {
      setExam(examData);
      
      // 2. Fetch students in the associated batch
      const { data: studentsData } = await supabase
        .from('batch_students')
        .select('student_id, students(name)')
        .eq('batch_id', examData.batch_subjects.batch_id);

      if (studentsData) {
        setStudents(studentsData.map((s: any) => ({
          id: s.student_id,
          name: s.students.name
        })));
      }

      // 3. Fetch existing results
      const { data: resultsData } = await supabase
        .from('exam_results')
        .select('*')
        .eq('exam_id', params.id);
      
      const marksMap: Record<string, number> = {};
      resultsData?.forEach(r => {
        marksMap[r.student_id] = r.marks;
      });
      setMarks(marksMap);
    }
    setLoading(false);
  };

  const handleSaveMarks = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const payload = Object.entries(marks).map(([studentId, mark]) => ({
        exam_id: params.id,
        student_id: studentId,
        marks: mark
      }));

      const { error } = await supabase
        .from('exam_results')
        .upsert(payload, { onConflict: 'exam_id,student_id' });

      if (error) throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div className="container animate-fade-in">
        <header style={{ marginBottom: '2rem', marginTop: '1rem' }}>
          <Link href="/manage/exams" className="glass" style={{ padding: '0.5rem', borderRadius: '50%', color: 'var(--muted-foreground)', display: 'inline-flex', marginBottom: '1.5rem' }}>
            <ChevronLeft size={24} />
          </Link>
          <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '1.5rem', borderRadius: '24px', borderLeft: '5px solid var(--secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{exam?.name}</h1>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                  {exam?.batch_subjects?.batches?.name} • {exam?.batch_subjects?.subjects?.name}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6 }}>EXAM DATE</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{exam?.date}</p>
              </div>
            </div>
          </div>
        </header>

        <section style={{ marginBottom: '6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Student Marks</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontSize: '0.85rem' }}>
              <Trophy size={16} /> Max Marks: 100 (Optional)
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {students.map((student) => (
              <div key={student.id} className="card glass" style={{ margin: 0, padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '12px' }}>
                    <User size={20} color="var(--muted-foreground)" />
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '1rem' }}>{student.name}</span>
                </div>
                <div style={{ width: '100px', position: 'relative' }}>
                  <input 
                    type="number" 
                    className="input-field" 
                    placeholder="00"
                    style={{ textAlign: 'center', padding: '0.75rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}
                    value={marks[student.id] || ''}
                    onChange={(e) => setMarks({ ...marks, [student.id]: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            ))}
            {students.length === 0 && (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted-foreground)' }}>
                <AlertCircle size={40} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                <p>No students found in this batch.</p>
              </div>
            )}
          </div>

          <div style={{ marginTop: '3rem', position: 'sticky', bottom: '6rem', zIndex: 10 }}>
            <button 
              onClick={handleSaveMarks} 
              disabled={saving || students.length === 0}
              className="btn-primary" 
              style={{ height: '4rem', fontSize: '1.1rem', boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.4)' }}
            >
              {saving ? <Loader2 className="animate-spin" size={24} /> : (success ? <CheckCircle2 size={24} /> : <Save size={24} />)}
              {success ? 'Marks Recorded Successfully' : 'Save Examination Results'}
            </button>
          </div>
        </section>

        <MobileNav />
      </div>
    </RoleGuard>
  );
}
