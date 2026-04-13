'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, ChevronRight, Plus, Loader2, LogOut, TrendingUp } from 'lucide-react';
import { getHijriDate, formatDate } from '@/lib/date-utils';
import MobileNav from '@/components/layout/MobileNav';
import { useAuth } from '@/components/auth/AuthProvider';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { supabase } from '@/lib/supabase';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import InstallBanner from '@/components/pwa/InstallBanner';

export default function Dashboard() {
  const [hijriDate, setHijriDate] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyAttendance, setMonthlyAttendance] = useState<number | null>(null);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const { profile, user, signOut } = useAuth();
  
  useEffect(() => {
    setHijriDate(getHijriDate());
    if (user && profile) {
      fetchClasses();
      fetchMonthlyAttendance();
    }
  }, [user, profile]);

  const fetchClasses = async () => {
    setLoading(true);
    let query = supabase
      .from('batch_subjects')
      .select(`
        id,
        batches(name, id),
        subjects(name),
        teacher_id
      `);

    if (profile?.role === 'teacher') {
      query = query.eq('teacher_id', user?.id);
    }

    const { data } = await query;
    if (data) setClasses(data);
    setLoading(false);
  };

  const fetchMonthlyAttendance = async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    let bsQuery = supabase.from('batch_subjects').select('id');
    if (profile?.role === 'teacher') bsQuery = bsQuery.eq('teacher_id', user?.id);
    const { data: bsData } = await bsQuery;
    const bsIds = bsData?.map(b => b.id) || [];

    if (bsIds.length === 0) return;

    const { data: sessions } = await supabase
      .from('sessions')
      .select('id')
      .in('batch_subject_id', bsIds)
      .like('date', `${currentMonth}%`);
    
    const sessionIds = sessions?.map(s => s.id) || [];
    if (sessionIds.length === 0) {
      setMonthlyAttendance(0);
      return;
    }

    const { data: attd } = await supabase
      .from('attendance')
      .select('status')
      .in('session_id', sessionIds);

    if (attd && attd.length > 0) {
      const present = attd.filter(a => a.status === 'present').length;
      setMonthlyAttendance(Math.round((present / attd.length) * 100));
    } else {
      setMonthlyAttendance(0);
    }
  };

  return (
    <RoleGuard>
      <div className="container animate-fade-in">
        <InstallBanner />
        <header style={{ marginBottom: '2.5rem', marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.06em' }}>DarsPro</h1>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '1rem', fontWeight: 500 }}>Welcome back, {profile?.name?.split(' ')[0] || 'Usthad'}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                onClick={() => setLogoutConfirmOpen(true)}
                className="glass" 
                style={{ padding: '0.75rem', borderRadius: '16px', color: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Logout"
              >
                <LogOut size={22} />
              </button>
              <Link href="/profile" className="glass" style={{ padding: '0.4rem', borderRadius: '50%', cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, var(--primary), #059669)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: '1.2rem' }}>
                  {profile?.name?.charAt(0) || 'U'}
                </div>
              </Link>
            </div>
          </div>
          
          <div className="glass" style={{ marginTop: '2rem', padding: '1.75rem', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '1rem', alignItems: 'center', borderRadius: '28px' }}>
            <div>
              <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', fontWeight: 600 }}>{formatDate()}</p>
              <p style={{ color: 'var(--secondary)', fontSize: '1.3rem', fontWeight: 800, marginTop: '0.2rem' }}>{hijriDate}</p>
            </div>
            <div style={{ textAlign: 'right', borderLeft: '1px solid var(--glass-border)', paddingLeft: '1.5rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: '0.2rem' }}>Monthly Performance</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'flex-end' }}>
                <TrendingUp size={20} color="var(--primary)" />
                <p style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>
                  {monthlyAttendance !== null ? `${monthlyAttendance}%` : '--%'}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section style={{ marginBottom: '5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{profile?.role === 'admin' ? 'Institution Classes' : 'My Assigned Classes'}</h2>
            {profile?.role === 'admin' && (
              <Link href="/manage" className="glass" style={{ padding: '0.6rem', borderRadius: '12px', color: 'var(--primary)', border: 'none', display: 'flex', alignItems: 'center' }}>
                <Plus size={22} />
              </Link>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <Loader2 className="animate-spin" size={48} color="var(--primary)" />
            </div>
          ) : (
            <div className="grid-responsive">
              {classes.map((cls) => (
                <Link href={`/session/${cls.id}`} key={cls.id} className="card glass" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem', margin: 0 }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '1.1rem', borderRadius: '18px', color: 'var(--primary)' }}>
                    <BookOpen size={32} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>{cls.batches?.name}</h3>
                    <p style={{ fontSize: '0.95rem', color: 'var(--muted-foreground)', fontWeight: 500 }}>{cls.subjects?.name}</p>
                  </div>
                  <div style={{ color: 'var(--muted-foreground)', background: 'rgba(255,255,255,0.06)', padding: '0.6rem', borderRadius: '50%' }}>
                    <ChevronRight size={22} />
                  </div>
                </Link>
              ))}
              {classes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--muted-foreground)', gridColumn: '1 / -1', background: 'rgba(255,255,255,0.02)', borderRadius: '24px' }}>
                  <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No classes assigned yet.</p>
                  {profile?.role === 'teacher' && <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Contact your administrator to get assigned to a batch.</p>}
                </div>
              )}
            </div>
          )}
        </section>

        <ConfirmDialog 
          isOpen={logoutConfirmOpen}
          onClose={() => setLogoutConfirmOpen(false)}
          onConfirm={signOut}
          title="Sign Out"
          message="Are you sure you want to log out of DarsPro? You will need to sign in again to manage your classes."
          confirmLabel="Log Out"
          type="danger"
        />

        <MobileNav />
      </div>
    </RoleGuard>
  );
}
