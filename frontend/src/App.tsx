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
    <div className="sidebar glass-panel" style={{ padding: '24px' }}>
      <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: 'var(--primary-color)', padding: '10px', borderRadius: '12px' }}>
          <Compass color="white" size={24} />
        </div>
        <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>SocialNet</span>
      </div>
      <nav style={{ flex: 1 }}>
        {navItems.map((item) => (
          <Link to={item.path} key={item.name} style={{ textDecoration: 'none' }}>
            <div className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}>
              <item.icon size={22} />
              <span>{item.name}</span>
            </div>
          </Link>
        ))}
      </nav>
      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
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
    <div className="glass-panel" style={{ width: '100%', padding: '15px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
        <Search size={18} style={{ position: 'absolute', left: '15px', top: '15px', color: 'var(--text-secondary)' }} />
        <input type="text" className="input-field" placeholder="Поиск..." style={{ paddingLeft: '45px' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '16px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowNotifs(!showNotifs)}>
            <Bell size={24} style={{ color: requests.length > 0 ? 'var(--primary-color)' : 'var(--text-secondary)' }} />
            {requests.length > 0 && (
              <div style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ff4d4d', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                {requests.length}
              </div>
            )}
          </div>
          {showNotifs && (
            <div className="glass-panel" style={{ position: 'absolute', right: 0, top: '40px', width: '280px', zIndex: 1000, padding: '16px' }}>
              <h3 style={{ marginBottom: '12px' }}>Заявки в друзья</h3>
              {requests.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Нет новых заявок</p>
              ) : requests.map((r) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <img src={r.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + r.username}
                    alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                  <span style={{ flex: 1, fontWeight: 'bold' }}>{r.username}</span>
                  <button onClick={() => acceptRequest(r.id)} style={{ background: 'var(--primary-color)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: 'white' }}>
                    <Check size={16} />
                  </button>
                  <button onClick={() => declineRequest(r.id)} style={{ background: 'rgba(255,77,77,0.2)', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#ff4d4d' }}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right' }} className="hide-mobile">
            <div style={{ fontWeight: 'bold' }}>{user.username}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Online</div>
          </div>
          <img src={user.avatar} style={{ width: '40px', height: '40px', borderRadius: '12px', border: '2px solid var(--primary-color)' }} alt="avatar" />
        </div>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <div className="glass-panel" style={{ padding: '20px 40px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          style={{ width: '24px', height: '24px', border: '3px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%' }} />
        <span>Загрузка...</span>
      </div>
    </div>
  );
  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
};

function App() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <AuthProvider>
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
      </div>
      {user && (
        <nav className="mobile-nav">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            <Home size={22} /><span>Новости</span>
          </Link>
          <Link to="/messages" className={location.pathname === '/messages' ? 'active' : ''}>
            <MessageSquare size={22} /><span>Чаты</span>
          </Link>
          <Link to="/friends" className={location.pathname === '/friends' ? 'active' : ''}>
            <Users size={22} /><span>Друзья</span>
          </Link>
          <Link to={`/profile/${user.username}`} className={location.pathname.startsWith('/profile') ? 'active' : ''}>
            <User size={22} /><span>Профиль</span>
          </Link>
        </nav>
      )}
    </AuthProvider>
  );
}

const Root = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

export default Root;