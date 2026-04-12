import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { FeedPage } from './pages/FeedPage';
import { MessagesPage } from './pages/MessagesPage';
import { FriendsPage } from './pages/FriendsPage';
import { ProfilePage } from './pages/ProfilePage';
import { Home, MessageSquare, Users, User, LogOut, Bell, Search, Compass, Check, X } from 'lucide-react';
import api from './api/client';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  if (!user) return null;
  const navItems = [
    { name: 'Новости', icon: Home, path: '/' },
    { name: 'Сообщения', icon: MessageSquare, path: '/messages' },
    { name: 'Друзья', icon: Users, path: '/friends' },
    { name: 'Мой профиль', icon: User, path: `/profile/${user.username}` },
  ];
  return (
    <div className="sidebar glass-panel">
      <div style={{ marginBottom: '48px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div className="pulse" style={{ background: 'var(--primary-color)', padding: '12px', borderRadius: '14px', boxShadow: 'var(--neon-glow)' }}>
          <Compass color="black" size={26} />
        </div>
        <span style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-1px' }} className="neon-text">SETI</span>
      </div>
      <nav style={{ flex: 1 }}>
        {navItems.map((item) => (
          <Link to={item.path} key={item.name} style={{ textDecoration: 'none' }}>
            <div className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}>
              <item.icon size={22} strokeWidth={location.pathname === item.path ? 2.5 : 2} />
              <span>{item.name}</span>
            </div>
          </Link>
        ))}
      </nav>
      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
        <div className="nav-item" onClick={logout} style={{ color: '#ff4d4d' }}>
          <LogOut size={22} />
          <span>Выйти</span>
        </div>
      </div>
    </div>
  );
};

const Header = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/friends/requests');
      setRequests(res.data || []);
    } catch { setRequests([]); }
  };

  const acceptRequest = async (id: number) => {
    await api.post('/friends/accept/' + id);
    fetchRequests();
  };

  const declineRequest = async (id: number) => {
    try { await api.delete('/friends/request/' + id); } catch {}
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  useEffect(() => {
    if (user) {
      fetchRequests();
      const interval = setInterval(fetchRequests, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="glass-panel" style={{ width: '100%', padding: '12px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: '0 0 24px 24px' }}>
      <div style={{ position: 'relative', flex: 1, maxWidth: '500px' }}>
        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input type="text" className="input-field" placeholder="Поиск в SETI..." style={{ paddingLeft: '48px', height: '48px' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginLeft: '20px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'relative', cursor: 'pointer', padding: '10px', borderRadius: '12px', transition: 'var(--transition)' }} 
               className={requests.length > 0 ? 'pulse' : ''}
               onClick={() => setShowNotifs(!showNotifs)}>
            <Bell size={24} style={{ color: requests.length > 0 ? 'var(--primary-color)' : 'var(--text-secondary)' }} />
            {requests.length > 0 && (
              <div style={{ position: 'absolute', top: '6px', right: '6px', background: 'var(--primary-color)', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: 'bold', boxShadow: '0 0 10px var(--primary-color)' }}>
                {requests.length}
              </div>
            )}
          </div>
          {showNotifs && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="glass-panel" style={{ position: 'absolute', right: 0, top: '55px', width: '320px', zIndex: 1000, padding: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }}>
              <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }} className="neon-text">Заявки</h3>
              {requests.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Нет новых уведомлений</p>
              ) : requests.map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <img src={r.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + r.username}
                    alt="avatar" style={{ width: '42px', height: '42px', borderRadius: '50%', border: '1px solid var(--primary-color)' }} />
                  <span style={{ flex: 1, fontWeight: 'bold', fontSize: '0.95rem' }}>{r.username}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => acceptRequest(r.id)} style={{ background: 'var(--primary-color)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'black' }}>
                      <Check size={16} />
                    </button>
                    <button onClick={() => declineRequest(r.id)} style={{ background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.3)', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#ff4d4d' }}>
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
        <Link to={`/profile/${user.username}`}>
          <img src={user.avatar} style={{ width: '44px', height: '44px', borderRadius: '14px', border: '2px solid var(--primary-color)', boxShadow: '0 0 10px rgba(0,242,255,0.3)' }} alt="avatar" />
        </Link>
      </div>
    </div>
  );
};

const MobileNav = () => {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return null;
  return (
    <>
      <Link to="/" className="fab">
        <Send size={24} />
      </Link>
      <nav className="mobile-nav">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          <Home size={26} /><span>Новости</span>
        </Link>
        <Link to="/messages" className={location.pathname === '/messages' ? 'active' : ''}>
          <MessageSquare size={26} /><span>Чаты</span>
        </Link>
        <Link to="/friends" className={location.pathname === '/friends' ? 'active' : ''}>
          <Users size={26} /><span>Друзья</span>
        </Link>
        <Link to={`/profile/${user.username}`} className={location.pathname.startsWith('/profile') ? 'active' : ''}>
          <User size={26} /><span>Профиль</span>
        </Link>
      </nav>
    </>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="glass-panel" style={{ padding: '30px 50px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <motion.div animate={{ rotate: 360, scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          style={{ width: '32px', height: '32px', border: '4px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%', boxShadow: '0 0 15px var(--primary-color)' }} />
        <span className="neon-text" style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Загрузка SETI...</span>
      </div>
    </div>
  );
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
};

function AppInner() {
  const location = useLocation();
  return (
    <div className="main-layout">
      <Sidebar />
      <div style={{ flex: 1 }} className="main-content">
        <Header />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
            <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
            <Route path="/profile/:username" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
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
      <AppInner />
    </AuthProvider>
  </BrowserRouter>
);

export default Root;