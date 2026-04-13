'use client';

import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

type RoleGuardProps = {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'teacher')[];
};

export const RoleGuard = ({ children, allowedRoles }: RoleGuardProps) => {
  const { profile, loading, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.push('/login');
      } else if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        router.push('/');
      }
    }
  }, [loading, session, profile, allowedRoles, router]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary)" />
      </div>
    );
  }

  if (!session) return null;
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) return null;

  return <>{children}</>;
};
