import { useState, useEffect } from 'react';
import api from '../api/client';
import { motion } from 'framer-motion';
import { UserPlus, MessageSquare, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FriendsPage = () => {
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const fetchFriends = async () => {
    try {
      const res = await api.get('/friends');
      setFriends(res.data || []);
    } catch { setFriends([]); } finally { setLoading(false); }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get('/friends/requests');
      setRequests(res.data || []);
    } catch { setRequests([]); }
  };

  const searchUsers = async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      const res = await api.get('/users/search?q=' + q);
      setSearchResults(res.data || []);
    } catch { setSearchResults([]); }
  };

  const acceptRequest = async (id: number) => {
    await api.post('/friends/accept/' + id);
    fetchFriends();
    fetchRequests();
  };

  const sendRequest = async (id: number) => {
    await api.post('/friends/request/' + id);
    alert('Запрос отправлен!');
  };

  useEffect(() => { fetchFriends(); fetchRequests(); }, []);
  useEffect(() => { searchUsers(searchQuery); }, [searchQuery]);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="container" style={{ paddingBottom: '40px', paddingLeft: isMobile ? '12px' : '20px', paddingRight: isMobile ? '12px' : '20px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: isMobile ? '24px' : '40px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '16px' : '20px' }}>
        <h1 style={{ fontSize: isMobile ? '1.8rem' : '2.5rem', fontWeight: '900', letterSpacing: '-1.5px', margin: 0 }} className="neon-text">Нейросеть связей</h1>
        <div style={{ position: 'relative', width: isMobile ? '100%' : '350px' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
          <input type="text" className="input-field" placeholder="Сканировать..."
            style={{ paddingLeft: '48px', height: isMobile ? '48px' : '52px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid var(--border)' }} value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </motion.div>

      {searchQuery && (
        <div style={{ marginBottom: isMobile ? '32px' : '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', boxShadow: 'var(--glow)' }}></div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Результаты поиска</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {searchResults.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>Объекты не найдены в текущем секторе.</p>
            ) : searchResults.map((user) => (
              <motion.div key={user.id} whileTap={{ scale: 0.98 }} className="glass-panel"
                style={{ padding: '20px', textAlign: 'center', border: '1px solid rgba(0, 242, 255, 0.1)', borderRadius: '20px' }}>
                <img src={user.avatar}
                  alt="avatar" style={{ width: '70px', height: '70px', borderRadius: '16px', marginBottom: '12px', border: '2px solid var(--primary)', boxShadow: 'var(--glow)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '900', marginBottom: '4px' }} className="neon-text">@{user.username}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '16px' }}>{user.bio || 'Сигнал стабилен'}</p>
                <button className="btn-primary" style={{ width: '100%', borderRadius: '10px', padding: '10px' }}
                  onClick={() => sendRequest(user.id)}>
                  Инициировать связь
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {requests.length > 0 && (
        <div style={{ marginBottom: isMobile ? '32px' : '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div className="pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary)', boxShadow: 'var(--glow-strong)' }}></div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Входящие ({requests.length})</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {requests.map((user) => (
              <motion.div key={user.id} whileTap={{ scale: 0.98 }} className="glass-panel"
                style={{ padding: '20px', textAlign: 'center', border: '1px solid rgba(189, 0, 255, 0.2)', borderRadius: '20px' }}>
                <img src={user.avatar}
                  alt="avatar" style={{ width: '70px', height: '70px', borderRadius: '16px', marginBottom: '12px', border: '2px solid var(--secondary)' }} />
                <h3 style={{ marginBottom: '16px', fontWeight: '900', fontSize: '1.1rem' }}>@{user.username}</h3>
                <button className="btn-primary" style={{ width: '100%', borderRadius: '10px' }}
                  onClick={() => acceptRequest(user.id)}>
                  Подтвердить
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>Мои контакты</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: isMobile ? '16px' : '24px' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', gridColumn: '1 / -1' }}>
            <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} className="neon-text" style={{ fontWeight: '900', letterSpacing: '2px' }}>СИНХРОНИЗАЦИЯ...</motion.div>
          </div>
        ) : friends.length > 0 ? (
          friends.map((friend, index) => (
            <motion.div key={friend.id} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(index * 0.05, 0.5) }}
              whileTap={{ scale: 0.98 }} 
              className="glass-panel"
              style={{ padding: isMobile ? '20px' : '28px', textAlign: 'center', borderLeft: index % 2 === 0 ? '4px solid var(--primary)' : '4px solid var(--secondary)', borderRadius: '20px' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
                <img src={friend.avatar}
                  alt="avatar" style={{ width: isMobile ? '80px' : '100px', height: isMobile ? '80px' : '100px', borderRadius: '18px', border: '2px solid rgba(255,255,255,0.1)', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '12px', height: '12px', background: '#00ff00', borderRadius: '50%', border: '2px solid var(--bg)', boxShadow: '0 0 10px #00ff00' }}></div>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '900', marginBottom: '4px' }}>{friend.username}</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: '20px', minHeight: '32px' }}>{friend.bio || 'Сигнал стабилен'}</p>
              <button className="btn-primary" style={{ width: '100%', borderRadius: '12px', padding: '10px', fontSize: '0.9rem' }}
                onClick={() => navigate('/messages', { state: { friend } })}>
                <MessageSquare size={16} /> Передача данных
              </button>
            </motion.div>
          ))
        ) : (
          <div className="glass-panel" style={{ padding: isMobile ? '40px 20px' : '80px 40px', gridColumn: '1 / -1', textAlign: 'center', borderStyle: 'dashed', borderRadius: '24px' }}>
             <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
              <UserPlus size={48} className="neon-text" style={{ marginBottom: '20px', opacity: 0.3 }} />
             </motion.div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', fontWeight: '900' }}>СЕТЬ ПУСТА</h3>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Начните поиск новых пользователей в матрице.</p>
          </div>
        )}
      </div>
    </div>
  );
};
