'use client';

import { useState, useEffect } from 'react';
import { Check, X, Clock, BookOpen, Star, Save, ClipboardList, PenTool, CheckCircle2, AlertCircle, Loader2, Calendar, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { getHijriDate } from '@/lib/date-utils';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

type Tab = 'attendance' | 'homework' | 'evaluation' | 'notes';

interface Student {
  id: string;
  name: string;
}

interface Note {
  id: string;
  content: string;
  created_at: string;
}

export default function SessionEngine({ batchSubjectId }: { batchSubjectId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('attendance');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  // Deletion state
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'note' | 'hw' } | null>(null);

  // Form States
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [hwStatus, setHwStatus] = useState<Record<string, string>>({});
  const [evaluation, setEvaluation] = useState<Record<string, string>>({});
  const [currentHwDesc, setCurrentHwDesc] = useState('');
  const [newNote, setNewNote] = useState('');
  const [notesHistory, setNotesHistory] = useState<Note[]>([]);

  useEffect(() => {
    initEngine();
  }, [batchSubjectId, selectedDate]);

  const initEngine = async () => {
    setLoading(true);
    
    // 1. Fetch Class & Students
    const { data: bsData } = await supabase.from('batch_subjects').select('batch_id').eq('id', batchSubjectId).single();
    if (!bsData) return;
    const { data: studentsData } = await supabase.from('batch_students').select('student_id, students(name)').eq('batch_id', bsData.batch_id);
    if (!studentsData) return;
    const formattedStudents = studentsData.map((s: any) => ({ id: s.student_id, name: s.students.name }));
    setStudents(formattedStudents);

    // 2. Fetch Persistent Content (Homework & Notes for the class)
    const [hwdRes, ntRes] = await Promise.all([
      supabase.from('homework').select('description').eq('batch_subject_id', batchSubjectId).maybeSingle(),
      supabase.from('notes').select('*').eq('batch_subject_id', batchSubjectId).order('created_at', { ascending: false })
    ]);
    
    setCurrentHwDesc(hwdRes.data?.description || '');
    setNotesHistory(ntRes.data || []);

    // 3. Fetch Session-specific data (Attendance, HW Status, Eval)
    const { data: session } = await supabase.from('sessions').select('id').eq('batch_subject_id', batchSubjectId).eq('date', selectedDate).maybeSingle();
    if (session) {
      setSessionId(session.id);
      const [att, hws, ev] = await Promise.all([
        supabase.from('attendance').select('student_id, status').eq('session_id', session.id),
        supabase.from('homework_status').select('student_id, status').eq('session_id', session.id),
        supabase.from('evaluations').select('student_id, performance').eq('session_id', session.id)
      ]);
      const attMap: Record<string, string> = {}; att.data?.forEach(a => attMap[a.student_id] = a.status); setAttendance(attMap);
      const hwMap: Record<string, string> = {}; hws.data?.forEach(h => hwMap[h.student_id] = h.status === 'completed' ? 'Done' : h.status === 'half' ? 'Half' : 'None'); setHwStatus(hwMap);
      const evMap: Record<string, string> = {}; ev.data?.forEach(e => evMap[e.student_id] = e.performance.charAt(0).toUpperCase() + e.performance.slice(1)); setEvaluation(evMap);
    } else {
      setSessionId(null);
      const defAttd: Record<string, string> = {}; const defHw: Record<string, string> = {}; const defEval: Record<string, string> = {};
      formattedStudents.forEach(s => { defAttd[s.id] = 'present'; defHw[s.id] = 'Done'; defEval[s.id] = 'Perfect'; });
      setAttendance(defAttd); setHwStatus(defHw); setEvaluation(defEval);
    }
    setLoading(false);
  };

  const getOrCreateSession = async () => {
    if (sessionId) return sessionId;
    const { data, error } = await supabase.from('sessions').insert({ batch_subject_id: batchSubjectId, date: selectedDate, hijri_date: getHijriDate(new Date(selectedDate)) }).select().single();
    if (error) throw error;
    setSessionId(data.id);
    return data.id;
  };

  const saveAttendance = async () => {
    setSaving('attendance');
    try {
      const sId = await getOrCreateSession();
      const payload = students.map(s => ({ session_id: sId, student_id: s.id, status: attendance[s.id] }));
      await supabase.from('attendance').upsert(payload, { onConflict: 'session_id,student_id' });
    } catch (e: any) { alert(e.message); }
    setSaving(null);
  };

  const saveHomework = async () => {
    setSaving('homework');
    try {
      // 1. Save per-student status (Session-specific)
      const sId = await getOrCreateSession();
      const statusPayload = students.map(s => ({ session_id: sId, student_id: s.id, status: hwStatus[s.id] === 'Done' ? 'completed' : hwStatus[s.id] === 'Half' ? 'half' : 'not_done' }));
      await supabase.from('homework_status').upsert(statusPayload, { onConflict: 'session_id,student_id' });
      
      // 2. Save homework description (Class-persistent)
      await supabase.from('homework').upsert({ batch_subject_id: batchSubjectId, description: currentHwDesc }, { onConflict: 'batch_subject_id' });
    } catch (e: any) { alert(e.message); }
    setSaving(null);
  };

  const saveEvaluation = async () => {
    setSaving('evaluation');
    try {
      const sId = await getOrCreateSession();
      const payload = students.map(s => ({ session_id: sId, student_id: s.id, performance: evaluation[s.id].toLowerCase() }));
      await supabase.from('evaluations').upsert(payload, { onConflict: 'session_id,student_id' });
    } catch (e: any) { alert(e.message); }
    setSaving(null);
  };

  const saveNote = async () => {
    if (!newNote.trim()) return;
    setSaving('notes');
    try {
      // Save note for the CLASS, not the session
      const { data } = await supabase.from('notes').insert({ batch_subject_id: batchSubjectId, content: newNote }).select().single();
      if (data) setNotesHistory([data, ...notesHistory]);
      setNewNote('');
    } catch (e: any) { alert(e.message); }
    setSaving(null);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'note') {
        await supabase.from('notes').delete().eq('id', deleteConfirm.id);
        setNotesHistory(notesHistory.filter(n => n.id !== deleteConfirm.id));
      } else if (deleteConfirm.type === 'hw') {
        await supabase.from('homework').delete().eq('batch_subject_id', batchSubjectId);
        setCurrentHwDesc('');
      }
    } catch (e: any) { alert(e.message); }
    setDeleteConfirm(null);
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><Loader2 className="animate-spin" size={48} color="var(--primary)" /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="card glass" style={{ margin: 0, padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Calendar size={20} color="var(--primary)" />
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input-field" style={{ padding: '0.4rem', background: 'transparent', border: 'none', fontWeight: 700, fontSize: '1.1rem' }} />
        <div style={{ flex: 1, textAlign: 'right' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 700 }}>{getHijriDate(new Date(selectedDate))}</p>
        </div>
      </div>

      <div className="glass" style={{ display: 'flex', padding: '0.4rem', borderRadius: '18px', border: '1px solid var(--glass-border)' }}>
        {([ { id: 'attendance', icon: ClipboardList, label: 'Attd' }, { id: 'homework', icon: BookOpen, label: 'HW' }, { id: 'evaluation', icon: Star, label: 'Eval' }, { id: 'notes', icon: PenTool, label: 'Notes' }, ] as const).map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.6rem', borderRadius: '14px', background: activeTab === tab.id ? 'var(--primary)' : 'transparent', color: activeTab === tab.id ? 'white' : 'var(--muted-foreground)', transition: 'all 0.3s' }}>
            <tab.icon size={20} />
            <span style={{ fontSize: '0.65rem', marginTop: '0.2rem', fontWeight: 600 }}>{tab.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          {activeTab === 'attendance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {students.map(s => (
                <div key={s.id} className="card glass" style={{ margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderLeft: '4px solid transparent' }}>
                  <span style={{ fontWeight: 600 }}>{s.name}</span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(['present', 'absent', 'late'] as const).map(st => (
                      <button key={st} onClick={() => setAttendance({...attendance, [s.id]: st})} style={{ padding: '0.5rem', borderRadius: '10px', background: attendance[s.id] === st ? (st === 'present' ? 'var(--success)' : st === 'absent' ? 'var(--error)' : 'var(--warning)') : 'var(--accent)', color: attendance[s.id] === st ? 'white' : 'var(--muted-foreground)' }}>
                        {st === 'present' ? <Check size={18} /> : st === 'absent' ? <X size={18} /> : <Clock size={18} />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={saveAttendance} disabled={!!saving} className="btn-primary" style={{ marginTop: '1rem' }}><Save size={20} /> Save Attendance</button>
            </div>
          )}

          {activeTab === 'homework' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="card glass" style={{ margin: 0, padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 700 }}>HW Completion</h3>
                {students.map(s => (
                  <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>{s.name}</span>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      {['None', 'Half', 'Done'].map(st => (
                        <button key={st} onClick={() => setHwStatus({...hwStatus, [s.id]: st})} style={{ fontSize: '0.7rem', padding: '0.4rem 0.75rem', borderRadius: '8px', background: hwStatus[s.id] === st ? 'var(--primary)' : 'var(--accent)', color: 'white', opacity: hwStatus[s.id] === st ? 1 : 0.4 }}>{st}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="card glass" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>Class Homework (Persistent)</label>
                  {currentHwDesc && (
                    <button onClick={() => setDeleteConfirm({ id: batchSubjectId, type: 'hw' })} style={{ color: 'var(--error)', padding: '0.25rem', borderRadius: '6px' }} className="glass">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <textarea className="input-field" rows={3} value={currentHwDesc} onChange={(e) => setCurrentHwDesc(e.target.value)} />
              </div>
              <button onClick={saveHomework} disabled={!!saving} className="btn-primary"><Save size={20} /> Save Homework</button>
            </div>
          )}

          {activeTab === 'evaluation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {students.map(s => (
                <div key={s.id} className="card glass" style={{ margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                  <span style={{ fontWeight: 600 }}>{s.name}</span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {['Perfect', 'Tried', 'Failed'].map(st => (
                      <button key={st} onClick={() => setEvaluation({...evaluation, [s.id]: st})} style={{ fontSize: '0.75rem', padding: '0.5rem 0.8rem', borderRadius: '10px', background: evaluation[s.id] === st ? 'var(--secondary)' : 'var(--accent)', color: 'white', opacity: evaluation[s.id] === st ? 1 : 0.4 }}>{st}</button>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={saveEvaluation} disabled={!!saving} className="btn-primary" style={{ marginTop: '1rem' }}><Save size={20} /> Save Evaluation</button>
            </div>
          )}

          {activeTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="card glass" style={{ margin: 0 }}>
                <label className="input-label">Class Notes History</label>
                <textarea className="input-field" rows={3} value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a persistent note for this class..." />
                <button onClick={saveNote} disabled={!!saving || !newNote.trim()} className="btn-primary" style={{ marginTop: '1rem' }}><PenTool size={20} /> Add Note</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {notesHistory.map(n => (
                  <div key={n.id} className="card glass" style={{ margin: 0, padding: '1rem', borderLeft: '4px solid var(--secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>{new Date(n.created_at).toLocaleString()}</p>
                      <button onClick={() => setDeleteConfirm({ id: n.id, type: 'note' })} style={{ color: 'var(--error)', padding: '0.2rem' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>{n.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <ConfirmDialog 
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete this ${deleteConfirm?.type === 'note' ? 'note' : 'homework task'}? This action cannot be undone.`}
        confirmLabel="Delete"
        type="danger"
      />
    </div>
  );
}
