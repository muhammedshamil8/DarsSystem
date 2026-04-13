'use client';

import { useState, createContext, useContext, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position: 'fixed', bottom: '100px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '90%', maxWidth: '400px', pointerEvents: 'none' }}>
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              style={{ 
                pointerEvents: 'auto',
                background: 'rgba(5, 20, 13, 0.95)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${toast.type === 'success' ? 'var(--primary)' : toast.type === 'error' ? 'var(--error)' : 'var(--secondary)'}`,
                borderRadius: '16px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 10px 30px -5px rgba(0,0,0,0.5)',
                color: 'white'
              }}
            >
              {toast.type === 'success' && <CheckCircle2 size={20} color="var(--primary)" />}
              {toast.type === 'error' && <AlertCircle size={20} color="var(--error)" />}
              {toast.type === 'info' && <Info size={20} color="var(--secondary)" />}
              
              <p style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600 }}>{toast.message}</p>
              
              <button onClick={() => removeToast(toast.id)} style={{ color: 'var(--muted-foreground)', padding: '0.25rem' }}>
                <X size={18} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
