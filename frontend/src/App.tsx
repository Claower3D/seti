import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { CallProvider } from './context/CallContext';
import { UpdateModal } from './components/UpdateModal';
import LoadingScreen from './components/LoadingScreen';
import ErrorPlaceholder from './components/ErrorPlaceholder';
import SetiLogo from './components/SetiLogo';
import MobileMenuDrawer from './components/MobileMenuDrawer';
import { MusicProvider } from './context/MusicContext';
import { MusicPlayer } from './components/MusicPlayer';
import { StartupScreen } from './components/StartupScreen';

// Lazy load pages for performance (SETI Optimization)
const FeedPage = React.lazy(() => import('./pages/FeedPage').then(m => ({ default: m.FeedPage })));
const MessagesPage = React.lazy(() => import('./pages/MessagesPage').then(m => ({ default: m.MessagesPage })));
const FriendsPage = React.lazy(() => import('./pages/FriendsPage').then(m => ({ default: m.FriendsPage })));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const GroupsPage = React.lazy(() => import('./pages/GroupsPage').then(m => ({ default: m.GroupsPage })));
const WavesPage = React.lazy(() => import('./pages/WavesPage').then(m => ({ default: m.WavesPage })));
const MusicPage = React.lazy(() => import('./pages/MusicPage').then(m => ({ default: m.MusicPage })));
const AppDownloadPage = React.lazy(() => import('./pages/AppDownloadPage').then(m => ({ default: m.AppDownloadPage })));
const { LoginPage, RegisterPage } = { 
  LoginPage: React.lazy(() => import('./pages/AuthPages').then(m => ({ default: m.LoginPage }))),
  RegisterPage: React.lazy(() => import('./pages/AuthPages').then(m => ({ default: m.RegisterPage })))
};
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Home, MessageSquare, Users, User, LogOut, Bell, Search, Check, X, Radio, ArrowDownCircle, Plus, LayoutGrid, Music } from 'lucide-react';
import api from './api/client';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  if (!user) return null;
  const navItems = [
    { name: 'Новости', icon: Home, path: '/' },
    { name: 'Сообщения', icon: MessageSquare, path: '/messages' },
    { name: 'Друзья', icon: Users, path: '/friends' },
    { name: 'Группы', icon: LayoutGrid, path: '/groups' },
    { name: 'Волны', icon: Radio, path: '/waves' },
    { name: 'Музыка', icon: Music, path: '/music' },
    { name: 'Мой профиль', icon: User, path: `/profile/${user.username}` },
    { name: 'Приложение', icon: ArrowDownCircle, path: '/app' },
  ];
  return (
    <div className="sidebar">
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 8px' }}>
        <div style={{ flexShrink: 0 }}>
          <SetiLogo size={36} />
        </div>
        <span style={{ 
          fontSize: '1.4rem', 
          fontWeight: '900', 
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent', 
          letterSpacing: '1px' 
        }}>SETI</span>
      </div>
      
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link to={item.path} key={item.name} style={{ textDecoration: 'none' }}>
              <div className={`nav-item ${isActive ? 'active' : ''}`}>
                <item.icon size={20} />
                <span>{item.name}</span>
                {item.name === 'Сообщения' && unreadCount > 0 && (
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    style={{ 
                      marginLeft: 'auto', 
                      background: 'var(--primary)', 
                      color: 'black', 
                      fontSize: '0.65rem', 
                      fontWeight: '900', 
                      padding: '2px 6px', 
                      borderRadius: '8px', 
                      boxShadow: 'var(--glow)'
                    }}
                  >
                    {unreadCount}
                  </motion.div>
                )}
              </div>
            </Link>
          );
        })}
      </nav>
      
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Link to={`/profile/${user.username}`} style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: 'var(--radius-sm)', transition: 'background 0.2s' }}>
            <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
              style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border-bright)' }} alt="" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '600' }}>ONLINE</div>
            </div>
          </div>
        </Link>
        <button onClick={logout} className="nav-item" style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}>
          <LogOut size={18} />
          <span>Выйти</span>
        </button>
      </div>
    </div>
  );
};

