import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { FeedPage } from './pages/FeedPage';
import { MessagesPage } from './pages/MessagesPage';
import { FriendsPage } from './pages/FriendsPage';
import { ProfilePage } from './pages/ProfilePage';
import { GroupsPage } from './pages/GroupsPage';
import { WavesPage } from './pages/WavesPage';
import { AppDownloadPage } from './pages/AppDownloadPage';
import { Home, MessageSquare, Users, User, LogOut, Bell, Search, Zap, Check, X, Radio, ArrowDownCircle, Plus } from 'lucide-react';
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
    { name: 'Волны', icon: Radio, path: '/waves' },
    { name: 'Мой профиль', icon: User, path: `/profile/${user.username}` },
    { name: 'Приложение', icon: ArrowDownCircle, path: '/app' },
  ];
  return (
    <div className="sidebar glass-panel">
      <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 4px' }}>
        <div className="pulse" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary), transparent 80%), color-mix(in srgb, var(--secondary), transparent 80%))', border: '1px solid var(--border-bright)', padding: '10px', borderRadius: '12px', boxShadow: 'var(--glow)' }}>
          <Zap color="var(--primary)" size={22} style={{ filter: 'var(--glow)' }} />
        </div>
        <span style={{ fontSize: '1.6rem', fontWeight: '900', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>SETI</span>
      </div>
      <nav style={{ flex: 1 }}>
        {navItems.map((item) => (
          <Link to={item.path} key={item.name} style={{ textDecoration: 'none' }}>
            <div className={`nav-item ${location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)) ? 'active' : ''}`}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
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
                      padding: '2px 8px', 
                      borderRadius: '10px', 
                      boxShadow: 'var(--glow)',
                      textShadow: 'none'
                    }}
                  >
                    {unreadCount}
                  </motion.div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </nav>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', marginBottom: '6px' }}>
          <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
            style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border-bright)' }} alt="" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: '900', color: 'var(--primary)', textShadow: 'var(--glow)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: '700' }}>● Online Signal</div>
          </div>
        </div>
        <div className="nav-item" onClick={logout} style={{ color: 'rgba(255,60,60,0.7)', borderColor: 'transparent' }}>
          <LogOut size={18} /><span>Выйти</span>
        </div>
      </div>
    </div>
  );
};

