'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  type = 'warning'
}: ConfirmDialogProps) {
  
  const getColors = () => {
    switch(type) {
      case 'danger': return { primary: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
      case 'info': return { primary: 'var(--primary)', bg: 'rgba(16, 185, 129, 0.1)' };
      default: return { primary: 'var(--secondary)', bg: 'rgba(217, 119, 6, 0.1)' };
    }
  };

  const colors = getColors();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '50%', background: colors.bg, color: colors.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
        }}>
          <AlertCircle size={32} />
        </div>
        
        <p style={{ color: 'var(--muted-foreground)', marginBottom: '2rem', fontSize: '1rem', lineHeight: 1.5 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
          <button 
            onClick={onClose}
            className="glass"
            style={{ flex: 1, padding: '1rem', borderRadius: '16px', fontWeight: 600, color: 'var(--muted-foreground)' }}
          >
            {cancelLabel}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="btn-primary"
            style={{ 
              flex: 1, 
              background: colors.primary, 
              boxShadow: type === 'danger' ? '0 8px 20px -5px rgba(239, 68, 68, 0.4)' : undefined 
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
