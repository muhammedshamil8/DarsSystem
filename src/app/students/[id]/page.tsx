'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, GraduationCap, Calendar, BookOpen, Star, TrendingUp, AlertCircle, Loader2, ChevronDown, Filter } from 'lucide-react';
import Link from 'next/link';
import MobileNav from '@/components/layout/MobileNav';
import { supabase } from '@/lib/supabase';
import { RoleGuard } from '@/components/auth/RoleGuard';

import { use } from 'react';

export default function StudentProfilePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [student, setStudent] = useState<any>(null);
  const [allHistory, setAllHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [classHomework, setClassHomework] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchStudentData();
  }, [params.id]);

  const fetchStudentData = async () => {
    setLoading(true);
    
    // 1. Fetch Student Info & Batch Classes
    const { data: studentData } = await supabase
      .from('students')
      .select('*, batch_students(batches(id, name, batch_subjects(id, subjects(name))))')
      .eq('id', params.id)
      .single();
    
    if (studentData) {
      setStudent(studentData);
      
      // 2. Fetch Chronic Homework for these classes
      const classIds = studentData.batch_students.flatMap((bs: any) => bs.batches.batch_subjects.map((s: any) => s.id));
      const { data: hwRes } = await supabase.from('homework').select('batch_subject_id, description').in('batch_subject_id', classIds);
      const hwMap: Record<string, string> = {};
      hwRes?.forEach(h => hwMap[h.batch_subject_id] = h.description);
      setClassHomework(hwMap);

      // 3. Fetch specific records for this student
      const [attdRes, hwsRes, evalRes] = await Promise.all([
        supabase.from('attendance').select('*, sessions(id, date, hijri_date, batch_subjects(id, subjects(name)))').eq('student_id', params.id),
        supabase.from('homework_status').select('*, sessions(id)').eq('student_id', params.id),
        supabase.from('evaluations').select('*, sessions(id)').eq('student_id', params.id)
      ]);

      // Combine them
      const combined = attdRes.data?.map((a: any) => {
        if (!a.sessions) return null;
        const hwStat = hwsRes.data?.find((h: any) => h.session_id === a.session_id);
        const ev = evalRes.data?.find((e: any) => e.session_id === a.session_id);
        
        return {
          id: a.session_id,
          date: a.sessions.date,
          hijri: a.sessions.hijri_date,
          batch_subject_id: a.sessions.batch_subjects?.id,
          subject: a.sessions.batch_subjects?.subjects?.name,
          attendance: a.status,
          homework: hwStat?.status || 'not_done',
          evaluation: ev?.performance || 'failed'
        };
      }).filter(Boolean) || [];

      setAllHistory(combined);
    }
    setLoading(false);
  };

  const subjects = useMemo(() => {
    const subs = Array.from(new Set(allHistory.map(h => h.subject))).filter(Boolean);
    return ['all', ...subs];
  }, [allHistory]);

  const filteredHistory = useMemo(() => {
    return allHistory.filter(item => {
      const matchMonth = item.date.startsWith(selectedMonth);
      const matchSubject = selectedSubject === 'all' || item.subject === selectedSubject;
      return matchMonth && matchSubject;
    });
  }, [selectedMonth, selectedSubject, allHistory]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'var(--success)';
      case 'absent': return 'var(--error)';
      case 'late': return 'var(--warning)';
      case 'completed':
      case 'perfect': return 'var(--primary)';
      case 'half':
      case 'tried': return 'var(--secondary)';
      case 'not_done':
      case 'failed': return '#666';
      default: return 'var(--muted)';
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return {
      value: d.toISOString().slice(0, 7),
      label: d.toLocaleString('default', { month: 'long', year: 'numeric' })
    };
  });

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  return (
    <RoleGuard>
      <div className="container animate-fade-in">
        <header style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
          <Link href="/manage/students" className="glass" style={{ padding: '0.5rem', borderRadius: '50%', color: 'var(--muted-foreground)', display: 'inline-flex', marginBottom: '1rem' }}>
            <ChevronLeft size={24} />
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, var(--primary), #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 800 }}>
                {student?.name?.charAt(0)}
              </div>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{student?.name}</h1>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                  {student?.batch_students?.map((bs: any) => (
                    <span key={bs.batches.name} style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--primary)', padding: '0.15rem 0.6rem', borderRadius: '8px', fontWeight: 700 }}>{bs.batches.name}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Granular Reports</h2>
              <Filter size={18} color="var(--muted-foreground)" />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '0.75rem' }}>
              <div style={{ position: 'relative' }}>
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="glass"
                  style={{ width: '100%', appearance: 'none', color: 'white', border: 'none', padding: '0.75rem 1rem', borderRadius: '14px', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
                >
                  {months.map(m => <option key={m.value} value={m.value} style={{ background: '#05140d' }}>{m.label}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--primary)' }} />
              </div>

              <div style={{ position: 'relative' }}>
                <select 
                  value={selectedSubject} 
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="glass"
                  style={{ width: '100%', appearance: 'none', color: 'white', border: 'none', padding: '0.75rem 1rem', borderRadius: '14px', fontSize: '0.85rem', fontWeight: 700, outline: 'none' }}
                >
                  {subjects.map(s => <option key={s} value={s} style={{ background: '#05140d' }}>{s === 'all' ? 'All Subjects' : s}</option>)}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--primary)' }} />
              </div>
            </div>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '2.5rem' }}>
          <div className="card glass" style={{ margin: 0, padding: '1.25rem', textAlign: 'center', borderBottom: '3px solid var(--primary)' }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem' }}>Attendance</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)' }}>{filteredHistory.length > 0 ? Math.round((filteredHistory.filter((h: any) => h.attendance === 'present').length / filteredHistory.length) * 100) : 0}%</p>
          </div>
          <div className="card glass" style={{ margin: 0, padding: '1.25rem', textAlign: 'center', borderBottom: '3px solid var(--secondary)' }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem' }}>HW Score</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--secondary)' }}>{filteredHistory.filter((h: any) => h.homework === 'completed').length}</p>
          </div>
          <div className="card glass" style={{ margin: 0, padding: '1.25rem', textAlign: 'center', borderBottom: '3px solid var(--warning)' }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem' }}>Perfects</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--warning)' }}>{filteredHistory.filter((h: any) => h.evaluation === 'perfect').length}</p>
          </div>
        </div>

        <section style={{ marginBottom: '6rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {filteredHistory.map((log) => (
              <div key={`${log.id}-${log.subject}`} className="card glass" style={{ padding: '1.5rem', margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>{log.date} • {log.hijri}</p>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.1rem' }}>{log.subject}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: getStatusColor(log.attendance) }} title={`Attendance: ${log.attendance}`} />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: getStatusColor(log.homework) }} title={`HW: ${log.homework}`} />
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: getStatusColor(log.evaluation) }} title={`Eval: ${log.evaluation}`} />
                  </div>
                </div>
                
                {classHomework[log.batch_subject_id] && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--secondary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Class Homework (Persistent)</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', fontStyle: 'italic' }}>"{classHomework[log.batch_subject_id]}"</p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700 }}>Attendance</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 800, color: getStatusColor(log.attendance) }}>{log.attendance?.toUpperCase()}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700 }}>HW Status</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 800, color: getStatusColor(log.homework) }}>{log.homework?.replace('_', ' ').toUpperCase()}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700 }}>Evaluation</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 800, color: getStatusColor(log.evaluation) }}>{log.evaluation?.toUpperCase()}</p>
                  </div>
                </div>
              </div>
            ))}
            {filteredHistory.length === 0 && (
              <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--muted-foreground)', background: 'rgba(255,255,255,0.02)', borderRadius: '28px' }}>
                <AlertCircle size={48} style={{ margin: '0 auto 1.25rem', opacity: 0.2 }} />
                <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No records found for the selected filters.</p>
              </div>
            )}
          </div>
        </section>

        <MobileNav />
      </div>
    </RoleGuard>
  );
}
