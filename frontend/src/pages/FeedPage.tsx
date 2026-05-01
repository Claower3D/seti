import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Edit3, Check, X } from 'lucide-react';
import { StoryCameraModal } from '../components/StoryCameraModal';
import CommentsDrawer from '../components/CommentsDrawer';

export const FeedPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedMedia, setAttachedMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<number | null>(null);
  const [isCommentsDrawerOpen, setIsCommentsDrawerOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [stories, setStories] = useState<any[]>([]);
  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts');
      setPosts(res.data || []);
    } catch (err) {
      console.error('Failed to fetch posts');
      setPosts([]);
    }
  };

  const fetchStories = async () => {
    try { 
      const res = await api.get('/stories'); 
      const rawStories = res.data || [];
      
      // 1. Group by userId
      const groups: { [key: number]: any[] } = {};
      rawStories.forEach((s: any) => {
        if (!groups[s.userId]) groups[s.userId] = [];
        groups[s.userId].push(s);
      });

      // 2. Sort each group chronologically (Old to New)
      // 3. Sort groups by latest story (New to Old)
      const sortedUsers = Object.keys(groups).map(Number).sort((a, b) => {
        const latestA = Math.max(...groups[a].map(s => new Date(s.createdAt).getTime()));
        const latestB = Math.max(...groups[b].map(s => new Date(s.createdAt).getTime()));
        return latestB - latestA;
      });

      // 4. Flatten for viewer
      const flattened: any[] = [];
      sortedUsers.forEach(uid => {
        const userStories = groups[uid].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        flattened.push(...userStories);
      });

      setStories(flattened); 
    } catch { 
      setStories([]); 
    }
  };

  useEffect(() => { fetchPosts(); fetchStories(); }, []);

  useEffect(() => {
    setStoryProgress(0);
  }, [activeStoryIdx]);

  useEffect(() => {
    let timer: any;
    if (activeStoryIdx !== null && !isStoryPaused) {
      timer = setInterval(() => {
        setStoryProgress(prev => {
          if (prev >= 100) {
            if (activeStoryIdx < stories.length - 1) setActiveStoryIdx(activeStoryIdx + 1);
            else setActiveStoryIdx(null);
            return 0;
          }
          return prev + 1.2;
        });
      }, 50);
    }
    return () => clearInterval(timer);
  }, [activeStoryIdx, stories.length, isStoryPaused]);

  const handleStoryReply = async () => {
    if (!replyText.trim() || activeStoryIdx === null) return;
    const storyOwnerId = stories[activeStoryIdx].user.id;
    try {
      await api.post('/messages', {
        receiverId: storyOwnerId,
        content: replyText,
        replyStoryUrl: stories[activeStoryIdx].imageUrl
      });
      setReplyText('');
      setActiveStoryIdx(null);
      navigate('/messages', { state: { selectedFriendId: storyOwnerId } });
    } catch {
      alert('Ошибка при отправке ответа');
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !attachedMedia) return;
    setIsPosting(true);
    try {
      const res = await api.post('/posts', {
        content,
        imageUrl: attachedMedia?.type === 'image' ? attachedMedia.url : '',
        videoUrl: attachedMedia?.type === 'video' ? attachedMedia.url : '',
        mediaType: attachedMedia?.type || 'text'
      });
      setPosts([res.data, ...posts]);
      setContent('');
      setAttachedMedia(null);
    } catch (err) {
      console.error('Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);
    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAttachedMedia({ url: res.data.url, type: isVideo ? 'video' : 'image' });
    } catch (err) {
      console.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      await api.post(`/posts/${postId}/like`);
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, liked: !p.liked, likesCount: (p.likesCount || 0) + (p.liked ? -1 : 1) } : p
      ));
    } catch { console.error('Failed to like'); }
  };

  const handleDelete = async (postId: number) => {
    if (!confirm('Удалить запись?')) return;
    try {
      await api.delete(`/posts/${postId}`);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch { console.error('Failed to delete'); }
    setOpenMenu(null);
  };

  const handleEditStart = (post: any) => { setEditingId(post.id); setEditText(post.content); setOpenMenu(null); };

  const handleEditSave = async (postId: number) => {
    if (!editText.trim()) return;
    try {
      await api.patch(`/posts/${postId}`, { content: editText });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: editText } : p));
      setEditingId(null);
    } catch { console.error('Failed to edit'); }
  };

  const handleShare = async (postId: number) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
      alert('Запись скопирована в буфер обмена!');
    } catch {
      alert('Ошибка при копировании');
    }
  };

  const handleCommentsClick = (postId: number) => {
    setActiveCommentPostId(postId);
    if (isMobile) {
      setIsCommentsDrawerOpen(true);
    }
  };

  const submitComment = (postId: number) => {
    if (!commentText.trim()) return;
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments: [...(p.comments || []), { id: Date.now(), content: commentText, user: user }] } : p
    ));
    setCommentText('');
    if (!isMobile) setActiveCommentPostId(null);
  };

  const handleStoryUpload = async (file: File) => {
    const fd = new FormData(); fd.append('file', file);
    setIsUploadingStory(true);
    try {
      const res = await api.post('/upload', fd);
      await api.post('/stories', { imageUrl: res.data.url });
      fetchStories();
      setIsCameraOpen(false);
    } catch { alert('Ошибка загрузки истории'); } finally { setIsUploadingStory(false); }
  };


  return (
    <div style={{ display: 'flex', gap: isMobile ? '0' : '24px', alignItems: 'flex-start', flexDirection: 'column' }}>
      <div className="feed-container" style={{ width: '100%', maxWidth: isMobile ? '100%' : '700px', margin: '0 auto' }}>
        {/* STORIES SECTION */}
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? '12px' : '16px', 
          overflowX: 'auto', 
          paddingBottom: isMobile ? '16px' : '24px', 
          marginBottom: '8px', 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          justifyContent: stories.length < 4 && !isMobile ? 'center' : 'flex-start',
          WebkitOverflowScrolling: 'touch'
        }} className="hide-scrollbar">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? '6px' : '10px', flexShrink: 0 }}>
            <div
              onClick={() => setIsCameraOpen(true)}
              style={{ width: isMobile ? '64px' : '74px', height: isMobile ? '64px' : '74px', borderRadius: isMobile ? '20px' : '24px', background: 'rgba(255,255,255,0.03)', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isUploadingStory ? 'wait' : 'pointer', transition: 'all 0.3s', position: 'relative', opacity: isUploadingStory ? 0.6 : 1 }}
            >
              <img src={user?.avatar} alt="" style={{ width: isMobile ? '50px' : '60px', height: isMobile ? '50px' : '60px', borderRadius: isMobile ? '14px' : '18px', opacity: isUploadingStory ? 0.2 : 0.5 }} />
              <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', background: 'var(--primary)', color: 'black', borderRadius: '50%', width: isMobile ? '20px' : '24px', height: isMobile ? '20px' : '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg)', fontSize: isMobile ? '0.9rem' : '1.2rem', fontWeight: '900', boxShadow: 'var(--glow)' }}>{isUploadingStory ? '...' : '+'}</div>
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Вы</span>
          </div>

          {Array.from(new Map(stories.map(s => [s.userId, s])).values()).map((story) => {
            const firstStoryIdx = stories.findIndex(s => s.userId === story.userId);
            return (
              <div key={story.userId} onClick={() => { setActiveStoryIdx(firstStoryIdx); setStoryProgress(0); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? '6px' : '10px', flexShrink: 0, cursor: 'pointer' }}>
                <div style={{ padding: '2px', borderRadius: isMobile ? '22px' : '26px', background: 'linear-gradient(45deg, var(--primary), var(--secondary))', boxShadow: 'var(--glow)' }}>
                  <div style={{ background: 'var(--bg)', borderRadius: isMobile ? '20px' : '23px', padding: '2px' }}>
                    <img src={story.user?.avatar} alt="" style={{ width: isMobile ? '56px' : '64px', height: isMobile ? '56px' : '64px', borderRadius: isMobile ? '18px' : '20px', objectFit: 'cover' }} />
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'white', maxWidth: '64px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{story.user?.username}</span>
              </div>
            );
          })}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel"
          style={{ padding: isMobile ? '16px' : '24px', marginBottom: isMobile ? '16px' : '24px', border: '1px solid var(--border)', borderRadius: isMobile ? '20px' : '24px' }}
        >
          <div style={{ display: 'flex', gap: isMobile ? '12px' : '16px', marginBottom: isMobile ? '16px' : '20px' }}>
            <img src={user?.avatar} alt="avatar" style={{ width: isMobile ? '44px' : '52px', height: isMobile ? '44px' : '52px', borderRadius: isMobile ? '14px' : '16px', border: '2px solid var(--primary)', boxShadow: 'var(--glow)', flexShrink: 0 }} />
            <textarea
              className="input-field"
              placeholder="Что у вас нового?"
              style={{ minHeight: isMobile ? '80px' : '100px', resize: 'none', background: 'rgba(255,255,255,0.02)', fontSize: isMobile ? '1rem' : '1.1rem', padding: isMobile ? '12px' : '16px' }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {attachedMedia && (
            <div style={{ position: 'relative', width: 'fit-content', marginBottom: '20px', marginLeft: isMobile ? '0' : '68px', margin: isMobile ? '0 auto 20px' : '0 0 20px 68px' }}>
              {attachedMedia.type === 'video' ? (
                <video src={attachedMedia.url} style={{ maxHeight: '200px', borderRadius: '12px', border: '1px solid var(--primary)' }} muted autoPlay loop />
              ) : (
                <img src={attachedMedia.url} alt="attachment preview" style={{ maxHeight: '200px', borderRadius: '12px', border: '1px solid var(--primary)' }} />
              )}
              <button
                onClick={() => setAttachedMedia(null)}
                style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', padding: '6px', display: 'flex', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: isMobile ? '12px' : '20px' }}>
            <div style={{ display: 'flex', gap: isMobile ? '16px' : '24px' }}>
              <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept="image/*,video/*" />
              <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} style={{ background: 'none', border: 'none', color: isUploading ? 'rgba(255,255,255,0.2)' : 'var(--text-secondary)', cursor: isUploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', transition: 'var(--transition)', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                <ImageIcon size={isMobile ? 20 : 22} className={isUploading ? "" : "neon-text"} /> <span>{isUploading ? '...' : 'Медиа'}</span>
              </button>
            </div>
            <button className="btn-primary" onClick={handlePost} disabled={isPosting || isUploading} style={{ padding: isMobile ? '8px 16px' : '10px 24px', borderRadius: '12px' }}>
              {isPosting ? '...' : <><Send size={18} /> {isMobile ? 'Пульс' : 'Опубликовать'}</>}
            </button>
          </div>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <AnimatePresence>
            {posts.map((post, index) => {
              const isOwn = user?.username === post.user?.username;
              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(index * 0.05, 0.5) }}
                  className="glass-panel"
                  style={{ padding: '28px', borderLeft: index % 2 === 0 ? '4px solid var(--primary)' : '4px solid var(--secondary)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <Link to={`/profile/${post.user?.username}`} style={{ textDecoration: 'none', display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <img src={post.user?.avatar} alt="avatar" style={{ width: '54px', height: '54px', borderRadius: '18px', border: '2px solid rgba(255,255,255,0.1)' }} />
                      <div>
                        <div style={{ fontWeight: '900', fontSize: '1.2rem', color: 'var(--primary)', textShadow: 'var(--glow)' }}>{post.user?.username}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', boxShadow: 'var(--glow)' }}></div>
                          {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • SETI Network
                        </div>
                      </div>
                    </Link>

                    {isOwn && (
                      <div style={{ position: 'relative' }} ref={openMenu === post.id ? menuRef : null}>
                        <button onClick={() => setOpenMenu(openMenu === post.id ? null : post.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', borderRadius: '8px', display: 'flex' }}>
                          <MoreHorizontal size={22} />
                        </button>
                        <AnimatePresence>
                          {openMenu === post.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: -8 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="glass-panel"
                              style={{ position: 'absolute', right: 0, top: '36px', zIndex: 100, minWidth: '160px', padding: '8px', border: '1px solid rgba(0,242,255,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
                            >
                              <button onClick={() => handleEditStart(post)}
                                style={{ width: '100%', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,242,255,0.08)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                <Edit3 size={16} style={{ color: 'var(--primary-color)' }} /> Редактировать
                              </button>
                              <button onClick={() => handleDelete(post.id)}
                                style={{ width: '100%', background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '600' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,0,100,0.08)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                                <Trash2 size={16} style={{ color: '#ff3060' }} /> Удалить
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  {editingId === post.id ? (
                    <div style={{ marginBottom: '24px' }}>
                      <textarea className="input-field" value={editText} onChange={e => setEditText(e.target.value)} autoFocus
                        style={{ width: '100%', minHeight: '80px', resize: 'none', fontSize: '1.1rem', marginBottom: '12px' }} />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleEditSave(post.id)} className="btn-primary"
                          style={{ padding: '8px 20px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Check size={16} /> Сохранить
                        </button>
                        <button onClick={() => setEditingId(null)}
                          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px 20px', borderRadius: '10px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <X size={16} /> Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p style={{ marginBottom: (post.imageUrl || post.videoUrl) ? '16px' : '24px', fontSize: '1.15rem', lineHeight: '1.6', color: '#e2e8f0', letterSpacing: '0.2px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{post.content}</p>
                      {(post.imageUrl || post.videoUrl) && (
                        <div style={{ marginBottom: '24px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                          {post.mediaType === 'video' ? (
                            <video src={post.videoUrl} controls style={{ width: '100%', maxHeight: '500px' }} />
                          ) : (
                            <img src={post.imageUrl} alt="post media" style={{ width: '100%', maxHeight: '500px', objectFit: 'contain' }} />
                          )}
                        </div>
                      )}
                    </>
                  )}

                  <div style={{ display: 'flex', gap: isMobile ? '0' : '32px', justifyContent: isMobile ? 'space-between' : 'flex-start', borderTop: '1px solid var(--border-color)', paddingTop: isMobile ? '12px' : '20px' }}>
                    <motion.button 
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handleLike(post.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', color: post.liked ? '#ff3060' : 'var(--text-secondary)', padding: isMobile ? '8px' : '0' }}>
                      <Heart size={isMobile ? 22 : 24} fill={post.liked ? '#ff3060' : 'none'} />
                      <span style={{ fontSize: isMobile ? '0.85rem' : '1rem' }}>{post.likesCount || ''}</span>
                    </motion.button>
                    
                    <motion.button 
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handleCommentsClick(post.id)} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', padding: isMobile ? '8px' : '0' }}>
                      <MessageCircle size={isMobile ? 22 : 24} /> 
                      <span style={{ fontSize: isMobile ? '0.85rem' : '1rem' }}>{post.comments?.length || ''}</span>
                    </motion.button>

                    <motion.button 
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handleShare(post.id)} 
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', padding: isMobile ? '8px' : '0' }}>
                      <Share2 size={isMobile ? 22 : 24} /> 
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {activeCommentPostId === post.id && !isMobile && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                        {(post.comments || []).map((c: any) => (
                           <div key={c.id} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                             <img src={c.user?.avatar} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(var(--primary-rgb), 0.3)' }} />
                             <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '12px', flex: 1 }}>
                               <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '4px' }}>{c.user?.username}</div>
                               <div style={{ fontSize: '0.95rem', color: '#cbd5e1' }}>{c.content}</div>
                             </div>
                           </div>
                        ))}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                          <input type="text" className="input-field" placeholder="Написать комментарий..." value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitComment(post.id)} />
                          <button className="btn-primary" onClick={() => submitComment(post.id)} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Отправить</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* STORY VIEWER MODAL */}
      <AnimatePresence>
        {activeStoryIdx !== null && stories[activeStoryIdx] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(35px)' }}
          >
            <div style={{ width: '100%', maxWidth: '450px', height: isMobile ? '100%' : '85vh', position: 'relative', overflow: 'hidden', borderRadius: isMobile ? '0' : '32px', background: '#000', boxShadow: '0 0 50px rgba(var(--primary-rgb), 0.2)' }}>

              {(() => {
                const currentUserStories = stories.filter(s => s.userId === stories[activeStoryIdx].userId);
                const currentIdxInUser = currentUserStories.findIndex(s => s.id === stories[activeStoryIdx].id);
                return (
                  <div style={{ position: 'absolute', top: isMobile ? 'calc(env(safe-area-inset-top) + 16px)' : '16px', left: '16px', right: '16px', display: 'flex', gap: '6px', zIndex: 10 }}>
                    {currentUserStories.map((_, i) => (
                      <div key={i} style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px' }}>
                        <div style={{ width: i < currentIdxInUser ? '100%' : (i === currentIdxInUser ? `${storyProgress}%` : '0%'), height: '100%', background: 'var(--primary)', boxShadow: 'var(--glow)' }} />
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div style={{ position: 'absolute', top: isMobile ? 'calc(env(safe-area-inset-top) + 36px)' : '36px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={stories[activeStoryIdx].user?.avatar} alt="" style={{ width: '40px', height: '40px', borderRadius: '12px', border: '2px solid var(--primary)' }} />
                  <div>
                    <div style={{ fontWeight: '900', color: 'white', fontSize: '0.95rem' }}>{stories[activeStoryIdx].user?.username}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', fontWeight: '800' }}>SIGNAL ACTIVE</div>
                  </div>
                </div>
                <button onClick={() => setActiveStoryIdx(null)} style={{ background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <X size={20} />
                </button>
              </div>

              <img src={stories[activeStoryIdx].imageUrl} alt="story"
                onMouseDown={() => setIsStoryPaused(true)} onMouseUp={() => setIsStoryPaused(false)}
                onMouseLeave={() => setIsStoryPaused(false)} onTouchStart={() => setIsStoryPaused(true)} onTouchEnd={() => setIsStoryPaused(false)}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />

              <div style={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                right: 0, 
                padding: isMobile ? '20px 20px calc(env(safe-area-inset-bottom) + 20px)' : '20px 20px 40px', 
                background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)', 
                display: 'flex', 
                gap: '12px', 
                alignItems: 'center', 
                zIndex: 20 
              }}>
                <input type="text" placeholder="Ответить..." value={replyText} onChange={(e) => setReplyText(e.target.value)}
                  onFocus={() => setIsStoryPaused(true)} onBlur={() => setIsStoryPaused(false)}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '24px', padding: '10px 18px', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                />
                <motion.button whileTap={{ scale: 0.9 }} onClick={handleStoryReply} style={{ background: 'var(--primary)', border: 'none', color: 'black', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Send size={18} />
                </motion.button>
              </div>

              <div onClick={() => activeStoryIdx > 0 && setActiveStoryIdx(activeStoryIdx - 1)} style={{ position: 'absolute', left: 0, top: 0, bottom: '100px', width: '35%', zIndex: 5 }} />
              <div onClick={() => activeStoryIdx < stories.length - 1 ? setActiveStoryIdx(activeStoryIdx + 1) : setActiveStoryIdx(null)} style={{ position: 'absolute', right: 0, top: 0, bottom: '100px', width: '35%', zIndex: 5 }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STORY CAMERA MODAL */}
      <StoryCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onUpload={handleStoryUpload}
        isUploading={isUploadingStory}
      />

      {/* MOBILE COMMENTS DRAWER */}
      {isMobile && activeCommentPostId && (
        <CommentsDrawer
          isOpen={isCommentsDrawerOpen}
          onClose={() => setIsCommentsDrawerOpen(false)}
          itemId={activeCommentPostId}
          type="post"
          currentUser={user}
        />
      )}
    </div>
  );
};
