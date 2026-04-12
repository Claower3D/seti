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
          style={{ padding: '24px', marginBottom: '24px' }}
        >
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <img src={user?.avatar} alt="avatar" style={{ width: '45px', height: '45px', borderRadius: '12px' }} />
            <textarea 
              className="input-field" 
              placeholder="Что у вас нового?"
              style={{ minHeight: '80px', resize: 'none' }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                <ImageIcon size={20} /> Фото/Видео
              </button>
            </div>
            <button className="btn-primary" onClick={handlePost} disabled={isPosting}>
              {isPosting ? 'Публикация...' : <><Send size={18} /> Опубликовать</>}
            </button>
          </div>
        </motion.div>

        {/* Posts List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {posts.map((post, index) => (
            <motion.div 
              key={post.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel" 
              style={{ padding: '24px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <img src={post.user?.avatar} alt="avatar" style={{ width: '50px', height: '50px', borderRadius: '14px' }} />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{post.user?.username}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {new Date(post.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <MoreHorizontal style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} />
              </div>
              <p style={{ marginBottom: '20px', fontSize: '1.05rem', lineHeight: '1.6' }}>{post.content}</p>
              
              <div style={{ display: 'flex', gap: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                  <Heart size={22} /> Лайк
                </button>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                  <MessageCircle size={22} /> Коммент
                </button>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                  <Share2 size={22} /> Поделиться
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="widgets-container">
        <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <TrendingUp color="var(--primary-color)" size={20} />
            <h3 style={{ fontSize: '1.2rem' }}>Актуальное</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {['#development', '#railway', '#go', '#react', '#design'].map(tag => (
              <div key={tag} style={{ cursor: 'pointer' }}>
                <div style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{tag}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{Math.floor(Math.random() * 1000)} постов</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
