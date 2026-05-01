import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, X, Grid, Film, Zap, Settings, UserPlus, UserMinus, UserCheck, Search, Users, UserRoundPlus, UserRoundMinus } from 'lucide-react';
import { EditProfileModal } from '../components/EditProfileModal';


const MatrixHologram = ({ color }: { color: string }) => {
  const columns = useMemo(() => Array.from({ length: 10 }), []);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5, overflow: 'hidden', borderRadius: '50%', opacity: 0.4 }}>
      {columns.map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -100 }}
          animate={{ y: 150 }}
          transition={{ 
            duration: Math.random() * 2 + 1, 
            repeat: Infinity, 
            delay: Math.random() * 2,
            ease: "linear"
          }}
          style={{
            position: 'absolute',
            left: `${i * 10}%`,
            color: color,
            fontSize: '8px',
            fontWeight: 'bold',
            writingMode: 'vertical-rl',
            textShadow: `0 0 5px ${color}`,
            fontFamily: 'monospace'
          }}
        >
          {Array.from({ length: 10 }).map(() => String.fromCharCode(0x30A0 + Math.random() * 96)).join('')}
        </motion.div>
      ))}
    </div>
  );
};


const MediaViewerModal = ({ isOpen, onClose, media, type, isMobile, owner }: { isOpen: boolean, onClose: () => void, media: any, type: 'post' | 'wave', isMobile: boolean, owner: any }) => {
  const displayUser = media?.user || owner;
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(media?.liked || false);
  const [likesCount, setLikesCount] = useState(media?.likesCount || 0);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    if (isOpen && media) {
      setLiked(media.liked);
      setLikesCount(media.likesCount);
      setLoadingComments(true);
      const endpoint = type === 'post' ? `/posts/${media.id}/comments` : `/waves/${media.id}/comments`;
      api.get(endpoint)
        .then(res => setComments(res.data || []))
        .catch(() => {})
        .finally(() => setLoadingComments(false));
    }
  }, [isOpen, media, type]);

  const handleLike = async () => {
    try {
      const endpoint = type === 'post' ? `/posts/${media.id}/like` : `/waves/${media.id}/like`;
      await api.post(endpoint);
      setLiked(!liked);
      setLikesCount((prev: number) => liked ? prev - 1 : prev + 1);
    } catch { console.error('Failed to like'); }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const endpoint = type === 'post' ? `/posts/${media.id}/comments` : `/waves/${media.id}/comments`;
      const res = await api.post(endpoint, { content: newComment });
      setComments([...comments, res.data]);
      setNewComment('');
    } catch { console.error('Failed to comment'); }
  };

  if (!isOpen || !media) return null;

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '0' : '40px' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(15px)' }} />
        
        <motion.div initial={{ opacity: 0, scale: isMobile ? 1 : 0.9, y: isMobile ? 100 : 0 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: isMobile ? 1 : 0.9, y: isMobile ? 100 : 0 }}
          style={{ 
            position: 'relative', 
            width: '100%', 
            maxWidth: '1100px', 
            height: isMobile ? '100%' : '85vh',
            background: 'rgba(5, 6, 8, 0.95)',
            backdropFilter: 'blur(20px)',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            overflow: 'hidden',
            borderRadius: isMobile ? '0' : '24px',
            border: isMobile ? 'none' : '1px solid var(--border-bright)',
            boxShadow: '0 0 100px rgba(0,0,0,0.8)'
          }}
        >
          {/* Media Section */}
          <div style={{ flex: isMobile ? 'none' : 1.5, height: isMobile ? '40vh' : 'auto', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {type === 'wave' || media.mediaType === 'video' ? (
              <video src={media.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} controls autoPlay loop />
            ) : media.imageUrl ? (
              <img src={media.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ padding: '40px', color: 'white', fontSize: '1.1rem', textAlign: 'center', fontWeight: '500' }}>{media.content}</div>
            )}
            <button onClick={onClose} style={{ position: 'absolute', top: isMobile ? 'calc(env(safe-area-inset-top) + 16px)' : '20px', right: '20px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '50%', padding: '10px', zIndex: 10, display: 'flex' }}><X size={20} /></button>
          </div>

          {/* Social Section */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#050608', borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
            {/* Header */}
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={displayUser?.avatar} alt="" style={{ width: '36px', height: '36px', borderRadius: '12px', border: '1px solid var(--primary)' }} />
              <div style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '0.9rem', letterSpacing: '0.5px' }}>{displayUser?.username}</div>
            </div>

            {/* Content / Comments */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', scrollbarWidth: 'none' }}>
              {(type === 'post' && media.imageUrl) && (
                 <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                       <img src={displayUser?.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '10px' }} />
                       <div>
                          <span style={{ fontWeight: '800', color: 'white', marginRight: '8px' }}>{displayUser?.username}</span>
                          <span style={{ color: '#e2e8f0', fontSize: '0.9rem', lineHeight: '1.5' }}>{media.content}</span>
                       </div>
                    </div>
                 </div>
              )}

              {loadingComments ? (
                <div style={{ textAlign: 'center', padding: '40px' }}><div className="pulse" style={{ width: '6px', height: '6px', background: 'var(--primary)', margin: 'auto' }} /></div>
              ) : (
                comments.map(c => (
                  <div key={c.id} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    <img src={c.user?.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '10px' }} />
                    <div style={{ fontSize: '0.9rem' }}>
                      <span style={{ fontWeight: '800', color: 'white', marginRight: '8px' }}>{c.user?.username}</span>
                      <span style={{ color: '#cbd5e1' }}>{c.content}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Actions */}
            <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
                <motion.button whileTap={{ scale: 0.9 }} onClick={handleLike} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: liked ? '#ff3060' : 'white' }}>
                  <Heart size={26} fill={liked ? '#ff3060' : 'none'} />
                </motion.button>
                <MessageCircle size={26} color="white" />
              </div>
              <div style={{ fontWeight: '900', color: 'white', fontSize: '0.9rem' }}>{likesCount} <span style={{ fontWeight: '500', color: 'rgba(255,255,255,0.5)' }}>Лайков</span></div>
            </div>

            {/* Comment Input */}
            <form onSubmit={handleComment} style={{ padding: '12px 16px calc(12px + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '12px', background: '#000' }}>
              <input 
                type="text" 
                placeholder="Написать..." 
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '20px', padding: '10px 18px', color: 'white', fontSize: '0.9rem', outline: 'none' }} 
              />
              <button type="submit" disabled={!newComment.trim()} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '900', cursor: 'pointer', opacity: newComment.trim() ? 1 : 0.3 }}>OK</button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

