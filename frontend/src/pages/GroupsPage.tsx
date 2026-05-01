import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Search, ArrowLeft, X, Image as ImageIcon, Heart, MessageCircle, Settings, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Group { id: number; name: string; description: string; avatar: string; ownerId: number; members: any[]; }
interface Post { id: number; userId: number; user: any; content: string; imageUrl?: string; videoUrl?: string; mediaType?: string; likesCount: number; liked: boolean; comments: any[]; createdAt: string; }

export const GroupsPage = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selected, setSelected] = useState<Group | null>(null);
  const [groupPosts, setGroupPosts] = useState<Post[]>([]);
  
  const [postContent, setPostContent] = useState('');
  const [attachedMedia, setAttachedMedia] = useState<{ url: string, type: 'image' | 'video' } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const [activeCommentPostId, setActiveCommentPostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Group[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchGroups = async () => {
    try { const r = await api.get('/groups'); setGroups(r.data || []); } catch { setGroups([]); }
  };

  useEffect(() => { fetchGroups(); }, []);

  useEffect(() => {
    if (!selected) return;
    api.get(`/groups/${selected.id}/posts`).then(r => setGroupPosts(r.data || []));
  }, [selected]);

  const doSearch = async (q: string) => {
    setSearch(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const r = await api.get(`/groups/search?q=${q}`);
    setSearchResults(r.data || []);
  };

  const createGroup = async () => {
    if (!newName.trim()) return;
    await api.post('/groups', { name: newName, description: newDesc });
    setShowCreate(false); setNewName(''); setNewDesc('');
    fetchGroups();
  };

  const joinGroup = async (g: Group) => {
    await api.post(`/groups/${g.id}/join`);
    setSearch(''); setSearchResults([]);
    fetchGroups();
    if (selected && selected.id === g.id) {
       setSelected({ ...selected, members: [...(selected.members || []), { userId: user?.id }] });
    }
  };

  const leaveGroup = async (g: Group) => {
    await api.post(`/groups/${g.id}/leave`);
    fetchGroups();
    if (selected && selected.id === g.id) {
       setSelected({ ...selected, members: (selected.members || []).filter(m => m.userId !== user?.id) });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    const fd = new FormData();
    fd.append('file', file);
    setIsUploading(true);
    try {
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAttachedMedia({ url: res.data.url, type: isVideo ? 'video' : 'image' });
    } catch { console.error('Upload failed'); } finally { setIsUploading(false); }
  };

  const handlePost = async () => {
    if ((!postContent.trim() && !attachedMedia) || !selected) return;
    setIsPosting(true);
    try {
      const res = await api.post(`/groups/${selected.id}/posts`, {
        content: postContent,
        imageUrl: attachedMedia?.type === 'image' ? attachedMedia.url : '',
        videoUrl: attachedMedia?.type === 'video' ? attachedMedia.url : '',
        mediaType: attachedMedia?.type || 'text'
      });
      setGroupPosts([res.data, ...groupPosts]);
      setPostContent('');
      setAttachedMedia(null);
    } catch { console.error('Failed to post'); } finally { setIsPosting(false); }
  };

  const handleLike = async (postId: number) => {
    try {
      await api.post(`/posts/${postId}/like`);
      setGroupPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: !p.liked, likesCount: p.likesCount + (p.liked ? -1 : 1) } : p));
    } catch { console.error('Failed to like'); }
  };

  const handleComment = async (postId: number) => {
    if (!commentText.trim()) return;
    try {
      const res = await api.post(`/posts/${postId}/comments`, { content: commentText });
      setGroupPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...(p.comments || []), res.data] } : p));
      setCommentText('');
    } catch { console.error('Failed to comment'); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setIsUploadingAvatar(true);
    try {
      const res = await api.post('/upload', fd);
      setEditAvatar(res.data.url);
    } catch {
      console.error('Avatar upload failed');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const saveGroupSettings = async () => {
    if (!selected) return;
    try {
      const res = await api.put(`/groups/${selected.id}`, { name: editName, description: editDesc, avatar: editAvatar });
      setSelected({ ...selected, name: res.data.name, description: res.data.description, avatar: res.data.avatar });
      setGroups(prev => prev.map(g => g.id === selected.id ? { ...g, name: res.data.name, description: res.data.description, avatar: res.data.avatar } : g));
      setShowSettings(false);
    } catch {
      console.error('Failed to update group setting');
    }
  };

  if (selected) {
    const isMember = groups.some(g => g.id === selected.id) || (selected.members || []).some(m => m.userId === user?.id);
    const isOwner = selected.ownerId === user?.id;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '20px', paddingBottom: '40px' }}>
        {/* Header Cover */}
        {/* Header Cover */}
        <div className="glass-panel" style={{ position: 'relative', height: isMobile ? '200px' : '280px', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.95))', zIndex: 1 }} />
          <img src={selected.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${selected.name}`} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          
          <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: isMobile ? '12px' : '20px', left: isMobile ? '12px' : '20px', zIndex: 3, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', backdropFilter: 'blur(10px)' }}><ArrowLeft size={20} /></button>
          
          <div style={{ position: 'absolute', bottom: isMobile ? '12px' : '24px', left: isMobile ? '12px' : '24px', right: isMobile ? '12px' : '24px', zIndex: 2, display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-end', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '20px', width: '100%' }}>
              <div style={{ width: isMobile ? '64px' : '90px', height: isMobile ? '64px' : '90px', borderRadius: '20px', background: 'var(--bg)', padding: '3px', border: '2px solid var(--primary)', boxShadow: 'var(--glow)', flexShrink: 0 }}>
                <img src={selected.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${selected.name}`} style={{ width: '100%', height: '100%', borderRadius: '18px', objectFit: 'cover' }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h1 style={{ margin: 0, fontSize: isMobile ? '1.3rem' : '2.2rem', fontWeight: '900', color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.name}</h1>
                <div style={{ color: 'var(--primary)', fontSize: '0.8rem', marginTop: '4px', fontWeight: '900', letterSpacing: '1px' }}>{selected.members?.length || 0} УЧАСТНИКОВ</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', width: isMobile ? '100%' : 'auto' }}>
              {!isMember ? (
                <button 
                  onClick={() => joinGroup(selected)}
                  style={{ flex: isMobile ? 1 : 'none', padding: '12px 28px', borderRadius: '14px', border: 'none', background: 'var(--primary)', color: 'black', fontWeight: '900', cursor: 'pointer', fontSize: '0.9rem', boxShadow: 'var(--glow)' }}>
                  Вступить
                </button>
              ) : (
                <button 
                  onClick={() => leaveGroup(selected)}
                  style={{ flex: isMobile ? 1 : 'none', padding: '12px 28px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem', backdropFilter: 'blur(10px)' }}>
                  Выйти
                </button>
              )}
              {isOwner && isMobile && (
                 <button 
                   onClick={() => setShowSettings(true)}
                   style={{ width: '48px', height: '48px', borderRadius: '14px', border: '1px solid var(--primary)', background: 'rgba(0,0,0,0.5)', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Settings size={22} />
                 </button>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Admin Bar */}
        {isOwner && !isMobile && (
          <div className="glass-panel" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--primary)', background: 'rgba(0, 245, 255, 0.02)' }}>
            <div style={{ color: 'var(--primary)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}><Settings size={18} /> Управление сообществом</div>
            <button 
              onClick={() => {
                setEditName(selected.name);
                setEditDesc(selected.description);
                setEditAvatar(selected.avatar);
                setShowSettings(true);
              }}
              className="btn-primary" style={{ padding: '8px 20px', borderRadius: '10px' }}>Редактировать</button>
          </div>
        )}

        {/* Description Banner */}
        {selected.description && (
          <div className="glass-panel" style={{ padding: isMobile ? '16px' : '24px', fontSize: isMobile ? '0.85rem' : '1.05rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {selected.description}
          </div>
        )}

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '0' : '20px' }}>
              <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="glass-panel" style={{ width: '100%', maxWidth: '540px', height: isMobile ? '100%' : 'auto', padding: isMobile ? '24px 16px' : '40px', position: 'relative', borderRadius: isMobile ? '0' : '28px', overflowY: 'auto' }}>
                <button onClick={() => setShowSettings(false)} style={{ position: 'absolute', top: '24px', right: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={28} /></button>
                <h2 style={{ color: 'white', marginBottom: '32px', fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: '900' }}>Настройки</h2>

                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
                  <img src={editAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${selected.name}`} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', boxShadow: 'var(--glow)' }} />
                  <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
                    <input type="file" ref={avatarFileRef} hidden onChange={handleAvatarUpload} accept="image/*" />
                    <button onClick={() => avatarFileRef.current?.click()} disabled={isUploadingAvatar} style={{ background: 'color-mix(in srgb, var(--primary), transparent 90%)', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '12px 20px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '800' }}>
                      <Upload size={18} /> {isUploadingAvatar ? 'Загрузка...' : 'Загрузить аватар'}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '700' }}>НАЗВАНИЕ</label>
                  <input className="input-field" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ height: '54px' }} />
                </div>
                
                <div style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '700' }}>ОПИСАНИЕ</label>
                  <textarea className="input-field" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} style={{ minHeight: '120px', resize: 'none', padding: '16px' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button onClick={saveGroupSettings} className="btn-primary" style={{ width: '100%', height: '56px', borderRadius: '16px', fontSize: '1rem' }}>Сохранить изменения</button>
                  <button onClick={() => setShowSettings(false)} style={{ width: '100%', height: '56px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '16px', cursor: 'pointer', fontWeight: '700' }}>Отмена</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wall Posting Area */}
        {isMember && (
          <div className="glass-panel" style={{ padding: isMobile ? '16px' : '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: isMobile ? '12px' : '16px' }}>
              <img src={user?.avatar} alt="avatar" style={{ width: isMobile ? '40px' : '50px', height: isMobile ? '40px' : '50px', borderRadius: '14px', border: '1px solid var(--primary)' }} />
              <textarea
                className="input-field"
                placeholder="Расскажите что-нибудь сообществу..."
                style={{ flex: 1, minHeight: isMobile ? '70px' : '100px', resize: 'none', background: 'rgba(255,255,255,0.02)', fontSize: isMobile ? '0.9rem' : '1.1rem' }}
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
              />
            </div>
            
            {attachedMedia && (
              <div style={{ position: 'relative', width: 'fit-content', marginLeft: isMobile ? '52px' : '66px' }}>
                {attachedMedia.type === 'video' ? <video src={attachedMedia.url} style={{ maxHeight: '180px', borderRadius: '14px' }} muted autoPlay loop /> : <img src={attachedMedia.url} style={{ maxHeight: '180px', borderRadius: '14px' }} />}
                <button onClick={() => setAttachedMedia(null)} style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', color: 'white', padding: '6px', cursor: 'pointer' }}><X size={16} /></button>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
               <input type="file" ref={fileRef} hidden onChange={handleFileChange} accept="image/*,video/*" />
               <button onClick={() => fileRef.current?.click()} disabled={isUploading} style={{ background: 'none', border: 'none', color: isUploading ? 'gray' : 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: isMobile ? '0.85rem' : '1rem' }}>
                 <ImageIcon size={20} /> {isUploading ? 'Загрузка...' : 'Медиа'}
               </button>
               <button onClick={handlePost} disabled={isPosting || isUploading} className="btn-primary" style={{ padding: isMobile ? '8px 20px' : '12px 32px', fontSize: isMobile ? '0.85rem' : '1rem', borderRadius: '12px' }}>
                 {isPosting ? 'Ждём...' : 'Пост'}
               </button>
            </div>
          </div>
        )}

        {/* Group Posts (Wall) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
          {groupPosts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Здесь пока пусто. Станьте первым!
            </div>
          ) : groupPosts.map((post) => (
             <div key={post.id} className="glass-panel" style={{ padding: isMobile ? '16px' : '24px', border: '1px solid var(--border)' }}>
               <Link to={`/profile/${post.user?.username}`} style={{ textDecoration: 'none', display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
                 <img src={post.user?.avatar} style={{ width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                 <div style={{ minWidth: 0 }}>
                   <div style={{ fontWeight: '900', color: 'var(--primary)', fontSize: isMobile ? '0.95rem' : '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{post.user?.username}</div>
                   <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{new Date(post.createdAt).toLocaleDateString()}</div>
                 </div>
               </Link>
               
               <div style={{ marginBottom: '16px', lineHeight: '1.6', color: '#f1f5f9', fontSize: isMobile ? '0.95rem' : '1.1rem', wordBreak: 'break-word' }}>{post.content}</div>
               
               {post.imageUrl && <div style={{ marginBottom: '16px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}><img src={post.imageUrl} style={{ width: '100%', maxHeight: '500px', objectFit: 'contain', background: 'rgba(0,0,0,0.2)' }} /></div>}
               {post.videoUrl && <div style={{ marginBottom: '16px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}><video src={post.videoUrl} controls style={{ width: '100%', maxHeight: '500px', background: 'rgba(0,0,0,0.2)' }} /></div>}
               
               <div style={{ display: 'flex', gap: '20px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                 <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleLike(post.id)} style={{ background:'none', border:'none', color: post.liked ? 'var(--accent)' : 'var(--text-secondary)', cursor:'pointer', fontWeight:'800', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                    <Heart size={20} fill={post.liked ? 'var(--accent)' : 'none'} /> {post.likesCount || ''}
                 </motion.button>
                 <motion.button whileTap={{ scale: 0.9 }} onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)} style={{ background:'none', border:'none', color: activeCommentPostId === post.id ? 'var(--primary)' : 'var(--text-secondary)', cursor:'pointer', fontWeight:'800', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                    <MessageCircle size={20} /> {post.comments?.length || ''}
                 </motion.button>
               </div>
               
               <AnimatePresence>
                 {activeCommentPostId === post.id && (
                   <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                     {(post.comments || []).map((c: any) => (
                       <div key={c.id} style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                         <Link to={`/profile/${c.user?.username}`}><img src={c.user?.avatar} alt="avatar" style={{ width: '30px', height: '30px', borderRadius: '8px' }} /></Link>
                         <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '12px', flex: 1 }}>
                           <div style={{ fontWeight: '800', fontSize: '0.8rem', color: 'var(--primary)' }}>{c.user?.username}</div>
                           <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '2px' }}>{c.content}</div>
                         </div>
                       </div>
                     ))}
                     <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                       <input type="text" className="input-field" placeholder="Коммент..." value={commentText} onChange={e=>setCommentText(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleComment(post.id)} style={{ flex: 1, height: '40px', fontSize: '0.85rem' }} />
                       <button onClick={() => handleComment(post.id)} className="btn-primary" style={{ padding: '0 16px', fontWeight: '800', fontSize: '0.8rem', borderRadius: '10px' }}>&gt;</button>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '16px' : '24px' }}>
        <h2 style={{ color: 'var(--primary)', fontWeight: '900', fontSize: isMobile ? '1.4rem' : '2rem', textShadow: 'var(--glow)' }}>Сообщества</h2>
        <button onClick={() => setShowCreate(true)} style={{ background: 'color-mix(in srgb, var(--primary), transparent 90%)', border: '1px solid var(--primary)', borderRadius: '12px', padding: isMobile ? '8px 14px' : '10px 24px', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: isMobile ? '0.8rem' : '1rem' }}>
          <Plus size={18} /> Создать
        </button>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="glass-panel" style={{ padding: isMobile ? '20px' : '30px', marginBottom: '24px', position: 'relative', border: '1px solid var(--primary)', boxShadow: 'var(--glow)' }}>
            <button onClick={() => setShowCreate(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}><X size={24} /></button>
            <div style={{ fontWeight: '900', color: 'white', marginBottom: '20px', fontSize: '1.2rem' }}>Новое сообщество</div>
            <input className="input-field" placeholder="Как назовем?" value={newName} onChange={e => setNewName(e.target.value)} style={{ marginBottom: '14px', width: '100%', height: '54px' }} />
            <textarea className="input-field" placeholder="О чем это будет?" value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ marginBottom: '24px', width: '100%', minHeight: '100px', resize: 'none' }} />
            <button onClick={createGroup} className="btn-primary" style={{ width: isMobile ? '100%' : 'auto', padding: '14px 32px' }}>Создать сейчас</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ position: 'relative', marginBottom: isMobile ? '16px' : '24px' }}>
        <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input className="input-field" placeholder="Поиск сигналов..." value={search} onChange={e => doSearch(e.target.value)} style={{ paddingLeft: '50px', width: '100%', height: isMobile ? '50px' : '60px', fontSize: '1rem' }} />
      </div>

      {searchResults.length > 0 && (
        <div className="glass-panel" style={{ padding: isMobile ? '16px' : '24px', marginBottom: '24px', border: '1px solid var(--primary)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '900' }}>Обнаруженные каналы</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {searchResults.map(g => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <img src={g.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${g.name}`} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setSelected(g)}>
                  <div style={{ fontWeight: '900', color: 'white', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{(g.members || []).length} участников</div>
                </div>
                <button onClick={() => joinGroup(g)} style={{ background: 'var(--primary)', border: 'none', borderRadius: '10px', padding: '8px 12px', cursor: 'pointer', color: 'black', fontWeight: '900', fontSize: '0.8rem' }}>Вступить</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '12px' : '16px' }}>
        <h3 style={{ margin: '8px 0', fontSize: '1.1rem', color: 'var(--text-secondary)', letterSpacing: '1px', fontWeight: '800' }}>МОИ ПОДПИСКИ</h3>
        {groups.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', border: '1px dashed var(--border)' }}>
            <Users size={40} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
            <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Вы еще не подписаны ни на один канал</div>
          </div>
        ) : groups.map(g => (
          <motion.div key={g.id} whileTap={{ scale: 0.98 }} className="glass-panel" onClick={() => setSelected(g)} style={{ padding: isMobile ? '16px' : '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border)' }}>
            <img src={g.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${g.name}`} style={{ width: isMobile ? '50px' : '64px', height: isMobile ? '50px' : '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)', boxShadow: 'var(--glow)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '900', color: 'white', fontSize: isMobile ? '1.05rem' : '1.3rem', textShadow: 'var(--glow)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.members?.length || 0} участников · {g.description || 'Без описания'}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};