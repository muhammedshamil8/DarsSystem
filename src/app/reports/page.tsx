'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Download, Share2, TrendingUp, Calendar, CheckCircle, PieChart, Users, Loader2, ChevronDown, Filter } from 'lucide-react';
import Link from 'next/link';
import { jsPDF } from 'jspdf';
import MobileNav from '@/components/layout/MobileNav';
import { supabase } from '@/lib/supabase';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [batchStats, setBatchStats] = useState<any>(null);
  const [studentStats, setStudentStats] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedBatchId) {
      fetchBatchReports();
    }
  }, [selectedBatchId, selectedMonth]);

  const fetchInitialData = async () => {
    const { data: batchesData } = await supabase.from('batches').select('*');
    if (batchesData) {
      setBatches(batchesData);
      if (batchesData.length > 0) setSelectedBatchId(batchesData[0].id);
    }
    setLoading(false);
  };

  const fetchBatchReports = async () => {
    setLoading(true);
    
    // 1. Get all students in this batch
    const { data: studentsInBatch } = await supabase
      .from('batch_students')
      .select('student_id, students(name)')
      .eq('batch_id', selectedBatchId);

    if (!studentsInBatch) return;

    // 2. Get all sessions for this batch (via batch_subjects) in the selected month
    const { data: bsData } = await supabase
      .from('batch_subjects')
      .select('id')
      .eq('batch_id', selectedBatchId);
    
    const bsIds = bsData?.map(b => b.id) || [];

    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, date')
      .in('batch_subject_id', bsIds)
      .like('date', `${selectedMonth}%`);

    const sessionIds = sessions?.map(s => s.id) || [];

    if (sessionIds.length === 0) {
      setBatchStats(null);
      setStudentStats([]);
      setLoading(false);
      return;
    }

    // 3. Fetch all logs for these sessions
    const [attdRes, hwRes, evalRes] = await Promise.all([
      supabase.from('attendance').select('*').in('session_id', sessionIds),
      supabase.from('homework_status').select('*').in('session_id', sessionIds),
      supabase.from('evaluations').select('*').in('session_id', sessionIds)
    ]);

    // 4. Aggregate per student
    const stats = studentsInBatch.map(s => {
      const studentId = s.student_id;
      const sAttd = attdRes.data?.filter(a => a.student_id === studentId) || [];
      const sHw = hwRes.data?.filter(h => h.student_id === studentId) || [];
      const sEval = evalRes.data?.filter(e => e.student_id === studentId) || [];

      const attdRate = sAttd.length > 0 ? Math.round((sAttd.filter(a => a.status === 'present').length / sAttd.length) * 100) : 0;
      const hwRate = sHw.length > 0 ? Math.round((sHw.filter(h => h.status === 'completed').length / sHw.length) * 100) : 0;
      const perfectEvals = sEval.filter(e => e.performance === 'perfect').length;

      return {
        id: studentId,
        name: Array.isArray(s.students) ? s.students[0]?.name : (s.students as any)?.name,
        attdRate,
        hwRate,
        perfectEvals,
      };
    });

    setStudentStats(stats);
    
    // Aggregate for Batch overall
    const avgAttd = stats.length > 0 ? Math.round(stats.reduce((acc, curr) => acc + curr.attdRate, 0) / stats.length) : 0;
    const avgHw = stats.length > 0 ? Math.round(stats.reduce((acc, curr) => acc + curr.hwRate, 0) / stats.length) : 0;
    
    setBatchStats({ avgAttd, avgHw, totalPerfect: stats.reduce((acc, curr) => acc + curr.perfectEvals, 0) });
    setLoading(false);
  };

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return { value: d.toISOString().slice(0, 7), label: d.toLocaleString('default', { month: 'long', year: 'numeric' }) };
  });

  const downloadPDF = (student: any) => {
    const doc = new jsPDF();
    doc.setFillColor(5, 20, 13);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(24);
    doc.text('DarsPro Academic Report', 20, 30);
    doc.setTextColor(240, 247, 244);
    doc.setFontSize(14);
    doc.text(`Student Name: ${student.name}`, 20, 50);
    doc.text(`Report Period: ${selectedMonth}`, 20, 60);
    doc.line(20, 70, 190, 70);
    doc.text('Performance Summary:', 20, 85);
    doc.text(`- Attendance Rate: ${student.attdRate}%`, 30, 95);
    doc.text(`- Homework Completion: ${student.hwRate}%`, 30, 105);
    doc.text(`- Perfect Evaluations: ${student.perfectEvals}`, 30, 115);
    doc.save(`report_${student.name.replace(' ', '_')}.pdf`);
  };

  return (
    <RoleGuard>
      <div className="container animate-fade-in">
        <header style={{ marginBottom: '1.5rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => window.history.back()} className="glass" style={{ padding: '0.5rem', borderRadius: '50%', color: 'var(--muted-foreground)', border: 'none' }}>
              <ChevronLeft size={24} />
            </button>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Batch Reports</h1>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <select 
                value={selectedBatchId || ''} 
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="input-field"
                style={{ appearance: 'none', paddingLeft: '3rem' }}
              >
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <Users size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
              <ChevronDown size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>

            <div style={{ position: 'relative', flex: 1 }}>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="input-field"
                style={{ appearance: 'none', paddingLeft: '3rem' }}
              >
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <Calendar size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
            </div>
          </div>
        </header>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}>
            <Loader2 className="animate-spin" size={48} color="var(--primary)" />
          </div>
        ) : (
          <>
            {batchStats ? (
              <>
                <section className="card glass" style={{ borderTop: '4px solid var(--primary)', padding: '2rem 1.5rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: `conic-gradient(var(--primary) ${batchStats.avgAttd}%, var(--accent) 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '95px', height: '95px', borderRadius: '50%', background: 'var(--card)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800 }}>{batchStats.avgAttd}%</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>Attendance</span>
                      </div>
                    </div>
                  </div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{batches.find(b => b.id === selectedBatchId)?.name} Performance</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>Monthly average for all students in this batch</p>
                </section>

                <div className="grid-responsive" style={{ marginBottom: '2.5rem' }}>
                  <div className="card glass" style={{ margin: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <TrendingUp size={32} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Perfect Evals</p>
                    <p style={{ fontSize: '2rem', fontWeight: 900 }}>{batchStats.totalPerfect}</p>
                  </div>
                  <div className="card glass" style={{ margin: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <CheckCircle size={32} color="var(--secondary)" style={{ marginBottom: '1rem' }} />
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>HW Completion</p>
                    <p style={{ fontSize: '2rem', fontWeight: 900 }}>{batchStats.avgHw}%</p>
                  </div>
                </div>

                <section style={{ marginBottom: '6rem' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1.5rem' }}>Student Monthly Summary</h3>
                  <div className="grid-responsive">
                    {studentStats.map((student) => (
                      <div key={student.id} className="card glass" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', margin: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <p style={{ fontWeight: 800, fontSize: '1.2rem' }}>{student.name}</p>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>Attd: {student.attdRate}%</span>
                              <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>HW: {student.hwRate}%</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => downloadPDF(student)} className="glass" style={{ padding: '0.7rem', borderRadius: '12px', color: 'var(--primary)', border: 'none' }}>
                              <Download size={22} />
                            </button>
                            <Link href={`/students/${student.id}`} className="glass" style={{ padding: '0.7rem', borderRadius: '12px', color: 'var(--secondary)', border: 'none', display: 'flex' }}>
                                <TrendingUp size={22} />
                            </Link>
                          </div>
                        </div>
                        <div style={{ marginTop: '1.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                             <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', fontWeight: 700 }}>MONTHLY PROGRESS</span>
                             <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>{student.attdRate}%</span>
                          </div>
                          <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ width: `${student.attdRate}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), #34d399)', borderRadius: '10px' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--muted-foreground)', background: 'rgba(255,255,255,0.02)', borderRadius: '24px' }}>
                <AlertCircle size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.3 }} />
                <p>No activity records found for this batch in {months.find(m => m.value === selectedMonth)?.label}.</p>
              </div>
            )}
          </>
        )}

        <MobileNav />
      </div>
    </RoleGuard>
  );
}

const AlertCircle = ({ size, style }: { size: number, style?: any }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
