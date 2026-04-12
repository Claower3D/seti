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
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel" style={{ overflow: 'hidden', marginBottom: '20px' }}>

        {/* Cover */}
        <div style={{ height: '140px', background: 'linear-gradient(135deg, #6366f1, #a855f7)' }} />

        {/* Avatar + actions */}
        <div style={{ padding: '0 20px 24px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '-50px', flexWrap: 'wrap', gap: '12px' }}>
            <img src={profileUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + profileUser.username}
              alt="avatar" style={{ width: '100px', height: '100px', borderRadius: '24px', border: '4px solid var(--bg-color)', objectFit: 'cover' }} />
            {isOwnProfile && (
              <button className="btn-primary" onClick={() => setIsEditModalOpen(true)}
                style={{ padding: '10px 18px', fontSize: '0.9rem' }}>
                <Edit3 size={16} /> Редактировать
              </button>
            )}
          </div>

          <div style={{ marginTop: '16px' }}>
            <h1 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{profileUser.username}</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '14px', fontSize: '1rem', lineHeight: '1.5' }}>
              {profileUser.bio || 'Пользователь пока ничего не рассказал о себе.'}
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <Calendar size={15} />
                <span>Присоединился {new Date(profileUser.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <MapPin size={15} />
                <span>Земля</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', borderTop: '1px solid var(--border-color)' }}>
          {[
            { icon: FileText, label: 'Постов', value: (profileUser.posts || []).length },
            { icon: Users, label: 'Друзей', value: (profileUser.friends || []).length },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} style={{ flex: 1, padding: '16px', textAlign: 'center', borderRight: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>{value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
                <Icon size={13} /> {label}
              </div>
            </div>
          ))}
          <div style={{ flex: 1, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>0</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
              <Heart size={13} /> Лайков
            </div>
          </div>
        </div>
      </motion.div>

      {/* Posts */}
      <h2 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Посты пользователя</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {(profileUser.posts || []).length > 0 ? (
          profileUser.posts.map((post: any) => (
            <motion.div key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                {new Date(post.createdAt).toLocaleString()}
              </div>
              <p style={{ fontSize: '1rem', lineHeight: '1.6', marginBottom: '16px' }}>{post.content}</p>
              <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                  <Heart size={18} /> Лайк
                </button>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                  <MessageCircle size={18} /> Комментарий
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            У пользователя пока нет постов.
          </div>
        )}
      </div>

      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}
        currentUser={profileUser} onUpdate={(updated) => setProfileUser({ ...profileUser, ...updated })} />
    </div>
  );
};