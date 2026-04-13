import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, Heart, MessageCircle, Share2, MoreHorizontal, TrendingUp, Trash2, Edit3, Check, X } from 'lucide-react';

export const FeedPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts');
      setPosts(res.data || []);
    } catch {
      setPosts([]);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsPosting(true);
    try {
      const res = await api.post('/posts', { content });
      setPosts([res.data, ...posts]);
      setContent('');
    } catch { console.error('Failed to create post'); }
    finally { setIsPosting(false); }
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

  const handleEditStart = (post: any) => {
    setEditingId(post.id);
    setEditText(post.content);
    setOpenMenu(null);
  };

  const handleEditSave = async (postId: number) => {
    if (!editText.trim()) return;
    try {
      await api.patch(`/posts/${postId}`, { content: editText });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, content: editText } : p));
      setEditingId(null);
    } catch { console.error('Failed to edit'); }
  };

  return (
    <div style={{ display: 'flex', gap: '30px' }}>
      <div className="feed-container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-panel" style={{ padding: '24px', marginBottom: '24px', border: '1px solid rgba(0,242,255,0.2)' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`} alt="avatar"
              style={{ width: '52px', height: '52px', borderRadius: '16px', border: '2px solid var(--primary-color)' }} />
            <textarea className="input-field" placeholder="Что у вас нового?"
              style={{ minHeight: '100px', resize: 'none', background: 'rgba(255,255,255,0.02)', fontSize: '1.1rem' }}
              value={content} onChange={(e) => setContent(e.target.value)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600' }}>
              <ImageIcon size={22} className="neon-text" /> Медиа
            </button>
            <button className="btn-primary" onClick={handlePost} disabled={isPosting}>
              {isPosting ? 'Публикация...' : <><Send size={18} /> Опубликовать</>}
            </button>
          </div>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <AnimatePresence>
            {posts.map((post, index) => {
              const isOwn = user?.username === post.user?.username;
              return (
                <motion.div key={post.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: Math.min(index * 0.05, 0.5) }}
                  className="glass-panel" style={{ padding: '28px', borderLeft: index % 2 === 0 ? '4px solid var(--primary-color)' : '4px solid var(--secondary-color)' }}>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <Link to={`/profile/${post.user?.username}`} style={{ textDecoration: 'none', display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <img src={post.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.user?.username}`} alt="avatar"
                        style={{ width: '54px', height: '54px', borderRadius: '18px', border: '2px solid rgba(255,255,255,0.1)' }} />
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
                            <motion.div initial={{ opacity: 0, scale: 0.9, y: -8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                              className="glass-panel" style={{ position: 'absolute', right: 0, top: '36px', zIndex: 100, minWidth: '160px', padding: '8px', border: '1px solid rgba(0,242,255,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
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
                    <p style={{ marginBottom: '24px', fontSize: '1.15rem', lineHeight: '1.6', color: '#e2e8f0' }}>{post.content}</p>
                  )}

                  <div style={{ display: 'flex', gap: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                    <button onClick={() => handleLike(post.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', fontSize: '0.95rem', color: post.liked ? '#ff3060' : 'var(--text-secondary)' }}>
                      <Heart size={22} fill={post.liked ? '#ff3060' : 'none'} style={{ filter: post.liked ? 'drop-shadow(0 0 6px #ff3060)' : 'none', transition: 'all 0.2s' }} />
                      {post.likesCount > 0 ? post.likesCount : 'Лайк'}
                    </button>
                    <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
                      <MessageCircle size={22} /> Коммент
                    </button>
                    <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700' }}>
                      <Share2 size={22} /> Share
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <div className="widgets-container">
        <div className="glass-panel" style={{ padding: '28px', position: 'sticky', top: '30px', border: '1px solid rgba(189,0,255,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <TrendingUp className="neon-text-purple" size={24} />
            <h3 style={{ fontSize: '1.4rem', fontWeight: '900' }}>Матрица тегов</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {[['#future', 44], ['#cyber', 3859], ['#digital', 3559], ['#sett', 2292], ['#logic', 4492]].map(([tag, count]) => (
              <div key={tag} style={{ cursor: 'pointer' }}>
                <div style={{ color: 'var(--secondary-color)', fontWeight: '800', fontSize: '1.05rem' }}>{tag}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{count} импульсов</div>
              </div>
            ))}
          </div>
          <button className="btn-primary" style={{ width: '100%', marginTop: '24px', background: 'rgba(189,0,255,0.1)', border: '1px solid var(--secondary-color)', color: 'var(--secondary-color)', boxShadow: 'none' }}>
            Показать все
          </button>
        </div>
      </div>
    </div>
  );
};
