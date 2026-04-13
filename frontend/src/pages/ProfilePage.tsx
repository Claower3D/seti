import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Edit3, Calendar, MapPin, FileText, Heart, MessageCircle } from 'lucide-react';
import { EditProfileModal } from '../components/EditProfileModal';

export const ProfilePage = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    setLoading(true);
    api.get(`/profile/${username}`)
      .then(res => setProfileUser(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: '40px', height: '40px', border: '4px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%' }} />
    </div>
  );

  if (!profileUser) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>Пользователь не найден</div>
  );

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel" style={{ overflow: 'hidden', marginBottom: '30px', border: '1px solid rgba(0, 242, 255, 0.1)' }}>

        {/* Futuristic Cover */}
        <div style={{ height: '200px', background: 'linear-gradient(45deg, #050608, #1a1a2e)', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0, 242, 255, 0.1) 0%, transparent 70%)' }}></div>
          <div style={{ position: 'absolute', bottom: '-50px', left: '24px', display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
            <div style={{ position: 'relative' }}>
              <img src={profileUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + profileUser.username}
                alt="avatar" style={{ width: '120px', height: '120px', borderRadius: '24px', border: '4px solid var(--bg-color)', background: 'var(--bg-color)', boxShadow: 'var(--neon-glow)', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '18px', height: '18px', background: '#00ff00', borderRadius: '50%', border: '3px solid var(--bg-color)', boxShadow: '0 0 10px #00ff00' }}></div>
            </div>
          </div>
        </div>

        {/* Profile Info & Actions */}
        <div style={{ padding: '70px 24px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <h1 style={{ fontSize: '2.2rem', fontWeight: '900', marginBottom: '4px', letterSpacing: '-1px' }} className="neon-text">{profileUser.username}</h1>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <Calendar size={15} className="neon-text-purple" />
                  <span>SETI User since {new Date(profileUser.createdAt).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <MapPin size={15} className="neon-text" />
                  <span>Earth Sector</span>
                </div>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: '1.6', marginBottom: '24px', maxWidth: '600px', borderLeft: '2px solid var(--primary-color)', paddingLeft: '16px' }}>
                {profileUser.bio || 'Этот пользователь еще не загрузил данные своей биографии в SETI-матрицу.'}
              </p>
            </div>

            {isOwnProfile && (
              <button className="btn-primary" onClick={() => setIsEditModalOpen(true)}>
                <Edit3 size={18} /> Редактировать
              </button>
            )}
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '40px', marginTop: '10px' }}>
            {[
              { label: 'Посты', value: (profileUser.posts || []).length },
              { label: 'Друзья', value: (profileUser.friends || []).length },
              { label: 'Импульсы', value: 0 },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', lineHeight: 1 }} className="neon-text-purple">{value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Posts Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <FileText className="neon-text" size={24} />
        <h2 style={{ fontSize: '1.6rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Архив данных</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {(profileUser.posts || []).length > 0 ? (
          profileUser.posts.map((post: any, index: number) => (
            <motion.div key={post.id} 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-panel" style={{ padding: '24px', borderLeft: index % 2 === 0 ? '4px solid var(--primary-color)' : '4px solid var(--secondary-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-color)', boxShadow: '0 0 5px var(--primary-color)' }}></div>
                  {new Date(post.createdAt).toLocaleString()}
                </div>
              </div>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#f1f5f9', marginBottom: '20px' }}>{post.content}</p>
              <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: '700' }}>
                  <Heart size={20} /> Лайк
                </button>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: '700' }}>
                  <MessageCircle size={20} /> Комментарий
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px dashed var(--border-color)' }}>
            У пользователя пока нет зафиксированных данных в SETI.
          </div>
        )}
      </div>

      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}
        currentUser={profileUser} onUpdate={(updated) => setProfileUser({ ...profileUser, ...updated })} />
    </div>
  );
};
