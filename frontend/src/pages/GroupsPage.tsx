import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Search, Send, ArrowLeft, LogIn, X, Image as ImageIcon, Heart, MessageCircle } from 'lucide-react';
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

  if (selected) {
    const isMember = groups.some(g => g.id === selected.id) || (selected.members || []).some(m => m.userId === user?.id);

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
        {/* Header Cover */}
        <div className="glass-panel" style={{ position: 'relative', height: '220px', borderRadius: '24px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.9))', zIndex: 1 }} />
          <img src={selected.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${selected.name}`} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          
          <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 2, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', backdropFilter: 'blur(5px)' }}><ArrowLeft size={20} /></button>
          
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg)', padding: '4px', border: '2px solid var(--primary)', boxShadow: 'var(--glow)' }}>
                <img src={selected.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${selected.name}`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', color: 'white', textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>{selected.name}</h1>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', marginTop: '6px', fontWeight: 'bold' }}>{selected.members?.length || 0} участников</div>
              </div>
            </div>
            {!isMember ? (
              <button 
                onClick={() => joinGroup(selected)}
                style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: 'var(--primary)', color: 'black', fontWeight: '900', cursor: 'pointer', boxShadow: 'var(--glow)' }}>
                Подписаться
              </button>
            ) : (
              <button 
                onClick={() => leaveGroup(selected)}
                style={{ padding: '10px 24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: '800', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
                Вы подписаны
              </button>
            )}
          </div>
        </div>

        {/* Description Banner */}
        {selected.description && (
          <div className="glass-panel" style={{ padding: '20px', fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            {selected.description}
          </div>
        )}

        {/* Wall Posting Area */}
        {isMember && (
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <img src={user?.avatar} alt="avatar" style={{ width: '44px', height: '44px', borderRadius: '14px', border: '1px solid var(--primary)' }} />
              <textarea
                className="input-field"
                placeholder="Что нового в сообществе?"
                style={{ flex: 1, minHeight: '80px', resize: 'none', background: 'rgba(255,255,255,0.02)', fontSize: '1.05rem' }}
                value={postContent}
                onChange={e => setPostContent(e.target.value)}
              />
            </div>
            
            {attachedMedia && (
              <div style={{ position: 'relative', width: 'fit-content', marginLeft: '60px' }}>
                {attachedMedia.type === 'video' ? <video src={attachedMedia.url} style={{ maxHeight: '150px', borderRadius: '10px' }} muted autoPlay loop /> : <img src={attachedMedia.url} style={{ maxHeight: '150px', borderRadius: '10px' }} />}
                <button onClick={() => setAttachedMedia(null)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: 'white', padding: '4px', cursor: 'pointer' }}><X size={14} /></button>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
               <input type="file" ref={fileRef} hidden onChange={handleFileChange} accept="image/*,video/*" />
               <button onClick={() => fileRef.current?.click()} disabled={isUploading} style={{ background: 'none', border: 'none', color: isUploading ? 'gray' : 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                 <ImageIcon size={20} /> {isUploading ? 'Загрузка...' : 'Медиа'}
               </button>
               <button onClick={handlePost} disabled={isPosting || isUploading} className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.95rem' }}>
                 {isPosting ? 'Публикация...' : <><Send size={16} /> Опубликовать</>}
               </button>
            </div>
          </div>
        )}

        {/* Group Posts (Wall) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {groupPosts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              В этом сообществе пока нет записей
            </div>
          ) : groupPosts.map((post) => (
             <div key={post.id} className="glass-panel" style={{ padding: '24px', border: '1px solid var(--border)' }}>
               <div style={{ display: 'flex', gap: '14px', marginBottom: '16px', alignItems: 'center' }}>
                 <img src={post.user?.avatar} style={{ width:'46px',height:'46px', borderRadius:'14px', border: '1px solid rgba(255,255,255,0.1)' }} />
                 <div>
                   <div style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '1.1rem' }}>{post.user?.username}</div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{new Date(post.createdAt).toLocaleString()}</div>
                 </div>
               </div>
               
               <div style={{ marginBottom: '20px', lineHeight: '1.6', color: '#e2e8f0', fontSize: '1.05rem', wordBreak: 'break-word' }}>{post.content}</div>
               
               {post.imageUrl && <div style={{ marginBottom: '20px', borderRadius: '16px', overflow: 'hidden' }}><img src={post.imageUrl} style={{ width: '100%', maxHeight: '450px', objectFit: 'contain', background: 'rgba(0,0,0,0.3)' }} /></div>}
               {post.videoUrl && <div style={{ marginBottom: '20px', borderRadius: '16px', overflow: 'hidden' }}><video src={post.videoUrl} controls style={{ width: '100%', maxHeight: '450px', background: 'rgba(0,0,0,0.3)' }} /></div>}
               
               <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                 <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleLike(post.id)} style={{ background:'none', border:'none', color: post.liked ? '#ff3060' : 'var(--text-secondary)', cursor:'pointer', fontWeight:'800', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                    <Heart size={22} fill={post.liked ? '#ff3060' : 'none'} /> {post.likesCount > 0 ? post.likesCount : 'Нравится'}
                 </motion.button>
                 <motion.button whileTap={{ scale: 0.9 }} onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)} style={{ background:'none', border:'none', color: activeCommentPostId === post.id ? 'var(--primary)' : 'var(--text-secondary)', cursor:'pointer', fontWeight:'800', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                    <MessageCircle size={22} /> {post.comments?.length > 0 ? post.comments.length : 'Комментарии'}
                 </motion.button>
               </div>
               
               <AnimatePresence>
                 {activeCommentPostId === post.id && (
                   <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
                     {(post.comments || []).map((c: any) => (
                       <div key={c.id} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                         <img src={c.user?.avatar} alt="avatar" style={{ width: '32px', height: '32px', borderRadius: '10px' }} />
                         <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '12px', flex: 1 }}>
                           <div style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '4px' }}>{c.user?.username}</div>
                           <div style={{ fontSize: '0.95rem', color: '#cbd5e1' }}>{c.content}</div>
                         </div>
                       </div>
                     ))}
                     <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                       <input type="text" className="input-field" placeholder="Написать комментарий..." value={commentText} onChange={e=>setCommentText(e.target.value)} onKeyDown={e=>e.key==='Enter' && handleComment(post.id)} style={{ flex: 1 }} />
                       <button onClick={() => handleComment(post.id)} className="btn-primary" style={{ padding: '0 20px', fontWeight: '800' }}>Отправить</button>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ color: 'var(--primary)', fontWeight: '900', fontSize: '1.6rem', textShadow: 'var(--glow)' }}>Сообщества</h2>
        <button onClick={() => setShowCreate(true)} style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary), transparent 85%), color-mix(in srgb, var(--secondary), transparent 85%))', border: '1px solid var(--border-bright)', borderRadius: '12px', padding: '10px 18px', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', boxShadow: 'var(--glow)' }}>
          <Plus size={18} /> Создать
        </button>
      </div>

      {showCreate && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px', position: 'relative', border: '1px solid var(--border-bright)', boxShadow: 'var(--glow)' }}>
          <button onClick={() => setShowCreate(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}><X size={20} /></button>
          <div style={{ fontWeight: '900', color: 'var(--primary)', marginBottom: '16px', fontSize: '1.2rem', textShadow: 'var(--glow)' }}>Новое сообщество</div>
          <input className="input-field" placeholder="Название сообщества" value={newName} onChange={e => setNewName(e.target.value)} style={{ marginBottom: '14px', width: '100%', fontSize: '1.05rem' }} />
          <textarea className="input-field" placeholder="Описание (о чём будет сообщество?)" value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ marginBottom: '20px', width: '100%', minHeight: '80px', resize: 'none' }} />
          <button onClick={createGroup} style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary), transparent 80%), color-mix(in srgb, var(--secondary), transparent 80%))', border: '1px solid var(--border-bright)', borderRadius: '12px', padding: '12px 24px', cursor: 'pointer', color: 'var(--primary)', fontWeight: '900', fontSize: '1.05rem', boxShadow: 'var(--glow)' }}>Создать</button>
        </div>
      )}

      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input className="input-field" placeholder="Поиск сообществ..." value={search} onChange={e => doSearch(e.target.value)} style={{ paddingLeft: '46px', width: '100%', height: '54px', fontSize: '1.05rem' }} />
      </div>

      {searchResults.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '800' }}>Результаты поиска</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {searchResults.map(g => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary), transparent 85%), color-mix(in srgb, var(--secondary), transparent 85%))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                  <img src={g.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${g.name}`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setSelected(g)}>
                  <div style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '1.1rem' }}>{g.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{g.description || 'Нет описания'} · {(g.members || []).length} участников</div>
                </div>
                <button onClick={() => joinGroup(g)} style={{ background: 'color-mix(in srgb, var(--primary), transparent 90%)', border: '1px solid color-mix(in srgb, var(--primary), transparent 60%)', borderRadius: '10px', padding: '8px 16px', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '800' }}><LogIn size={16} /> Подписаться</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ margin: '10px 0', fontSize: '1.2rem', color: 'white' }}>Ваши подписки</h3>
        {groups.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <div style={{ fontSize: '1.1rem' }}>Вы пока не состоите в сообществах</div>
          </div>
        ) : groups.map(g => (
          <motion.div key={g.id} whileHover={{ scale: 1.01 }} className="glass-panel" onClick={() => setSelected(g)} style={{ padding: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--border)' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary), transparent 85%), color-mix(in srgb, var(--secondary), transparent 85%))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-bright)', boxShadow: 'var(--glow)' }}>
              <img src={g.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${g.name}`} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '900', color: 'var(--primary)', fontSize: '1.2rem', textShadow: 'var(--glow)' }}>{g.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{g.members?.length || 0} участников · {g.description || 'Нет описания'}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};