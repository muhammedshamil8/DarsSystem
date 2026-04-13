'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, LogOut, User, Mail, Shield, BookOpen, Loader2, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { supabase } from '@/lib/supabase';
import MobileNav from '@/components/layout/MobileNav';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

export default function ProfilePage() {
  const { profile, user, signOut } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    if (user && profile) {
      fetchAssignedClasses();
    }
  }, [user, profile]);

  const fetchAssignedClasses = async () => {
    setLoading(true);
    let query = supabase
      .from('batch_subjects')
      .select(`
        id,
        batches(name),
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

  return (
    <RoleGuard>
      <div className="container animate-fade-in">
        <header style={{ marginBottom: '2rem', marginTop: '1rem' }}>
          <Link href="/" className="glass" style={{ padding: '0.6rem', borderRadius: '50%', color: 'var(--muted-foreground)', display: 'inline-flex', marginBottom: '1.5rem' }}>
            <ChevronLeft size={24} />
          </Link>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Profile</h1>
        </header>

        <section style={{ marginBottom: '2.5rem' }}>
          <div className="card glass" style={{ margin: 0, padding: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '80px', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', opacity: 0.15 }}></div>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ width: '96px', height: '96px', margin: '0 auto 1.5rem', background: 'linear-gradient(135deg, var(--primary), #059669)', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: '2.5rem', boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.3)' }}>
                {profile?.name?.charAt(0) || 'U'}
              </div>
              
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{profile?.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', color: 'var(--muted-foreground)' }}>
                <Mail size={16} />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{user?.email}</span>
              </div>
              
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', background: 'var(--accent)', borderRadius: '100px', marginTop: '1.25rem' }}>
                <Shield size={14} color="var(--primary)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)' }}>{profile?.role} ACCOUNT</span>
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {profile?.role === 'admin' ? 'Managed Classes' : 'Assigned Classes'}
            </h3>
            <ClipboardList size={18} color="var(--muted-foreground)" />
          </div>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
              <Loader2 className="animate-spin" size={32} color="var(--primary)" />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {classes.map(cls => (
                <div key={cls.id} className="card glass" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '12px', color: 'var(--primary)' }}>
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, fontSize: '1rem' }}>{cls.batches?.name}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', fontWeight: 600 }}>{cls.subjects?.name}</p>
                  </div>
                </div>
              ))}
              {classes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>No classes assigned yet.</p>
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: '3rem' }}>
            <button 
              onClick={() => setLogoutConfirmOpen(true)}
              className="glass" 
              style={{ width: '100%', padding: '1.25rem', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', background: 'rgba(239, 68, 68, 0.05)' }}
            >
              <LogOut size={20} />
              Log Out of Account
            </button>
          </div>
        </section>

        <ConfirmDialog 
          isOpen={logoutConfirmOpen}
          onClose={() => setLogoutConfirmOpen(false)}
          onConfirm={signOut}
          title="Sign Out"
          message="Are you sure you want to log out? You will need to sign in again to access class registers."
          confirmLabel="Log Out"
          type="danger"
        />

        <MobileNav />
      </div>
    </RoleGuard>
  );
}
