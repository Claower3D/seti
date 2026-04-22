import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, X, ChevronRight, Settings, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
}

const MobileMenuDrawer: React.FC<Props> = ({ isOpen, onClose, user, onLogout }) => {
  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)',
              zIndex: 3000
            }}
          />

          {/* Shutter / Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(10, 12, 18, 0.98)',
              backdropFilter: 'blur(40px)',
              borderTop: '1px solid var(--border-bright)',
              borderRadius: '32px 32px 0 0',
              zIndex: 3001,
              padding: '12px 24px calc(24px + env(safe-area-inset-bottom, 12px))',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -20px 60px rgba(0, 0, 0, 0.8), var(--glow-strong)'
            }}
          >
            {/* Handle */}
            <div 
              onClick={onClose}
              style={{
                width: '40px',
                height: '5px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '2.5px',
                margin: '0 auto 24px',
                cursor: 'pointer'
              }} 
            />

            {/* Header / User Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <div style={{ position: 'relative' }}>
                <img 
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                  alt="" 
                  style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '20px', 
                    border: '2px solid var(--primary)',
                    boxShadow: 'var(--glow)'
                  }} 
                />
                <div style={{ 
                  position: 'absolute', 
                  bottom: '-2px', 
                  right: '-2px', 
                  width: '16px', 
                  height: '16px', 
                  background: '#00ff7f', 
                  borderRadius: '50%', 
                  border: '3px solid #0a0c12',
                  boxShadow: '0 0 10px #00ff7f'
                }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>{user.username}</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>System Active</p>
              </div>
              <button 
                onClick={onClose}
                style={{ marginLeft: 'auto', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '14px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Menu Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link 
                to={`/profile/${user.username}`} 
                onClick={onClose}
                style={{ textDecoration: 'none' }}
              >
                <div className="nav-item" style={{ width: 'auto', background: 'rgba(0, 245, 255, 0.05)', border: '1px solid rgba(0, 245, 255, 0.2)', padding: '16px 20px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.2s' }}>
                  <div style={{ background: 'var(--primary)', color: 'black', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--glow)' }}>
                    <User size={22} strokeWidth={2.5} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontWeight: '800', fontSize: '1.05rem' }}>Мой профиль</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Управление цифровым следом</div>
                  </div>
                  <ChevronRight size={18} style={{ color: 'var(--text-secondary)' }} />
                </div>
              </Link>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '16px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Settings size={20} style={{ color: 'white' }} />
                  <span style={{ color: 'white', fontWeight: '700', fontSize: '0.9rem' }}>Настройки</span>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '16px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Shield size={20} style={{ color: 'white' }} />
                  <span style={{ color: 'white', fontWeight: '700', fontSize: '0.9rem' }}>Защита</span>
                </div>
              </div>

              <div 
                onClick={() => { onLogout(); onClose(); }}
                className="nav-item" 
                style={{ width: 'auto', marginTop: '20px', background: 'rgba(255, 60, 60, 0.05)', border: '1px solid rgba(255, 60, 60, 0.2)', padding: '16px 20px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '14px', color: '#ff4d4d' }}
              >
                <LogOut size={20} />
                <span style={{ fontWeight: '800', fontSize: '1rem' }}>Выйти из системы</span>
              </div>
            </div>

            {/* Version Info */}
            <div style={{ marginTop: '32px', textAlign: 'center', opacity: 0.3, fontSize: '0.7rem', letterSpacing: '2px', fontWeight: '700', color: 'white' }}>
              SETI PROTOCOL V2.4.0
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenuDrawer;
