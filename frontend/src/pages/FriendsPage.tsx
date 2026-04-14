import { useState, useEffect } from 'react';
import api from '../api/client';
import { motion } from 'framer-motion';
import { UserPlus, MessageSquare, Search, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FriendsPage = () => {
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  return (
    <div className="container" style={{ paddingBottom: '40px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1.5px' }} className="neon-text">Нейросеть связей</h1>
        <div style={{ position: 'relative', width: '350px', maxWidth: '100%' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input type="text" className="input-field" placeholder="Сканировать пользователей..."
            style={{ paddingLeft: '48px', height: '52px' }} value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </motion.div>

      {searchQuery && (
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary-color)', boxShadow: 'var(--neon-glow)' }}></div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>Обнаруженные сигналы</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {searchResults.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', padding: '20px' }}>Объекты не найдены в текущем секторе.</p>
            ) : searchResults.map((user) => (
              <motion.div key={user.id} whileHover={{ y: -5, boxShadow: 'var(--neon-glow)' }} className="glass-panel"
                style={{ padding: '32px', textAlign: 'center', border: '1px solid rgba(0, 242, 255, 0.1)' }}>
                <img src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.username}
                  alt="avatar" style={{ width: '90px', height: '90px', borderRadius: '24px', marginBottom: '16px', border: '2px solid var(--primary-color)', boxShadow: '0 0 10px rgba(0,242,255,0.2)' }} />
                <h3 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '8px' }} className="neon-text">{user.username}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', minHeight: '40px' }}>{user.bio || 'Биографические данные отсутствуют'}</p>
                <button className="btn-primary" style={{ width: '100%' }}
                  onClick={() => sendRequest(user.id)}>
                  <UserPlus size={18} /> Инициировать связь
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {requests.length > 0 && (
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div className="pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary-color)', boxShadow: '0 0 10px var(--secondary-color)' }}></div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }} className="neon-text-purple">Входящие импульсы ({requests.length})</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
            {requests.map((user) => (
              <motion.div key={user.id} whileHover={{ y: -5 }} className="glass-panel"
                style={{ padding: '28px', textAlign: 'center', border: '1px solid rgba(189, 0, 255, 0.2)' }}>
                <img src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.username}
                  alt="avatar" style={{ width: '80px', height: '80px', borderRadius: '20px', marginBottom: '16px', border: '2px solid var(--secondary-color)' }} />
                <h3 style={{ marginBottom: '20px', fontWeight: '800' }}>{user.username}</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn-primary" style={{ flex: 1 }}
                    onClick={() => acceptRequest(user.id)}>
                    <Check size={18} /> Подтвердить
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Мои контакты</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '28px' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', gridColumn: '1 / -1' }}>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="neon-text">Синхронизация...</motion.div>
          </div>
        ) : friends.length > 0 ? (
          friends.map((friend, index) => (
            <motion.div key={friend.id} 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -8, boxShadow: 'var(--neon-glow)' }} 
              className="glass-panel"
              style={{ padding: '32px', textAlign: 'center', borderLeft: index % 2 === 0 ? '4px solid var(--primary-color)' : '4px solid var(--secondary-color)' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                <img src={friend.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + friend.username}
                  alt="avatar" style={{ width: '110px', height: '110px', borderRadius: '30px', border: '2px solid rgba(255,255,255,0.1)', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: '5px', right: '5px', width: '14px', height: '14px', background: '#00ff00', borderRadius: '50%', border: '3px solid var(--bg-color)', boxShadow: '0 0 10px #00ff00' }}></div>
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '8px' }}>{friend.username}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', minHeight: '40px' }}>{friend.bio || 'Доступ разрешен • Активный контакт'}</p>
              <button className="btn-primary" style={{ width: '100%', borderRadius: '14px' }}
                onClick={() => navigate('/messages', { state: { friend } })}>
                <MessageSquare size={18} /> Передача данных
              </button>
            </motion.div>
          ))
        ) : (
          <div className="glass-panel" style={{ padding: '80px 40px', gridColumn: '1 / -1', textAlign: 'center', borderStyle: 'dashed' }}>
             <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
              <UserPlus size={64} className="neon-text" style={{ marginBottom: '24px', opacity: 0.4 }} />
             </motion.div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px', fontWeight: '800' }}>Ваша сеть пуста</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Начните поиск новых пользователей для расширения матрицы связей.</p>
          </div>
        )}
      </div>
    </div>
  );
};
