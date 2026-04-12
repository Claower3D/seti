import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import { FeedPage } from './pages/FeedPage';
import { MessagesPage } from './pages/MessagesPage';
import { FriendsPage } from './pages/FriendsPage';
import { ProfilePage } from './pages/ProfilePage';
import { Home, MessageSquare, Users, User, LogOut, Bell, Search, Compass } from 'lucide-react';

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
  if (!user) return null;

  return (
    <div className="glass-panel" style={{ width: '100%', padding: '15px 30px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: '400px' }}>
        <Search size={18} style={{ position: 'absolute', left: '15px', top: '15px', color: 'var(--text-secondary)' }} />
        <input type="text" className="input-field" placeholder="Поиск людей, постов..." style={{ paddingLeft: '45px' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <Bell size={24} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold' }}>{user.username}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Online</div>
          </div>
          <img src={user.avatar} style={{ width: '45px', height: '45px', borderRadius: '14px', border: '2px solid var(--primary-color)' }} alt="avatar" />
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
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          style={{ width: '24px', height: '24px', border: '3px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%' }}
        />
        <span>Загрузка...</span>
      </div>
    </div>
  );

  if (!token) return <Navigate to="/login" />;
  return <>{children}</>;
};

function App() {
  const location = useLocation();

  return (
    <AuthProvider>
        <div className="main-layout">
          <Sidebar />
          <div style={{ flex: 1 }}>
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
    </AuthProvider>
  );
}

const Root = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

export default Root;