const Header = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const prevReqsRef = useRef<number[]>([]);
  const prevNotifsRef = useRef<number[]>([]);

  const fetchData = async () => {
    try { 
      const [reqRes, notifRes] = await Promise.all([
        api.get('/friends/requests'),
        api.get('/notifications')
      ]);
      const newRequests = reqRes.data || [];
      const newNotifications = notifRes.data || [];

      if (Capacitor.isNativePlatform() && prevReqsRef.current.length > 0) {
          newRequests.forEach((req: any) => {
              if (!prevReqsRef.current.includes(req.id)) {
                  LocalNotifications.schedule({
                      notifications: [{
                          title: "Заявка в друзья", body: `${req.username} хочет добавить вас в друзья`, id: Math.floor(Math.random() * 100000), schedule: { at: new Date(Date.now() + 100) }
                      }]
                  }).catch(console.error);
              }
          });
      }

      if (Capacitor.isNativePlatform() && prevNotifsRef.current.length > 0) {
          newNotifications.forEach((notif: any) => {
              if (!prevNotifsRef.current.includes(notif.id)) {
                  let alertBody = notif.type === 'like' ? 'Оценил вашу Волну' : 'Оставил комментарий';
                  LocalNotifications.schedule({
                      notifications: [{
                          title: `Событие от @${notif.sender?.username || 'Друга'}`, body: alertBody, id: Math.floor(Math.random() * 100000), schedule: { at: new Date(Date.now() + 100) }
                      }]
                  }).catch(console.error);
              }
          });
      }

      prevReqsRef.current = newRequests.map((r: any) => r.id);
      prevNotifsRef.current = newNotifications.map((n: any) => n.id);

      setRequests(newRequests);
      setNotifications(newNotifications);
    } catch { 
      setRequests([]); 
      setNotifications([]);
    }
  };

  const acceptRequest = async (id: number) => { await api.post('/friends/accept/' + id); fetchData(); };
  const declineRequest = async (id: number) => { await api.delete('/friends/request/' + id); fetchData(); };
  const markRead = async (id: number) => { 
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch {}
  };

  useEffect(() => {
    if (user) { 
      fetchData(); 
      const t = setInterval(fetchData, 15000); 
      return () => clearInterval(t); 
    }
  }, [user]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      LocalNotifications.requestPermissions().catch(console.error);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    };
    if (showNotifs) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifs]);

  if (!user) return null;

  const unreadCount = requests.length + notifications.filter(n => !n.read).length;

  return (
    <div className="glass-panel" style={{ 
      padding: '10px 16px', 
      marginBottom: '20px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      borderRadius: 'var(--radius-sm)', 
      gap: '12px',
      position: 'relative',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
        <div className="mobile-only" style={{ flexShrink: 0 }}>
          <SetiLogo size={28} />
        </div>
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input type="text" className="input-field" placeholder="Поиск в SETI..." style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }} />
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button onClick={() => setShowNotifs(!showNotifs)}
            className={unreadCount > 0 ? 'pulse' : ''}
            style={{ 
              background: unreadCount > 0 ? 'color-mix(in srgb, var(--primary), transparent 90%)' : 'transparent', 
              border: unreadCount > 0 ? '1px solid var(--border-bright)' : '1px solid transparent', 
              cursor: 'pointer', 
              color: unreadCount > 0 ? 'var(--primary)' : 'var(--text-secondary)', 
              padding: '8px', 
              borderRadius: '10px', 
              transition: 'all 0.2s', 
              display: 'flex' 
            }}>
            <Bell size={20} />
            {unreadCount > 0 && (
              <div style={{ 
                position: 'absolute', top: '2px', right: '2px', 
                background: 'var(--accent)', borderRadius: '50%', 
                width: '16px', height: '16px', fontSize: '0.6rem', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                color: 'white', fontWeight: '800', boxShadow: '0 0 10px var(--accent)' 
              }}>
                {unreadCount}
              </div>
            )}
          </button>
          
          <AnimatePresence>
            {showNotifs && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="glass-panel" 
                style={{ 
                  position: 'absolute', right: 0, top: '50px', 
                  width: 'calc(100vw - 32px)', maxWidth: '340px', 
                  zIndex: 1000, padding: '16px', 
                  background: 'rgba(5, 5, 15, 0.98)', 
                  boxShadow: '0 20px 60px rgba(0,0,0,0.8), var(--glow)', 
                  maxHeight: '400px', overflowY: 'auto' 
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Уведомления</div>
                
                {requests.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    {requests.map((r) => (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '8px' }}>
                        <img src={r.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.username}`} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
                        <span style={{ flex: 1, fontSize: '0.8rem', fontWeight: '600' }}>{r.username}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => acceptRequest(r.id)} style={{ background: 'var(--primary)', color: 'black', border: 'none', borderRadius: '4px', padding: '4px' }}><Check size={14} /></button>
                          <button onClick={() => declineRequest(r.id)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px' }}><X size={14} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {notifications.length === 0 && requests.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Нет новых уведомлений</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} onClick={() => !n.read && markRead(n.id)} style={{ display: 'flex', gap: '10px', padding: '10px', borderRadius: '8px', background: n.read ? 'transparent' : 'rgba(0, 245, 255, 0.05)', marginBottom: '4px', cursor: 'pointer' }}>
                      <img src={n.sender?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${n.sender?.username}`} style={{ width: '28px', height: '28px', borderRadius: '50%' }} alt="" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                          <span style={{ fontWeight: '700' }}>{n.sender?.username}</span> {n.type === 'like' ? 'лайкнул вашу Волну' : 'прокомментировал вашу Волну'}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <Link to={`/profile/${user.username}`} style={{ display: 'flex' }}>
          <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt=""
            style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2px solid var(--border-bright)', boxShadow: 'var(--glow)' }} />
        </Link>
      </div>
    </div>
  );
};

const MobileNav = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu on navigation
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const isWavesPage = location.pathname === '/waves';
  if (!user) return null;

  const navItems = [
    { to: '/', icon: Home, label: 'Лента' },
    { to: '/messages', icon: MessageSquare, label: 'Чаты' },
    { to: '/waves', icon: Radio, label: 'Волны', isMiddle: true },
    { to: '/friends', icon: Users, label: 'Друзья' },
    { to: '#menu', icon: LayoutGrid, label: 'Меню', isMenuTrigger: true },
  ];

  const handlePlusClick = (e: React.MouseEvent) => {
    if (isWavesPage) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('trigger-wave-upload'));
    }
  };

  return (
    <>
      <nav className="mobile-nav">
        {navItems.map(({ to, icon: Icon, label, isMiddle, isMenuTrigger }) => {
          const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
          
          if (isMiddle && isWavesPage) {
            return (
              <button key="plus" onClick={handlePlusClick} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', outline: 'none', padding: '0 8px', position: 'relative', marginTop: '-12px' }}>
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{ 
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))', 
                    borderRadius: '18px', 
                    width: '56px', 
                    height: '42px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    boxShadow: 'var(--glow-strong)', 
                    border: '1px solid rgba(255,255,255,0.3)' 
                  }}
                >
                  <Plus size={30} color="black" strokeWidth={3} />
                </motion.div>
              </button>
            );
          }

          if (isMenuTrigger) {
            return (
              <button 
                key="menu" 
                onClick={() => setIsMenuOpen(true)}
                style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer', outline: 'none', color: isMenuOpen ? 'var(--primary)' : 'var(--text-secondary)' }}
              >
                <Icon size={22} style={{ filter: isMenuOpen ? 'var(--glow)' : 'none' }} />
                <span style={{ fontSize: '0.65rem', fontWeight: isMenuOpen ? '800' : '500' }}>{label}</span>
              </button>
            );
          }

          return (
            <Link key={to} to={to} className={isActive ? 'active' : ''}>
              <Icon size={22} /><span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <MobileMenuDrawer 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
        user={user} 
        onLogout={logout} 
      />
    </>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
};

function AppInner() {
  const location = useLocation();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasCompletedStartup, setHasCompletedStartup] = useState(sessionStorage.getItem('startup_complete') === 'true');
  const isWavesPage = location.pathname === '/waves';

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOffline) {
    return <div style={{ height: '100vh', background: '#050510', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ErrorPlaceholder type="offline" /></div>;
  }

  return (
    <AnimatePresence mode="wait">
      {!hasCompletedStartup ? (
        <motion.div
          key="startup"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <StartupScreen onComplete={() => {
            setHasCompletedStartup(true);
            sessionStorage.setItem('startup_complete', 'true');
          }} />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="main-layout"
        >
          <div className="hologram-container">
            <div className="hologram-core" />
            <div className="hologram-radar" />
            <div className="hologram-ring" />
            <div className="hologram-ring" />
            <div className="hologram-ring" />
            <div className="hologram-ring" />
            <div className="hologram-ring" />
          </div>

          <Sidebar />
          <div 
            style={{ 
              flex: 1, 
              minWidth: 0
            }} 
            className={`main-content ${isWavesPage ? 'waves-layout' : ''}`}
          >
            <div className="desktop-only">
              <Header />
            </div>
            {!isWavesPage && (
              <div className="mobile-only">
                <Header />
              </div>
            )}
            <AnimatePresence mode="wait">
              <React.Suspense fallback={<LoadingScreen />}>
                <Routes location={location} key={location.pathname}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
                  <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
                  <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
                  <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
                  <Route path="/waves" element={<ProtectedRoute><WavesPage /></ProtectedRoute>} />
                  <Route path="/music" element={<ProtectedRoute><MusicPage /></ProtectedRoute>} />
                  <Route path="/profile/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="/app" element={<ProtectedRoute><AppDownloadPage /></ProtectedRoute>} />
                  <Route path="*" element={<ErrorPlaceholder type="404" />} />
                </Routes>
              </React.Suspense>
            </AnimatePresence>
          </div>
          <MusicPlayer />
          <div className="mobile-only">
            <MobileNav />
          </div>
          <UpdateModal />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const Root = () => (
  <BrowserRouter>
    <AuthProvider>
      <NotificationProvider>
        <CallProvider>
          <MusicProvider>
            <AppInner />
          </MusicProvider>
        </CallProvider>
      </NotificationProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default Root;
