import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, X, Grid, Film, Zap } from 'lucide-react';
import { EditProfileModal } from '../components/EditProfileModal';

const FriendsModal = ({ isOpen, onClose, username }: { isOpen: boolean, onClose: () => void, username: string }) => {
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.get(`/profile/${username}/friends`)
        .then(res => setFriends(res.data || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, username]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }} />
        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="glass-panel" style={{ position: 'relative', width: '100%', maxWidth: '400px', padding: '24px', border: '1px solid rgba(0,245,255,0.3)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#00f5ff', textShadow: '0 0 10px rgba(0,245,255,0.3)' }}>Друзья</h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}><div className="pulse" style={{ width: '4px', height: '4px', background: '#00f5ff', margin: 'auto' }} /></div>
            ) : friends.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Нет друзей</p>
            ) : (
              friends.map(f => (
                <Link key={f.id} to={`/profile/${f.username}`} onClick={onClose}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', marginBottom: '8px', textDecoration: 'none', border: '1px solid transparent', transition: 'all 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,245,255,0.2)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
                  <img src={f.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + f.username} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(0,245,255,0.3)' }} />
                  <span style={{ fontWeight: '600', color: 'white', fontSize: '0.9rem' }}>@{f.username}</span>
                </Link>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const ProfilePage = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'waves'>('posts');
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        style={{ width: '40px', height: '40px', border: '2px solid transparent', borderTopColor: '#00f5ff', borderRadius: '50%', boxShadow: '0 0 15px rgba(0,245,255,0.5)' }} />
    </div>
  );

  if (!profileUser) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>Пользователь не найден</div>
  );

  return (
    <div style={{ maxWidth: '935px', margin: '0 auto', padding: isMobile ? '0 10px' : '0 20px' }}>
      <div style={{ 
        display: 'flex', 
        gap: isMobile ? '20px' : '40px', 
        marginBottom: '44px', 
        alignItems: isMobile ? 'center' : 'flex-start',
        flexDirection: isMobile ? 'column' : 'row',
        textAlign: isMobile ? 'center' : 'left'
      }}>
        <div style={{ position: 'relative' }}>
          <img src={profileUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + profileUser.username}
            alt="avatar" style={{ width: isMobile ? '90px' : '110px', height: isMobile ? '90px' : '110px', borderRadius: '50%', border: '4px solid rgba(0,245,255,0.2)', padding: '4px', objectFit: 'cover' }} />
        </div>
        
        <div style={{ flex: 1, width: isMobile ? '100%' : 'auto' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '20px', 
            marginBottom: '20px',
            justifyContent: isMobile ? 'center' : 'flex-start'
          }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '300', color: 'white' }}>{profileUser.username}</h1>
            {isOwnProfile && (
              <button onClick={() => setIsEditModalOpen(true)}
                style={{ 
                  padding: '8px 20px', 
                  borderRadius: '10px', 
                  fontSize: '0.85rem', 
                  fontWeight: '800', 
                  cursor: 'pointer', 
                  background: '#00f5ff', 
                  color: '#050608',
                  border: 'none',
                  boxShadow: '0 0 15px rgba(0,245,255,0.4)'
                }}>
                Редактировать
              </button>
            )}
            {!isOwnProfile && (
              <button className="btn-primary" style={{ padding: '8px 24px' }}>Подписаться</button>
            )}
          </div>

          <div style={{ 
            display: 'flex', 
            gap: isMobile ? '20px' : '40px', 
            marginBottom: '20px',
            justifyContent: isMobile ? 'center' : 'flex-start'
          }}>
            <div style={{ fontSize: '0.95rem', color: 'white' }}><span style={{ fontWeight: '800' }}>{(profileUser.posts || []).length}</span> постов</div>
            <div onClick={() => setIsFriendsModalOpen(true)} style={{ fontSize: '0.95rem', color: 'white', cursor: 'pointer' }}><span style={{ fontWeight: '800' }}>{(profileUser.friends || []).length}</span> друзей</div>
            <div style={{ fontSize: '0.95rem', color: 'white' }}><span style={{ fontWeight: '800' }}>{(profileUser.waves || []).length}</span> волн</div>
          </div>

          <div style={{ color: 'white' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '5px' }}>SETI User Matrix</h2>
            <p style={{ fontSize: '0.95rem', color: '#f1f5f9', whiteSpace: 'pre-wrap' }}>
              {profileUser.bio || 'Этот пользователь ещё не загрузил данные своей биографии.'}
            </p>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', gap: isMobile ? '30px' : '60px' }}>
        {[
          { id: 'posts', label: 'ПОСТЫ', icon: Grid },
          { id: 'waves', label: 'ВОЛНЫ', icon: Film },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            style={{ 
              background: 'none', border: 'none', padding: '15px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1px',
              color: activeTab === tab.id ? '#00f5ff' : 'rgba(255,255,255,0.5)',
              borderTop: activeTab === tab.id ? '2px solid #00f5ff' : '2px solid transparent',
              marginTop: '-1px', transition: 'all 0.2s'
            }}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? '2px' : '4px', marginTop: '20px' }}>
        <AnimatePresence mode='wait'>
          {activeTab === 'posts' ? (
            (profileUser.posts || []).length > 0 ? (
              profileUser.posts.map((post: any) => (
                <motion.div key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ position: 'relative', aspectRatio: '1/1', background: 'rgba(255,255,255,0.03)', overflow: 'hidden', cursor: 'pointer' }}
                  onMouseEnter={e => {
                    const overlay = e.currentTarget.querySelector('.overlay') as HTMLElement;
                    if(overlay) overlay.style.opacity = '1';
                  }}
                  onMouseLeave={e => {
                    const overlay = e.currentTarget.querySelector('.overlay') as HTMLElement;
                    if(overlay) overlay.style.opacity = '0';
                  }}
                >
                  {post.imageUrl || post.videoUrl ? (
                    post.mediaType === 'video' ? (
                      <video src={post.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                    ) : (
                      <img src={post.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )
                  ) : (
                    <div style={{ padding: '12px', color: 'white', fontSize: isMobile ? '0.6rem' : '0.8rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                      {post.content.length > 60 ? post.content.substring(0, 60) + '...' : post.content}
                    </div>
                  )}
                  
                  <div className="overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '10px' : '20px', opacity: 0, transition: 'opacity 0.2s' }}>
                    <div style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: isMobile ? '0.7rem' : '1rem' }}><Heart size={isMobile ? 14 : 20} fill="white" /> {post.likesCount || 0}</div>
                    <div style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', fontSize: isMobile ? '0.7rem' : '1rem' }}><MessageCircle size={isMobile ? 14 : 20} fill="white" /> 0</div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '100px 0', color: 'rgba(255,255,255,0.3)' }}>Нет постов</div>
            )
          ) : (
            (profileUser.waves || []).length > 0 ? (
              profileUser.waves.map((wave: any) => (
                <motion.div key={wave.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ position: 'relative', aspectRatio: '1/1', background: 'rgba(0,0,0,0.2)', overflow: 'hidden', cursor: 'pointer' }}
                >
                  <video src={wave.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)', display: 'flex', alignItems: 'flex-end', padding: '10px' }}>
                    <div style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: '800' }}><Zap size={14} /> {wave.likesCount || 0}</div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '100px 0', color: 'rgba(255,255,255,0.3)' }}>Нет волн</div>
            )
          )}
        </AnimatePresence>
      </div>

      <FriendsModal isOpen={isFriendsModalOpen} onClose={() => setIsFriendsModalOpen(false)} username={profileUser.username} />
      
      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}
        currentUser={profileUser} onUpdate={(updated) => setProfileUser({ ...profileUser, ...updated })} />
    </div>
  );
};