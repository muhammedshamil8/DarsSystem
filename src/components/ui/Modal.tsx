'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Lock scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="glass"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '450px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              borderRadius: '28px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              zIndex: 2001,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{title}</h2>
              <button 
                onClick={onClose}
                className="glass"
                style={{ padding: '0.5rem', borderRadius: '50%', color: 'var(--muted-foreground)' }}
              >
                <X size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
