import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Edit3, Check, X } from 'lucide-react';

export const FeedPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [stories, setStories] = useState<any[]>([]);
  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);
  const storyInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);

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
    try { const res = await api.get('/stories'); setStories(res.data || []); } catch { setStories([]); }
  };

  useEffect(() => { fetchPosts(); fetchStories(); }, []);

  useEffect(() => {
    let timer: any;
    if (activeStoryIdx !== null) {
      setStoryProgress(0);
      timer = setInterval(() => {
        setStoryProgress(prev => {
          if (prev >= 100) {
            if (activeStoryIdx < stories.length - 1) setActiveStoryIdx(activeStoryIdx + 1);
            else setActiveStoryIdx(null);
            return 0;
          }
          return prev + 1.2; // roughly 4-5 seconds
        });
      }, 50);
    }
    return () => clearInterval(timer);
  }, [activeStoryIdx, stories.length]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !attachedImage) return;
    setIsPosting(true);
    try {
      const res = await api.post('/posts', { content, imageUrl: attachedImage });
      setPosts([res.data, ...posts]);
      setContent('');
      setAttachedImage(null);
    } catch (err) {
      console.error('Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    setIsUploading(true);
    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAttachedImage(res.data.url);
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

  const submitComment = (postId: number) => {
    if (!commentText.trim()) return;
    // For now, optimistic local update since we just want it to "work" in UI
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, comments: [...(p.comments || []), { id: Date.now(), content: commentText, user: user }] } : p
    ));
    setCommentText('');
    setActiveCommentPostId(null);
  };

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      <div className="feed-container">
        {/* STORIES SECTION */}
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '24px', marginBottom: '8px', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="hide-scrollbar">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <div 
              onClick={() => storyInputRef.current?.click()}
              style={{ width: '74px', height: '74px', borderRadius: '24px', background: 'rgba(0,245,255,0.05)', border: '2px dashed rgba(0,245,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isUploadingStory ? 'wait' : 'pointer', transition: 'all 0.3s', position: 'relative', opacity: isUploadingStory ? 0.6 : 1 }}
              onMouseEnter={e => !isUploadingStory && (e.currentTarget.style.borderColor = 'var(--primary-color)')}
              onMouseLeave={e => !isUploadingStory && (e.currentTarget.style.borderColor = 'rgba(0,245,255,0.3)')}
            >
              <img src={user?.avatar} alt="" style={{ width: '60px', height: '60px', borderRadius: '18px', opacity: isUploadingStory ? 0.2 : 0.5 }} />
              <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--primary-color)', color: 'black', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid var(--bg)', fontSize: '1.2rem', fontWeight: '900' }}>{isUploadingStory ? '...' : '+'}</div>
              <input type="file" ref={storyInputRef} hidden onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return;
                const fd = new FormData(); fd.append('file', file);
                setIsUploadingStory(true);
                try {
                  const res = await api.post('/upload', fd);
                  await api.post('/stories', { imageUrl: res.data.url });
                  fetchStories();
                } catch { alert('Ошибка загрузки истории'); } finally { setIsUploadingStory(false); }
              }} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>Ваша история</span>
          </div>

          {stories.map((story, idx) => (
            <div key={story.id} onClick={() => { setActiveStoryIdx(idx); setStoryProgress(0); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flexShrink: 0, cursor: 'pointer' }}>
              <div style={{ padding: '3px', borderRadius: '26px', background: 'linear-gradient(45deg, #00f5ff, #b400ff)', boxShadow: '0 0 15px rgba(0,245,255,0.3)' }}>
                <div style={{ background: 'var(--bg)', borderRadius: '23px', padding: '2px' }}>
                  <img src={story.user?.avatar} alt="" style={{ width: '64px', height: '64px', borderRadius: '20px', objectFit: 'cover' }} />
                </div>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'white' }}>{story.user?.username}</span>
            </div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel"
          style={{ padding: '24px', marginBottom: '24px', border: '1px solid rgba(0, 242, 255, 0.2)' }}
        >
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <img src={user?.avatar} alt="avatar" style={{ width: '52px', height: '52px', borderRadius: '16px', border: '2px solid var(--primary-color)' }} />
            <textarea
              className="input-field"
              placeholder="Что у вас нового?"
              style={{ minHeight: '100px', resize: 'none', background: 'rgba(255,255,255,0.02)', fontSize: '1.1rem' }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {attachedImage && (
            <div style={{ position: 'relative', width: 'fit-content', marginBottom: '20px', marginLeft: '68px' }}>
              <img src={attachedImage} alt="attachment preview" style={{ maxHeight: '200px', borderRadius: '12px', border: '1px solid rgba(0, 245, 255, 0.3)' }} />
              <button 
                onClick={() => setAttachedImage(null)}
                style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: 'white', cursor: 'pointer', padding: '4px', display: 'flex' }}
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', gap: '24px' }}>
              <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} accept="image/*,video/*" />
              <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} style={{ background: 'none', border: 'none', color: isUploading ? 'rgba(255,255,255,0.3)' : 'var(--text-secondary)', cursor: isUploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', transition: 'var(--transition)' }}>
                <ImageIcon size={22} className={isUploading ? "" : "neon-text"} /> <span>{isUploading ? 'Загрузка...' : 'Медиа'}</span>
              </button>
            </div>
            <button className="btn-primary" onClick={handlePost} disabled={isPosting || isUploading}>
              {isPosting ? 'Публикация...' : <><Send size={18} /> Опубликовать</>}
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
                  style={{ padding: '28px', borderLeft: index % 2 === 0 ? '4px solid var(--primary-color)' : '4px solid var(--secondary-color)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <Link to={`/profile/${post.user?.username}`} style={{ textDecoration: 'none', display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <img src={post.user?.avatar} alt="avatar" style={{ width: '54px', height: '54px', borderRadius: '18px', border: '2px solid rgba(255,255,255,0.1)' }} />
                      <div>
                        <div style={{ fontWeight: '900', fontSize: '1.2rem', color: 'white' }}>{post.user?.username}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-color)', boxShadow: '0 0 5px var(--primary-color)' }}></div>
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
                      <p style={{ marginBottom: post.imageUrl ? '16px' : '24px', fontSize: '1.15rem', lineHeight: '1.6', color: '#e2e8f0', letterSpacing: '0.2px', wordBreak: 'break-word', overflowWrap: 'break-word' }}>{post.content}</p>
                      {post.imageUrl && (
                        <div style={{ marginBottom: '24px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <img src={post.imageUrl} alt="post media" style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', background: 'rgba(0,0,0,0.2)' }} />
                        </div>
                      )}
                    </>
                  )}

                  <div style={{ display: 'flex', gap: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                    <button onClick={() => handleLike(post.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', transition: 'var(--transition)', color: post.liked ? '#ff3060' : 'var(--text-secondary)' }}
                      className="post-action-btn">
                      <Heart size={24} fill={post.liked ? '#ff3060' : 'none'} style={{ filter: post.liked ? 'drop-shadow(0 0 6px #ff3060)' : 'none' }} />
                      <span>{post.likesCount > 0 ? post.likesCount : 'Лайк'}</span>
                    </button>
                    <button onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', transition: 'var(--transition)' }} className="post-action-btn">
                      <MessageCircle size={24} /> <span>Коммент</span>
                    </button>
                    <button onClick={() => handleShare(post.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', transition: 'var(--transition)' }} className="post-action-btn">
                      <Share2 size={24} /> <span>Share</span>
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {activeCommentPostId === post.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                        {(post.comments || []).map((c: any) => (
                           <div key={c.id} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                             <img src={c.user?.avatar} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(0,245,255,0.3)' }} />
                             <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '12px', flex: 1 }}>
                               <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#00f5ff', marginBottom: '4px' }}>{c.user?.username}</div>
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
        {activeStoryIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(20px)' }}
          >
            <div style={{ width: '100%', maxWidth: '450px', height: '100%', maxHeight: '800px', position: 'relative', overflow: 'hidden', borderRadius: '24px', border: '1px solid rgba(0,245,255,0.2)', boxShadow: '0 0 50px rgba(0,245,255,0.1)' }}>
              {/* Progress Bars */}
              <div style={{ position: 'absolute', top: '16px', left: '16px', right: '16px', display: 'flex', gap: '4px', zIndex: 10 }}>
                {stories.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: i < activeStoryIdx ? '100%' : (i === activeStoryIdx ? `${storyProgress}%` : '0%'), 
                      height: '100%', 
                      background: 'var(--primary-color)',
                      boxShadow: '0 0 8px var(--primary-color)'
                    }} />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div style={{ position: 'absolute', top: '32px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={stories[activeStoryIdx].user?.avatar} alt="" style={{ width: '36px', height: '36px', borderRadius: '12px', border: '1px solid rgba(0,245,255,0.4)' }} />
                  <span style={{ fontWeight: '800', color: 'white', fontSize: '0.9rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{stories[activeStoryIdx].user?.username}</span>
                </div>
                <button onClick={() => setActiveStoryIdx(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}>
                   <X size={20} />
                </button>
              </div>

              <img src={stories[activeStoryIdx].imageUrl} alt="story" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

              {/* Navigation overlays */}
              <div onClick={() => activeStoryIdx > 0 && setActiveStoryIdx(activeStoryIdx - 1)} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', cursor: 'pointer', zIndex: 5 }} />
              <div onClick={() => activeStoryIdx < stories.length - 1 ? setActiveStoryIdx(activeStoryIdx + 1) : setActiveStoryIdx(null)} style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%', cursor: 'pointer', zIndex: 5 }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


