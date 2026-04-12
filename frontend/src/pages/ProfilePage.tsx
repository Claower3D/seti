import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Edit3, Calendar, MapPin, Users, FileText, Heart, MessageCircle } from 'lucide-react';
import { EditProfileModal } from '../components/EditProfileModal';

export const ProfilePage = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isOwnProfile = currentUser?.username === username;

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/profile/${username}`);
      setProfileUser(res.data);
    } catch (err) {
      console.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: '40px', height: '40px', border: '4px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%' }}
      />
    </div>
  );

  if (!profileUser) return <div style={{ textAlign: 'center', padding: '100px' }}> Пользователь не найден </div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Profile Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel" 
        style={{ overflow: 'hidden', marginBottom: '30px' }}
      >
        <div style={{ height: '200px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', position: 'relative' }}>
          {/* Cover gradient or image */}
        </div>
        
        <div style={{ padding: '0 40px 30px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-60px' }}>
            <img 
              src={profileUser.avatar} 
              alt="avatar" 
              style={{ width: '150px', height: '150px', borderRadius: '30px', border: '6px solid var(--bg-color)', background: 'var(--bg-color)', objectFit: 'cover' }} 
            />
            {isOwnProfile && (
              <button className="btn-primary" onClick={() => setIsEditModalOpen(true)}>
                <Edit3 size={18} /> Редактировать профиль
              </button>
            )}
          </div>

          <div style={{ marginTop: '24px' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>{profileUser.username}</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '1.1rem', maxWidth: '600px' }}>
              {profileUser.bio || 'Этот пользователь пока ничего не рассказал о себе.'}
            </p>

            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <Calendar size={18} />
                <span>Присоединился {new Date(profileUser.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                <MapPin size={18} />
                <span>Земля</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Profile Stats & Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '30px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ marginBottom: '20px' }}>Статистика</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                  <FileText size={18} /> Посты
                </div>
                <span style={{ fontWeight: 'bold' }}>{(profileUser.posts || []).length}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                  <Users size={18} /> Друзья
                </div>
                <span style={{ fontWeight: 'bold' }}>{(profileUser.friends || []).length}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h2 style={{ marginBottom: '10px' }}>Посты пользователя</h2>
          {(profileUser.posts || []).length > 0 ? (
            profileUser.posts.map((post: any) => (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel" 
                style={{ padding: '24px' }}
              >
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  {new Date(post.createdAt).toLocaleString()}
                </div>
                <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>{post.content}</p>
                <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <Heart size={20} /> Лайк
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <MessageCircle size={20} /> Коммент
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              У пользователя пока нет постов.
            </div>
          )}
        </div>
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        currentUser={profileUser}
        onUpdate={(updated) => setProfileUser({...profileUser, ...updated})}
      />
    </div>
  );
};
