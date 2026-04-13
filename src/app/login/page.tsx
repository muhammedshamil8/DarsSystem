'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div
      className="container animate-fade-in"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center", // THIS is what you're missing mentally
        minHeight: "100vh",
        padding: "2rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--primary)" }}>
            DarsPro
          </h1>
          <p style={{ color: "var(--muted-foreground)" }}>
            Sign in to manage your Dars
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="glass"
          style={{
            padding: "2rem",
            borderRadius: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
          }}
        >
          {error && (
          <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.875rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div className="input-group">
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', marginLeft: '0.5rem' }}>Email Address</label>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            <input
              type="email"
              placeholder="usthad@example.com"
              className="input-field"
              style={{ paddingLeft: '3rem' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', marginLeft: '0.5rem' }}>Password</label>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-foreground)' }} />
            <input
              type="password"
              placeholder="••••••••"
              className="input-field"
              style={{ paddingLeft: '3rem' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', height: '3.5rem' }}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1.5rem" }}>
          Contact Admin if you don't have an account.
        </p>

      </div>
    </div>
  );
}
