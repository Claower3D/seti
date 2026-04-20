import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle } from 'lucide-react';
import api from '../api/client';

interface Comment {
  id: number;
  content: string;
  user: {
    username: string;
    avatar: string;
  };
  createdAt: string;
}

interface Props {
  itemId: number;
  type: 'post' | 'wave';
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: (count: number) => void;
  currentUser: any;
}

const CommentsDrawer: React.FC<Props> = ({ itemId, type, isOpen, onClose, onCommentAdded, currentUser }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const endpoint = type === 'post' ? `/posts/${itemId}/comments` : `/waves/${itemId}/comments`;
      const res = await api.get(endpoint);
      setComments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchComments();
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, itemId]);

  useEffect(() => {
    if (isOpen && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, isOpen]);

  const handleSubmit = async () => {
    if (!commentText.trim() || isSending) return;
    setIsSending(true);
    try {
      const endpoint = type === 'post' ? `/posts/${itemId}/comments` : `/waves/${itemId}/comments`;
      const res = await api.post(endpoint, { content: commentText });
      const newComment = res.data;
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      if (onCommentAdded) onCommentAdded(comments.length + 1);
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setIsSending(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return 'только что';
    if (diff < 3600) return `${Math.floor(diff / 60)} мин`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч`;
    return `${Math.floor(diff / 86400)} д`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(8px)',
              zIndex: 1000
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: '80vh',
              background: 'rgba(10, 12, 18, 0.98)',
              backdropFilter: 'blur(30px)',
              borderTop: '1px solid var(--border-bright)',
              borderRadius: '24px 24px 0 0',
              zIndex: 1001,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Header / Drag Handle */}
            <div style={{
              padding: '12px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
              flexShrink: 0
            }}>
              <div style={{
                width: '40px',
                height: '4px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '2px',
                marginBottom: '16px'
              }} />
              <div style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontWeight: '900',
                  fontSize: '1.1rem',
                  letterSpacing: '1px',
                  color: 'white'
                }}>
                  КОММЕНТАРИИ <span style={{ color: 'var(--primary)', textShadow: 'var(--glow)' }}>({comments.length})</span>
                </span>
                <button
                  onClick={onClose}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Comments List */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }} className="hide-scrollbar">
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    style={{
                      width: '30px',
                      height: '30px',
                      border: '2px solid transparent',
                      borderTopColor: 'var(--primary)',
                      borderRadius: '50%',
                      boxShadow: 'var(--glow)'
                    }}
                  />
                </div>
              ) : comments.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px 20px',
                  opacity: 0.5,
                  textAlign: 'center'
                }}>
                  <MessageCircle size={48} style={{ marginBottom: '16px' }} />
                  <p style={{ fontSize: '0.9rem' }}>Пока нет сигналов... Будьте первым!</p>
                </div>
              ) : (
                comments.map((comment, idx) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    style={{ display: 'flex', gap: '14px' }}
                  >
                    <img
                      src={comment.user.avatar}
                      alt={comment.user.username}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        flexShrink: 0
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '4px'
                      }}>
                        <span style={{
                          fontWeight: '800',
                          fontSize: '0.85rem',
                          color: 'var(--primary)',
                          textShadow: 'var(--glow)'
                        }}>
                          {comment.user.username}
                        </span>
                        <span style={{ fontSize: '0.7rem', opacity: 0.4 }}>
                          {timeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '12px 14px',
                        borderRadius: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        fontSize: '0.95rem',
                        lineHeight: '1.5',
                        color: 'rgba(255, 255, 255, 0.9)',
                        wordBreak: 'break-word'
                      }}>
                        {comment.content}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>

            {/* Input Footer */}
            <div style={{
              padding: '16px 20px 32px',
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              background: 'rgba(10, 12, 18, 0.95)',
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <img
                src={currentUser?.avatar}
                alt="Me"
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  border: '1px solid var(--primary)',
                  boxShadow: 'var(--glow)'
                }}
              />
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '20px',
                padding: '4px 4px 4px 16px',
                transition: 'border-color 0.2s'
              }}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ваш комментарий..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: 'white',
                    fontSize: '0.95rem',
                    padding: '8px 0'
                  }}
                />
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSubmit}
                  disabled={!commentText.trim() || isSending}
                  style={{
                    background: commentText.trim() ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: commentText.trim() ? 'black' : 'rgba(255, 255, 255, 0.2)',
                    cursor: commentText.trim() ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    boxShadow: commentText.trim() ? 'var(--glow)' : 'none'
                  }}
                >
                  <Send size={18} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommentsDrawer;
