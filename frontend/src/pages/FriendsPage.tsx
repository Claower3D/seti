import { useState, useEffect } from 'react';
import api from '../api/client';
import { motion } from 'framer-motion';
import { UserPlus, MessageSquare, Search } from 'lucide-react';

export const FriendsPage = () => {
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = async () => {
    try {
      const res = await api.get('/friends');
      setFriends(res.data || []);
    } catch (err) {
      console.error('Failed to fetch friends');
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  return (
    <div className="container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h1>Друзья</h1>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '15px', top: '15px', color: 'var(--text-secondary)' }} />
          <input type="text" className="input-field" placeholder="Найти друзей..." style={{ paddingLeft: '45px' }} />
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
        {loading ? (
          <div>Загрузка...</div>
        ) : friends.length > 0 ? (
          friends.map((friend) => (
            <motion.div 
              key={friend.id}
              whileHover={{ scale: 1.02 }}
              className="glass-panel" 
              style={{ padding: '24px', textAlign: 'center' }}
            >
              <img src={friend.avatar} alt="avatar" style={{ width: '100px', height: '100px', borderRadius: '50%', marginBottom: '16px', border: '3px solid var(--primary-color)' }} />
              <h3 style={{ marginBottom: '8px' }}>{friend.username}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>{friend.bio || 'У этого пользователя нет описания'}</p>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                  <MessageSquare size={16} /> Написать
                </button>
                <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer' }}>
                  Профиль
                </button>
              </div>
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