const Header = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  const fetchData = async () => {
    try { 
      const [reqRes, notifRes] = await Promise.all([
        api.get('/friends/requests'),
        api.get('/notifications')
      ]);
      setRequests(reqRes.data || []);
      setNotifications(notifRes.data || []);
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
    if (user) { fetchData(); const t = setInterval(fetchData, 15000); return () => clearInterval(t); }
  }, [user]);

  if (!user) return null;

  const unreadCount = requests.length + notifications.filter(n => !n.read).length;

  return (
    <div className="glass-panel" style={{ padding: '12px 20px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 'var(--radius)' }}>
      <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
        <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input type="text" className="input-field" placeholder="Поиск в SETI..." style={{ paddingLeft: '40px', padding: '10px 16px 10px 40px', fontSize: '0.85rem' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginLeft: '16px' }}>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNotifs(!showNotifs)}
            className={unreadCount > 0 ? 'pulse' : ''}
            style={{ 
              background: unreadCount > 0 ? 'color-mix(in srgb, var(--primary), transparent 90%)' : 'transparent', 
              border: unreadCount > 0 ? '1px solid var(--border-bright)' : '1px solid transparent', 
              cursor: 'pointer', 
              color: unreadCount > 0 ? 'var(--primary)' : 'var(--text-secondary)', 
              padding: '8px', 
              borderRadius: '12px', 
              position: 'relative', 
              transition: 'all 0.3s', 
              display: 'flex' 
            }}>
            <Bell size={20} style={{ filter: unreadCount > 0 ? 'var(--glow)' : 'none' }} />
            {unreadCount > 0 && (
              <div style={{ position: 'absolute', top: '4px', right: '4px', background: 'var(--primary)', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.58rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: '900', boxShadow: 'var(--glow)' }}>
                {unreadCount}
              </div>
            )}
          </button>
          <AnimatePresence>
          {showNotifs && (
            <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.96 }}
              className="glass-panel" style={{ position: 'absolute', right: 0, top: '48px', width: '320px', zIndex: 1000, padding: '18px', background: 'rgba(10, 12, 20, 0.95)', border: '1px solid var(--border-bright)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 60px rgba(0,0,0,0.9), var(--glow)', maxHeight: '450px', overflowY: 'auto' }}>
              
              {/* Friend Requests Section */}
              <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--primary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={12} /> Заявки в друзья
              </div>
              {requests.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '20px' }}>Нет новых заявок</p>
              ) : requests.map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '10px' }}>
                  <img src={r.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + r.username} alt=""
                    style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--border)' }} />
                  <span style={{ flex: 1, fontWeight: '600', fontSize: '0.8rem', color: 'white' }}>{r.username}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => acceptRequest(r.id)} style={{ background: 'color-mix(in srgb, var(--primary), transparent 90%)', border: '1px solid var(--border-bright)', borderRadius: '6px', padding: '4px', cursor: 'pointer', color: 'var(--primary)' }}><Check size={14} /></button>
                    <button onClick={() => declineRequest(r.id)} style={{ background: 'rgba(255,0,144,0.1)', border: '1px solid rgba(255,0,144,0.3)', borderRadius: '6px', padding: '4px', cursor: 'pointer', color: '#ff0090' }}><X size={14} /></button>
                  </div>
                </div>
              ))}

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '16px 0' }} />

              {/* Social Notifications Section */}
              <div style={{ fontSize: '0.7rem', fontWeight: '800', color: '#b400ff', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={12} /> Уведомления
              </div>
              {notifications.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Нет новых событий</p>
              ) : notifications.map((n) => (
                <div 
                  key={n.id} 
                  onClick={() => !n.read && markRead(n.id)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '10px', 
                    marginBottom: '10px', 
                    padding: '10px', 
                    borderRadius: '10px', 
                    background: n.read ? 'transparent' : 'rgba(180, 0, 255, 0.08)',
                    border: n.read ? '1px solid transparent' : '1px solid rgba(180, 0, 255, 0.2)',
                    cursor: n.read ? 'default' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <img src={n.sender?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + n.sender?.username} alt=""
                    style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(180,0,255,0.3)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: 'white' }}>
                      <span style={{ fontWeight: '800' }}>@{n.sender?.username}</span> {n.type === 'like' ? 'оценил вашу Волну' : 'прокомментировал вашу Волну'}
                    </div>
                    {n.content && (
                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px', fontStyle: 'italic', borderLeft: '2px solid rgba(180,0,255,0.3)', paddingLeft: '8px' }}>
                        "{n.content}"
                      </div>
                    )}
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {!n.read && <div style={{ width: '6px', height: '6px', background: '#b400ff', borderRadius: '50%', marginTop: '5px', boxShadow: '0 0 8px #b400ff' }} />}
                </div>
              ))}
            </motion.div>
          )}
          </AnimatePresence>
        </div>
        <Link to={`/profile/${user.username}`}>
          <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt=""
            style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2px solid var(--border-bright)', boxShadow: 'var(--glow)', cursor: 'pointer' }} />
        </Link>
      </div>
    </div>
  );
};

const MobileNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isWavesPage = location.pathname === '/waves';
  if (!user) return null;

  const navItems = [
    { to: '/', icon: Home, label: 'Лента' },
    { to: '/messages', icon: MessageSquare, label: 'Чаты' },
    { to: '/waves', icon: Radio, label: 'Волны', isMiddle: true },
    { to: '/friends', icon: Users, label: 'Друзья' },
    { to: `/profile/${user.username}`, icon: User, label: 'Профиль' },
  ];

  const handlePlusClick = (e: React.MouseEvent) => {
    if (isWavesPage) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('trigger-wave-upload'));
    }
  };

  return (
    <nav className="mobile-nav">
      {navItems.map(({ to, icon: Icon, label, isMiddle }) => {
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

        return (
          <Link key={to} to={to} className={isActive ? 'active' : ''}>
            <Icon size={22} /><span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="glass-panel" style={{ padding: '28px 48px', display: 'flex', alignItems: 'center', gap: '18px', border: '1px solid var(--border-bright)' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{ width: '28px', height: '28px', border: '2px solid transparent', borderTopColor: 'var(--primary)', borderRadius: '50%', boxShadow: 'var(--glow)' }} />
        <span style={{ color: 'var(--primary)', fontWeight: '900', textShadow: 'var(--glow)', fontSize: '1rem', letterSpacing: '1px' }}>Загрузка SETI...</span>
      </div>
    </div>
  );
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
};

function AppInner() {
  const location = useLocation();
  const isWavesPage = location.pathname === '/waves';

  return (
    <div className="main-layout">
      <Sidebar />
      <div 
        style={{ flex: 1, minWidth: 0 }} 
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
          <Routes location={location} key={location.pathname}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
            <Route path="/waves" element={<ProtectedRoute><WavesPage /></ProtectedRoute>} />
            <Route path="/profile/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/app" element={<ProtectedRoute><AppDownloadPage /></ProtectedRoute>} />
          </Routes>
        </AnimatePresence>
      </div>
      <MobileNav />
    </div>
  );
}

const Root = () => (
  <BrowserRouter>
    <AuthProvider>
      <NotificationProvider>
        <AppInner />
      </NotificationProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default Root;