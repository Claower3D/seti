import { useState, useEffect } from 'react';
import api from '../api/client';
import { motion } from 'framer-motion';
import { UserPlus, MessageSquare, Search } from 'lucide-react';

export const FriendsPage = () => {
  const [friends, setFriends] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchFriends = async () => {
    try {
      const res = await api.get('/friends');
      setFriends(res.data || []);
    } catch (err) {
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      const res = await api.get('/users/search?q=' + q);
      setSearchResults(res.data || []);
    } catch (err) {
      setSearchResults([]);
    }
  };

  useEffect(() => { fetchFriends(); }, []);
  useEffect(() => { searchUsers(searchQuery); }, [searchQuery]);

  return (
    <div className="container">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Друзья</h1>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '15px', top: '15px', color: 'var(--text-secondary)' }} />
          <input type="text" className="input-field" placeholder="Найти людей..."
            style={{ paddingLeft: '45px' }} value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </motion.div>

      {searchQuery && (
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ marginBottom: '16px' }}>Результаты поиска</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {searchResults.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>Никого не найдено</p>
            ) : searchResults.map((user) => (
              <motion.div key={user.id} whileHover={{ scale: 1.02 }} className="glass-panel"
                style={{ padding: '24px', textAlign: 'center' }}>
                <img src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.username}
                  alt="avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '12px' }} />
                <h3>{user.username}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>{user.bio || 'Нет описания'}</p>
                <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                  onClick={() => api.post('/friends/request/' + user.id).then(() => alert('Запрос отправлен!'))}>
                  <UserPlus size={16} /> Добавить
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <h2 style={{ marginBottom: '16px' }}>Мои друзья</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {loading ? <div>Загрузка...</div> : friends.length > 0 ? (
          friends.map((friend) => (
            <motion.div key={friend.id} whileHover={{ scale: 1.02 }} className="glass-panel"
              style={{ padding: '24px', textAlign: 'center' }}>
              <img src={friend.avatar} alt="avatar" style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '16px' }} />
              <h3>{friend.username}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>{friend.bio || 'Нет описания'}</p>
              <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                <MessageSquare size={16} /> Написать
              </button>
            </motion.div>
          ))
        ) : (
          <div className="glass-panel" style={{ padding: '40px', gridColumn: '1 / -1', textAlign: 'center' }}>
            <UserPlus size={48} color="var(--text-secondary)" style={{ marginBottom: '16px' }} />
            <h3>У вас пока нет друзей</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Самое время кого-нибудь добавить!</p>
          </div>
        )}
      </div>
    </div>
  );
};