type SocialType = 'friends' | 'followers' | 'following';

const SocialListModal = ({ isOpen, onClose, username, type: initialType, profileId, onAction }: { isOpen: boolean, onClose: () => void, username: string, type: SocialType, profileId: number, onAction?: () => void }) => {
  const { user: currentUser } = useAuth();
  const [listType, setListType] = useState<SocialType>(initialType);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setListType(initialType);
    }
  }, [isOpen, initialType]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const endpoint = `/profile/${username}/${listType}`;
      api.get(endpoint)
        .then(res => setUsers(res.data || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, username, listType]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [users, searchQuery]);

  const handleAction = async (targetId: number, action: 'add' | 'remove') => {
    setActionLoadingId(targetId);
    try {
      if (action === 'add') {
        await api.post(`/friends/request/${targetId}`);
      } else {
        await api.delete(`/friends/${targetId}`);
      }
      // Refresh list
      const res = await api.get(`/profile/${username}/${listType}`);
      setUsers(res.data || []);
      if (onAction) onAction();
    } catch (err) {
      console.error("Action error", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const isOwnModal = currentUser?.id === profileId;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '0' : '20px' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)' }} />
        
        <motion.div initial={{ opacity: 0, y: isMobile ? '100%' : 20, scale: isMobile ? 1 : 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: isMobile ? '100%' : 20, scale: isMobile ? 1 : 0.9 }}
          className="glass-panel" 
          style={{ 
            position: 'relative', width: '100%', maxWidth: '440px', 
            height: isMobile ? '100%' : 'auto', maxHeight: isMobile ? '100%' : '80vh',
            padding: '0', border: isMobile ? 'none' : '1px solid var(--border-bright)', 
            display: 'flex', flexDirection: 'column', 
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            overflow: 'hidden',
            borderRadius: isMobile ? '0' : '24px'
          }}>
          
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingTop: isMobile ? 'calc(env(safe-area-inset-top) + 8px)' : '0' }}>
            {(['friends', 'followers', 'following'] as SocialType[]).map(t => (
              <button key={t} onClick={() => { setListType(t); setSearchQuery(''); }}
                style={{ 
                  flex: 1, padding: '16px 8px', background: 'none', border: 'none', 
                  color: listType === t ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
                  fontWeight: '900', fontSize: '0.75rem', cursor: 'pointer',
                  borderBottom: listType === t ? '2px solid var(--primary)' : '2px solid transparent',
                  transition: 'all 0.2s',
                  letterSpacing: '0.5px'
                }}>
                {t === 'friends' ? 'ДРУЗЬЯ' : t === 'followers' ? 'ПОДПИСЧИКИ' : 'ПОДПИСКИ'}
              </button>
            ))}
            <button onClick={onClose} style={{ padding: '0 16px', background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={22} /></button>
          </div>

          {/* Search */}
          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
              <input 
                type="text" 
                placeholder="Поиск..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 14px 10px 38px', color: 'white', fontSize: '0.9rem', outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', scrollbarWidth: 'none' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}><div className="pulse" style={{ width: '6px', height: '6px', background: 'var(--primary)', margin: 'auto' }} /></div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', padding: '60px 0' }}>
                <Users size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                <p style={{ fontWeight: '700' }}>{searchQuery ? 'Ничего не найдено' : 'Пусто'}</p>
              </div>
            ) : (
              filteredUsers.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Link to={`/profile/${u.username}`} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, textDecoration: 'none' }}>
                    <img src={u.avatar} alt="" style={{ width: '44px', height: '44px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '900', color: 'white', fontSize: '0.9rem' }}>@{u.username}</span>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>{u.fullName || 'User'}</span>
                    </div>
                  </Link>
                  
                  {isOwnModal && (
                    <button 
                      disabled={actionLoadingId === u.id}
                      onClick={() => handleAction(u.id, listType === 'following' || listType === 'friends' ? 'remove' : 'add')}
                      style={{ 
                        background: listType === 'friends' ? 'rgba(255,60,60,0.15)' : 'var(--primary)', 
                        border: 'none',
                        color: listType === 'friends' ? '#ff3060' : 'black',
                        padding: '8px 16px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '900', cursor: 'pointer'
                      }}>
                      {actionLoadingId === u.id ? '...' : (listType === 'friends' ? 'Удалить' : (listType === 'following' ? 'Отмена' : 'В ответ'))}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};


const MatrixBackgroundHologram = ({ color }: { color: string }) => {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, opacity: 0.15 }}>
      {Array.from({ length: 25 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ y: -500 }}
          animate={{ y: 500 }}
          transition={{ duration: Math.random() * 10 + 5, repeat: Infinity, delay: Math.random() * 5, ease: 'linear' }}
          style={{
            position: 'absolute',
            left: (i * 4) + "%",
            color: color,
            fontSize: '12px',
            writingMode: 'vertical-rl',
            fontFamily: 'monospace',
            textShadow: `0 0 8px ${color}`,
          }}
        >
          {Array.from({ length: 20 }).map(() => String.fromCharCode(0x30A0 + Math.random() * 96)).join('')}
        </motion.div>
      ))}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(5,6,8,0) 60%, rgba(5,6,8,1) 100%)' }} />
    </div>
  );
};

