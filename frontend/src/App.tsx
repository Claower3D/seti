import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { FeedPage } from './pages/FeedPage';
import { MessagesPage } from './pages/MessagesPage';
import { FriendsPage } from './pages/FriendsPage';
import { ProfilePage } from './pages/ProfilePage';
import { Home, MessageSquare, Users, User, LogOut, Bell, Search, Zap, Check, X } from 'lucide-react';
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
      <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 4px' }}>
        <div className="pulse" style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.2), rgba(180,0,255,0.2))', border: '1px solid rgba(0,245,255,0.4)', padding: '10px', borderRadius: '12px', boxShadow: '0 0 20px rgba(0,245,255,0.3)' }}>
          <Zap color="#00f5ff" size={22} style={{ filter: 'drop-shadow(0 0 6px #00f5ff)' }} />
        </div>
        <span style={{ fontSize: '1.6rem', fontWeight: '900', background: 'linear-gradient(135deg, #00f5ff, #b400ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>SETI</span>
      </div>
      <nav style={{ flex: 1 }}>
        {navItems.map((item) => (
          <Link to={item.path} key={item.name} style={{ textDecoration: 'none' }}>
            <div className={`nav-item ${location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path)) ? 'active' : ''}`}>
              <item.icon size={20} />
              <span>{item.name}</span>
            </div>
          </Link>
        ))}
      </nav>
      <div style={{ borderTop: '1px solid rgba(0,245,255,0.08)', paddingTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', marginBottom: '6px' }}>
          <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
            style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(0,245,255,0.3)' }} alt="" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#00f5ff', textShadow: '0 0 8px rgba(0,245,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>● Online</div>
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
  const [showNotifs, setShowNotifs] = useState(false);

  const fetchRequests = async () => {
    try { const res = await api.get('/friends/requests'); setRequests(res.data || []); } catch { setRequests([]); }
  };

  const acceptRequest = async (id: number) => { await api.post('/friends/accept/' + id); fetchRequests(); };
  const declineRequest = (id: number) => setRequests(prev => prev.filter(r => r.id !== id));

  useEffect(() => {
    if (user) { fetchRequests(); const t = setInterval(fetchRequests, 15000); return () => clearInterval(t); }
  }, [user]);

  if (!user) return null;

  return (
    <div className="glass-panel" style={{ padding: '12px 20px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 'var(--radius)' }}>
      <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
        <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input type="text" className="input-field" placeholder="Поиск в SETI..." style={{ paddingLeft: '40px', padding: '10px 16px 10px 40px', fontSize: '0.85rem' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginLeft: '16px' }}>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNotifs(!showNotifs)}
            className={requests.length > 0 ? 'pulse' : ''}
            style={{ background: requests.length > 0 ? 'rgba(0,245,255,0.08)' : 'transparent', border: requests.length > 0 ? '1px solid rgba(0,245,255,0.2)' : '1px solid transparent', cursor: 'pointer', color: requests.length > 0 ? '#00f5ff' : 'var(--text-secondary)', padding: '8px', borderRadius: '12px', position: 'relative', transition: 'all 0.3s', display: 'flex' }}>
            <Bell size={20} style={{ filter: requests.length > 0 ? 'drop-shadow(0 0 6px #00f5ff)' : 'none' }} />
            {requests.length > 0 && (
              <div style={{ position: 'absolute', top: '4px', right: '4px', background: '#ff0090', borderRadius: '50%', width: '16px', height: '16px', fontSize: '0.58rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', boxShadow: '0 0 8px rgba(255,0,144,0.8)' }}>
                {requests.length}
              </div>
            )}
          </button>
          {showNotifs && (
            <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              className="glass-panel" style={{ position: 'absolute', right: 0, top: '48px', width: '290px', zIndex: 1000, padding: '18px', boxShadow: '0 20px 60px rgba(0,0,0,0.9), 0 0 30px rgba(0,245,255,0.05)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#00f5ff', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.08em', textShadow: '0 0 8px rgba(0,245,255,0.6)' }}>
                Заявки в друзья
              </div>
              {requests.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Нет новых заявок</p>
              ) : requests.map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <img src={r.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + r.username} alt=""
                    style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(0,245,255,0.3)' }} />
                  <span style={{ flex: 1, fontWeight: '600', fontSize: '0.85rem' }}>{r.username}</span>
                  <button onClick={() => acceptRequest(r.id)} style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)', borderRadius: '8px', padding: '5px', cursor: 'pointer', color: '#00f5ff', display: 'flex' }}><Check size={14} /></button>
                  <button onClick={() => declineRequest(r.id)} style={{ background: 'rgba(255,0,144,0.1)', border: '1px solid rgba(255,0,144,0.3)', borderRadius: '8px', padding: '5px', cursor: 'pointer', color: '#ff0090', display: 'flex' }}><X size={14} /></button>
                </div>
              ))}
            </motion.div>
          )}
        </div>
        <Link to={`/profile/${user.username}`}>
          <img src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt=""
            style={{ width: '38px', height: '38px', borderRadius: '50%', border: '2px solid rgba(0,245,255,0.4)', boxShadow: '0 0 12px rgba(0,245,255,0.25)', cursor: 'pointer' }} />
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
    <nav className="mobile-nav">
      {[
        { to: '/', icon: Home, label: 'Лента' },
        { to: '/messages', icon: MessageSquare, label: 'Чаты' },
        { to: '/friends', icon: Users, label: 'Друзья' },
        { to: `/profile/${user.username}`, icon: User, label: 'Профиль' },
      ].map(({ to, icon: Icon, label }) => (
        <Link key={to} to={to} className={location.pathname === to || (to !== '/' && location.pathname.startsWith(to)) ? 'active' : ''}>
          <Icon size={22} /><span>{label}</span>
        </Link>
      ))}
    </nav>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="glass-panel" style={{ padding: '28px 48px', display: 'flex', alignItems: 'center', gap: '18px' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{ width: '28px', height: '28px', border: '2px solid transparent', borderTopColor: '#00f5ff', borderRadius: '50%', boxShadow: '0 0 15px rgba(0,245,255,0.5)' }} />
        <span style={{ color: '#00f5ff', fontWeight: '700', textShadow: '0 0 8px rgba(0,245,255,0.6)', fontSize: '1rem' }}>Загрузка SETI...</span>
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
      <div style={{ flex: 1, minWidth: 0 }} className="main-content">
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