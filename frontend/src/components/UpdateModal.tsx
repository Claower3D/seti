import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

// Automatically injected by Vite at build time
declare const __COMMIT_HASH__: string;

export const UpdateModal = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Parse the backend URL (passed at build time) so we download from the exact origin
  const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : '';
  const DOWNLOAD_LINK = `${BASE_URL}/seti-app.apk`;

  useEffect(() => {
    // Only engage OTA logic if this is running as a physical downloaded App!
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const checkForUpdates = async () => {
      try {
        const res = await fetch('https://api.github.com/repos/Claower3D/seti/commits/main');
        const data = await res.json();
        
        // Ensure data is valid and hash hasn't broken
        if (data && data.sha && typeof __COMMIT_HASH__ !== 'undefined') {
          // If GitHub has a different newest SHA than our built SHA, an update exists!
          if (data.sha !== __COMMIT_HASH__ && __COMMIT_HASH__ !== 'unknown') {
             setUpdateAvailable(true);
          }
        }
      } catch (err) {
        console.error('OTA Error: Failed to check for updates:', err);
      }
    };

    // Minor delay so the app UI loads completely first
    setTimeout(() => {
      checkForUpdates();
    }, 2000);
  }, []);

  if (!updateAvailable) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 5, 10, 0.90)',
          backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 999999, padding: '20px'
        }}
      >
        <motion.div
           initial={{ scale: 0.85, y: 40 }}
           animate={{ scale: 1, y: 0 }}
           transition={{ type: "spring", stiffness: 300, damping: 20 }}
           className="glass-panel"
           style={{
             maxWidth: '420px', width: '100%', padding: '40px 24px',
             textAlign: 'center', border: '1px solid var(--primary)',
             boxShadow: 'var(--glow-strong)', position: 'relative', overflow: 'hidden'
           }}
        >
          {/* Animated Background Pulse */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ repeat: Infinity, duration: 3 }}
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '200px', height: '200px', background: 'var(--primary)', borderRadius: '50%', filter: 'blur(80px)', zIndex: 0, pointerEvents: 'none' }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="pulse" style={{ background: 'color-mix(in srgb, var(--primary), transparent 85%)', padding: '18px', borderRadius: '50%', display: 'inline-block', marginBottom: '24px', border: '1px solid var(--primary)' }}>
              <RefreshCw size={56} style={{ color: 'var(--primary)', filter: 'var(--glow)' }} />
            </div>
            
            <h2 className="neon-text" style={{ fontSize: '2rem', marginBottom: '16px', letterSpacing: '-1px' }}>Обновление Системы</h2>
            
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: 'rgba(0, 242, 255, 0.05)', padding: '16px', borderRadius: '12px', marginBottom: '24px', border: '1px solid rgba(0, 242, 255, 0.1)' }}>
               <ShieldCheck size={28} style={{ color: 'var(--primary)', flexShrink: 0 }} />
               <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0, fontSize: '0.95rem', textAlign: 'left' }}>
                  В репозитории GitHub найдена новейшая сборка матрицы. Требуется Over-The-Air синхронизация для стабильной работы.
               </p>
            </div>

            <a href={DOWNLOAD_LINK} download="seti-app.apk" style={{ textDecoration: 'none', display: 'block', marginBottom: '16px' }}>
               <button style={{
                   background: 'var(--primary)', color: 'black', width: '100%',
                   padding: '16px', borderRadius: '12px', border: 'none',
                   fontWeight: '900', fontSize: '1.2rem', cursor: 'pointer',
                   display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                   boxShadow: 'var(--glow)'
               }}>
                   <Download size={22} /> Закачать по воздуху (OTA)
               </button>
            </a>

            <button onClick={() => setUpdateAvailable(false)} style={{
                background: 'transparent', color: 'rgba(255,255,255,0.4)', width: '100%',
                padding: '12px', borderRadius: '12px', border: '1px solid transparent',
                fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = '#ff4d4d'; e.currentTarget.style.background = 'rgba(255,77,77,0.1)' }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'transparent' }}>
                <AlertTriangle size={18} /> Игнорировать уязвимость среды
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
