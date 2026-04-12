import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { motion } from 'framer-motion';
import { Send, Image as ImageIcon, Heart, MessageCircle, Share2, MoreHorizontal, TrendingUp } from 'lucide-react';

export const FeedPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts');
      setPosts(res.data || []);
    } catch (err) {
      console.error('Failed to fetch posts');
      setPosts([]);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsPosting(true);
    try {
      const res = await api.post('/posts', { content });
      setPosts([res.data, ...posts]);
      setContent('');
    } catch (err) {
      console.error('Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '30px' }}>
      <div className="feed-container">
        {/* Create Post */}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
            <div style={{ display: 'flex', gap: '24px' }}>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', transition: 'var(--transition)' }}>
                <ImageIcon size={22} className="neon-text" /> <span>Медиа</span>
              </button>
            </div>
            <button className="btn-primary" onClick={handlePost} disabled={isPosting}>
              {isPosting ? 'Цифровизация...' : <><Send size={18} /> Опубликовать</>}
            </button>
          </div>
        </motion.div>

        {/* Posts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {posts.map((post, index) => (
            <motion.div 
              key={post.id} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(index * 0.05, 0.5) }}
              className="glass-panel" 
              style={{ padding: '28px', borderLeft: index % 2 === 0 ? '4px solid var(--primary-color)' : '4px solid var(--secondary-color)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <img src={post.user?.avatar} alt="avatar" style={{ width: '54px', height: '54px', borderRadius: '18px', border: '2px solid rgba(255,255,255,0.1)' }} />
                  <div>
                    <div style={{ fontWeight: '900', fontSize: '1.2rem', color: 'white' }}>{post.user?.username}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-color)', boxShadow: '0 0 5px var(--primary-color)' }}></div>
                      {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • SETI Network
                    </div>
                  </div>
                </div>
                <MoreHorizontal style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} />
              </div>
              <p style={{ marginBottom: '24px', fontSize: '1.15rem', lineHeight: '1.6', color: '#e2e8f0', letterSpacing: '0.2px' }}>{post.content}</p>
              
              <div style={{ display: 'flex', gap: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', transition: 'var(--transition)' }} className="post-action-btn">
                  <Heart size={24} /> <span>Лайк</span>
                </button>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', transition: 'var(--transition)' }} className="post-action-btn">
                  <MessageCircle size={24} /> <span>Коммент</span>
                </button>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '700', transition: 'var(--transition)' }} className="post-action-btn">
                  <Share2 size={24} /> <span>Share</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="widgets-container">
        <div className="glass-panel" style={{ padding: '28px', position: 'sticky', top: '30px', border: '1px solid rgba(189, 0, 255, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <TrendingUp className="neon-text-purple" size={24} />
            <h3 style={{ fontSize: '1.4rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Матрица тегов</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {['#future', '#cyber', '#digital', '#sett', '#logic'].map(tag => (
              <div key={tag} style={{ cursor: 'pointer', group: 'true' }}>
                <div style={{ color: 'var(--secondary-color)', fontWeight: '800', fontSize: '1.05rem', transition: 'var(--transition)' }} className="hover-neon">{tag}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{Math.floor(Math.random() * 5000)} импульсов</div>
              </div>
            ))}
          </div>
          <button className="btn-primary" style={{ width: '100%', marginTop: '24px', background: 'rgba(189, 0, 255, 0.1)', border: '1px solid var(--secondary-color)', color: 'var(--secondary-color)', boxShadow: 'none' }}>
            Показать все
          </button>
        </div>
      </div>
    </div>
  );
};
