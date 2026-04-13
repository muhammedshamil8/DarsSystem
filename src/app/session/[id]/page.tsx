'use client';

import { useState, useEffect } from 'react';
import SessionEngine from '@/components/session/SessionEngine';
import { ChevronLeft, Info, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { RoleGuard } from '@/components/auth/RoleGuard';

import { use } from 'react';

export default function SessionPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = use(paramsPromise);
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, [params.id]);

  const fetchDetails = async () => {
    const { data } = await supabase
      .from('batch_subjects')
      .select(`
        id,
        batches(name),
        subjects(name)
      `)
      .eq('id', params.id)
      .single();
    
    if (data) setDetails(data);
    setLoading(false);
  };

  return (
    <RoleGuard allowedRoles={['admin', 'teacher']}>
      <div className="container animate-fade-in">
        <header style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <Link href="/" className="glass" style={{ padding: '0.5rem', borderRadius: '50%', color: 'var(--muted-foreground)' }}>
              <ChevronLeft size={24} />
            </Link>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Smart Register</h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>Daily Class Entry</p>
            </div>
          </div>
          
          {loading ? (
            <div className="card glass" style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 className="animate-spin" size={24} color="var(--primary)" />
            </div>
          ) : (
            <div className="card glass" style={{ marginBottom: 0, padding: '1rem 1.25rem', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{details?.batches?.name}</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Subject: {details?.subjects?.name}</p>
                </div>
                <div className="glass" style={{ padding: '0.5rem', borderRadius: '10px' }}>
                  <Info size={18} color="var(--primary)" />
                </div>
              </div>
            </div>
          )}
        </header>

        <SessionEngine batchSubjectId={params.id} />
      </div>
    </RoleGuard>
  );
}