export const ProfilePage = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'waves'>('posts');
  
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [socialModalType, setSocialModalType] = useState<SocialType>('friends');

  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [mediaType, setMediaType] = useState<'post' | 'wave'>('post');

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const isOwnProfile = currentUser?.username === username;
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'friends'>('none');
  const [friendActionLoading, setFriendActionLoading] = useState(false);

  const fetchFriendStatus = async () => {
    if (isOwnProfile || !username || !profileUser) return;
    try {
      const friendsRes = await api.get('/friends');
      const friends: any[] = friendsRes.data || [];
      const isFriend = friends.some((f: any) => f.id === profileUser.id);
      if (isFriend) { setFriendStatus('friends'); return; }

      await api.get('/friends/requests');
      // Check outgoing? Backend refactor should help. 
      // For now client updates based on action.
      setFriendStatus('none');
    } catch { setFriendStatus('none'); }
  };

  const handleFriendAction = async (action: 'add' | 'remove') => {
    setFriendActionLoading(true);
    try {
       if (action === 'add') {
         const res = await api.post(`/friends/request/${profileUser.id}`);
         if (res.data.status === 'accepted') {
           setFriendStatus('friends');
         } else {
           setFriendStatus('pending');
         }
       } else {
         await api.delete(`/friends/${profileUser.id}`);
         setFriendStatus('none');
       }
       const updatedProfile = await api.get(`/profile/${username}`);
       setProfileUser(updatedProfile.data);
    } catch (err) {
       console.error("Action failed", err);
    } finally {
       setFriendActionLoading(false);
    }
  };

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

  useEffect(() => {
    if (profileUser && !isOwnProfile) fetchFriendStatus();
  }, [profileUser, isOwnProfile]);

  const openSocialModal = (type: SocialType) => {
    setSocialModalType(type);
    setIsSocialModalOpen(true);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: '40px', height: '40px', border: '2px solid transparent', borderTopColor: 'var(--primary)', borderRadius: '50%', boxShadow: 'var(--glow)' }} />
    </div>
  );

  if (!profileUser) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-secondary)' }}>Пользователь не найден</div>
  );

  return (
    <div style={{ maxWidth: '935px', margin: '0 auto', padding: isMobile ? '0 10px' : '0 20px', position: 'relative' }}>
      
      {/* Background Hologram Banner */}
      <div style={{ 
        position: 'absolute', 
        top: -60, 
        left: 0, 
        right: 0, 
        height: '420px', 
        zIndex: -1, 
        overflow: 'hidden',
        pointerEvents: 'none',
        maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
      }}>
        {profileUser.hologram === 'matrix' && <MatrixBackgroundHologram color={profileUser.neonColor} />}
      </div>

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
            alt="avatar" style={{ width: isMobile ? '90px' : '110px', height: isMobile ? '90px' : '110px', borderRadius: '50%', border: `2px solid ${profileUser.neonColor || 'var(--border)'}`, padding: '4px', objectFit: 'cover', boxShadow: `0 0 20px ${profileUser.neonColor}33` }} />
          
          {profileUser.hologram === 'matrix' && <MatrixHologram color={profileUser.neonColor} />}
          
          <motion.div
            animate={{ 
              boxShadow: [`0 0 15px ${profileUser.neonColor}22`, `0 0 35px ${profileUser.neonColor}44`, `0 0 15px ${profileUser.neonColor}22`]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ position: 'absolute', inset: 0, borderRadius: '50%', pointerEvents: 'none' }}
          />
        </div>
        
        <div style={{ flex: 1, width: isMobile ? '100%' : 'auto' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '20px', 
            marginBottom: '20px',
            justifyContent: isMobile ? 'center' : 'flex-start'
          }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--primary)', textShadow: 'var(--glow)' }}>{profileUser.username}</h1>
            {isOwnProfile && (
              <button onClick={() => setIsEditModalOpen(true)}
                className="btn-primary"
                style={{ 
                  padding: '8px 18px',
                   borderRadius: '12px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'transform 0.2s',
                  background: 'var(--primary)',
                  color: 'black',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  boxShadow: 'var(--glow-strong)'
                }}
              >
                <Settings size={18} style={{ transition: 'transform 0.4s' }}
                  onMouseEnter={(e: any) => e.currentTarget.style.transform = 'rotate(90deg)'}
                  onMouseLeave={(e: any) => e.currentTarget.style.transform = 'rotate(0deg)'}
                />
                Настройки
              </button>
            )}
            {!isOwnProfile && friendStatus === 'none' && (
              <button
                disabled={friendActionLoading}
                onClick={() => handleFriendAction('add')}
                className="btn-primary"
                style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <UserPlus size={16} /> Подписаться
              </button>
            )}
            {!isOwnProfile && friendStatus === 'pending' && (
              <button
                disabled={friendActionLoading}
                onClick={() => handleFriendAction('remove')}
                className="btn-primary"
                style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', color: 'white' }}
              >
                <UserCheck size={16} /> Вы подписаны
              </button>
            )}
            {!isOwnProfile && friendStatus === 'friends' && (
              <button
                disabled={friendActionLoading}
                onClick={() => handleFriendAction('remove')}
                style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px', border: '1px solid rgba(255,60,60,0.4)', background: 'rgba(255,60,60,0.08)', color: 'rgba(255,100,100,0.9)', fontWeight: '800', cursor: 'pointer', fontSize: '0.88rem' }}
              >
                <UserMinus size={16} /> Удалить из друзей
              </button>
            )}
          </div>

          <div style={{ 
            display: 'flex', 
            gap: isMobile ? '20px' : '40px', 
            marginBottom: '20px',
            justifyContent: isMobile ? 'center' : 'flex-start',
            flexWrap: 'wrap'
          }}>
            <div style={{ fontSize: '0.95rem', color: 'white' }}><span style={{ fontWeight: '800' }}>{profileUser.posts?.length || 0}</span> постов</div>
            <div onClick={() => openSocialModal('friends')} style={{ fontSize: '0.95rem', color: 'white', cursor: 'pointer' }}><span style={{ fontWeight: '800' }}>{profileUser.friendsCount || 0}</span> друзей</div>
            <div onClick={() => openSocialModal('followers')} style={{ fontSize: '0.95rem', color: 'white', cursor: 'pointer' }}><span style={{ fontWeight: '800' }}>{profileUser.followersCount || 0}</span> подписчиков</div>
            <div onClick={() => openSocialModal('following')} style={{ fontSize: '0.95rem', color: 'white', cursor: 'pointer' }}><span style={{ fontWeight: '800' }}>{profileUser.followingCount || 0}</span> подписок</div>
            <div style={{ fontSize: '0.95rem', color: 'white' }}><span style={{ fontWeight: '800' }}>{profileUser.waves?.length || 0}</span> волн</div>
          </div>

          <div style={{ color: 'white' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '5px' }}>{profileUser.fullName || 'SETI User Matrix'}</h2>
            <p style={{ fontSize: '0.95rem', color: '#f1f5f9', whiteSpace: 'pre-wrap' }}>
              {profileUser.bio || 'Этот пользователь ещё не загрузил данные своей биографии.'}
            </p>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', gap: isMobile ? '30px' : '60px', background: isMobile ? 'rgba(255,255,255,0.02)' : 'transparent', borderRadius: isMobile ? '12px' : '0' }}>
        {[
          { id: 'posts', label: isMobile ? 'ПОСТЫ' : 'ПУБЛИКАЦИИ', icon: Grid },
          { id: 'waves', label: isMobile ? 'ВОЛНЫ' : 'ВОЛНЫ (REELS)', icon: Film },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            style={{ 
              background: 'none', border: 'none', padding: isMobile ? '12px 0' : '15px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '900', letterSpacing: '1.5px',
              color: activeTab === tab.id ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
              borderTop: !isMobile && activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              borderBottom: isMobile && activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              marginTop: '-1px', transition: 'all 0.2s',
              textShadow: activeTab === tab.id ? 'var(--glow)' : 'none'
            }}>
            <tab.icon size={isMobile ? 16 : 14} /> {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? '2px' : '4px', marginTop: '20px' }}>
        <AnimatePresence mode='wait'>
          {activeTab === 'posts' ? (
            (profileUser.posts || []).length > 0 ? (
              profileUser.posts.map((post: any) => (
                <motion.div key={post.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  whileHover={{ scale: 1.02, zIndex: 10 }}
                  onClick={() => { setSelectedMedia(post); setMediaType('post'); }}
                  style={{ 
                    position: 'relative', 
                    aspectRatio: '1/1', 
                    background: 'rgba(255,255,255,0.03)', 
                    overflow: 'hidden', 
                    cursor: 'pointer',
                    borderRadius: isMobile ? '8px' : '16px',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--glow)',
                    transition: 'border-color 0.3s, box-shadow 0.3s'
                  }}
                  onMouseEnter={e => {
                    const overlay = e.currentTarget.querySelector('.overlay') as HTMLElement;
                    if(overlay) overlay.style.opacity = '1';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.boxShadow = 'var(--glow-strong)';
                  }}
                  onMouseLeave={e => {
                    const overlay = e.currentTarget.querySelector('.overlay') as HTMLElement;
                    if(overlay) overlay.style.opacity = '0';
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'var(--glow)';
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
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Нет публикаций</div>
            )
          ) : (
            (profileUser.waves || []).length > 0 ? (
              profileUser.waves.map((wave: any) => (
                <motion.div key={wave.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  whileHover={{ scale: 1.02, zIndex: 10 }}
                  onClick={() => { setSelectedMedia(wave); setMediaType('wave'); }}
                  style={{ 
                    position: 'relative', 
                    aspectRatio: '9/16', 
                    background: 'rgba(255,255,255,0.03)', 
                    overflow: 'hidden', 
                    cursor: 'pointer',
                    borderRadius: isMobile ? '8px' : '16px',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--glow)'
                  }}
                >
                  <video src={wave.videoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                  <div style={{ position: 'absolute', bottom: '15px', left: '15px', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800' }}>
                    <Zap size={16} fill="white" /> {wave.likesCount || 0}
                  </div>
                </motion.div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Нет волн</div>
            )
          )}
        </AnimatePresence>
      </div>

      <MediaViewerModal 
        isOpen={!!selectedMedia} 
        onClose={() => setSelectedMedia(null)} 
        media={selectedMedia} 
        type={mediaType} 
        isMobile={isMobile}
        owner={profileUser}
      />

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        currentUser={currentUser}
        onUpdate={(updated) => setProfileUser({ ...profileUser, ...updated })}
      />

      <SocialListModal 
        isOpen={isSocialModalOpen}
        onClose={() => setIsSocialModalOpen(false)}
        username={username!}
        type={socialModalType}
        profileId={profileUser.id}
        onAction={() => {
           // Refetch counts if needed, but the modal refreshes itself internally.
           // However we might want to refresh the ProfilePage stats too.
           api.get(`/profile/${username}`).then(res => setProfileUser(res.data));
        }}
      />
    </div>
  );
};