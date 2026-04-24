import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, ChevronRight, Settings, Shield, 
  Home, MessageSquare, Users, Radio, ArrowDownCircle, 
  LayoutGrid, Bookmark, Image, Music, Gamepad2, GraduationCap, 
  Phone
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
}

const MobileMenuDrawer: React.FC<Props> = ({ isOpen, onClose, user, onLogout }) => {
  if (!user) return null;

  const menuServices = [
    { name: 'Новости', icon: Home, path: '/', color: '#00f5ff' },
    { name: 'Чаты', icon: MessageSquare, path: '/messages', color: '#00ccff', badge: 0 },
    { name: 'Друзья', icon: Users, path: '/friends', color: '#7b61ff' },
    { name: 'Волны', icon: Radio, path: '/waves', color: '#ff0090' },
    { name: 'Группы', icon: LayoutGrid, path: '/groups', color: '#ffcc00' },
    { name: 'Приложение', icon: ArrowDownCircle, path: '/app', color: '#00ff88' },
    { name: 'Музыка', icon: Music, path: '/music', color: '#ff4d4d' },
    { name: 'Фото', icon: Image, path: '#photos', color: '#ff8800', isPlaceholder: true },
    { name: 'Закладки', icon: Bookmark, path: '#bookmarks', color: '#b400ff', isPlaceholder: true },
    { name: 'Игры', icon: Gamepad2, path: '#games', color: '#00ffcc', isPlaceholder: true },
    { name: 'Звонки', icon: Phone, path: '#calls', color: '#00ff7f', isPlaceholder: true },
    { name: 'Обучение', icon: GraduationCap, path: '#learn', color: '#ff00ff', isPlaceholder: true },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Ends above mobile-nav to allow clicking nav items */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: '64px',
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)',
              zIndex: 1900
            }}
          />

          {/* Full VK-Style Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            dragSnapToOrigin
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            style={{
              position: 'fixed',
              bottom: '64px',
              left: 0,
              right: 0,
              top: '40px', // Allow a bit of space at top for "shutter" feel
              background: 'rgba(10, 12, 18, 0.98)',
              backdropFilter: 'blur(40px)',
              borderTop: '1px solid var(--border-bright)',
              borderRadius: '32px 32px 0 0',
              zIndex: 1901,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -20px 60px rgba(0, 0, 0, 0.8), var(--glow-strong)',
              overflow: 'hidden'
            }}
          >
            {/* Handle / Drag Indicator */}
            <div 
              onClick={onClose}
              style={{
                width: '40px',
                height: '5px',
                background: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '2.5px',
                margin: '12px auto',
                cursor: 'pointer',
                flexShrink: 0
              }} 
            />

            {/* Scrollable Container */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 40px' }} className="hide-scrollbar">
              
              {/* Profile Bar */}
              <div style={{ 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: '24px', 
                padding: '16px', 
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <img 
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                  alt="" 
                  style={{ width: '56px', height: '56px', borderRadius: '18px', border: '1px solid var(--primary)' }} 
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '900', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</h3>
                  <Link to={`/profile/${user.username}`} onClick={onClose} style={{ color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    Перейти в профиль <ChevronRight size={14} />
                  </Link>
                </div>
                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  <Settings size={20} color="white" />
                </div>
              </div>

              {/* Service Grid Section */}
              <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px', paddingLeft: '8px' }}>
                Сервисы SETI
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
                {menuServices.map((service, idx) => (
                  <Link 
                    key={idx} 
                    to={service.isPlaceholder ? '#' : service.path} 
                    onClick={service.isPlaceholder ? (e) => e.preventDefault() : onClose}
                    style={{ textDecoration: 'none' }}
                  >
                    <motion.div 
                      whileTap={{ scale: 0.95 }}
                      style={{ 
                        background: 'rgba(255,255,255,0.02)', 
                        border: '1px solid rgba(255,255,255,0.04)', 
                        borderRadius: '20px', 
                        padding: '16px 8px', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center', 
                        gap: '10px',
                        opacity: service.isPlaceholder ? 0.4 : 1,
                        filter: service.isPlaceholder ? 'grayscale(0.5)' : 'none'
                      }}>
                      <div style={{ 
                        width: '44px', 
                        height: '44px', 
                        borderRadius: '14px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        background: `color-mix(in srgb, ${service.color}, transparent 88%)`,
                        color: service.color,
                        boxShadow: `0 0 15px ${service.color}22`
                      }}>
                        <service.icon size={24} />
                      </div>
                      <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: '700', textAlign: 'center' }}>{service.name}</span>
                    </motion.div>
                  </Link>
                ))}
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ padding: '16px 20px', borderRadius: '18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '14px', color: 'rgba(255,255,255,0.7)' }}>
                  <Shield size={20} />
                  <span style={{ fontWeight: '600', fontSize: '0.95rem', flex: 1 }}>Безопасность</span>
                  <ChevronRight size={16} opacity={0.3} />
                </div>
                <div 
                  onClick={() => { onLogout(); onClose(); }}
                  style={{ padding: '16px 20px', borderRadius: '18px', background: 'rgba(255, 60, 60, 0.05)', border: '1px solid rgba(255, 60, 60, 0.1)', display: 'flex', alignItems: 'center', gap: '14px', color: '#ff4d4d', marginTop: '12px' }}
                >
                  <LogOut size={20} />
                  <span style={{ fontWeight: '800', fontSize: '0.95rem' }}>Выйти из аккаунта</span>
                </div>
              </div>

              {/* Version */}
              <div style={{ textAlign: 'center', marginTop: '40px', opacity: 0.2, fontSize: '0.65rem', fontWeight: '800', letterSpacing: '3px' }}>
                SETI PROTOCOL V2.5.0
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenuDrawer;
