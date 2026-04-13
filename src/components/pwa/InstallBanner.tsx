'use client';

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show banner if not already installed and we're on a compatible browser
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also check if app is already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          style={{ 
            position: 'fixed', 
            bottom: '90px', 
            left: '1rem', 
            right: '1rem', 
            zIndex: 100,
          }}
        >
          <div className="card glass" style={{ 
            margin: 0, 
            padding: '1rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            border: '1px solid var(--primary)',
            background: 'rgba(16, 185, 129, 0.1)',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ background: 'var(--primary)', color: 'white', padding: '0.6rem', borderRadius: '12px' }}>
              <Download size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 800 }}>Install DarsPro</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Add to home screen for a better experience.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={handleInstallClick} 
                className="btn-primary" 
                style={{ height: '2.5rem', padding: '0 1rem', fontSize: '0.8rem', borderRadius: '10px' }}
              >
                Install
              </button>
              <button onClick={() => setShowBanner(false)} style={{ color: 'var(--muted-foreground)' }}>
                <X size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
