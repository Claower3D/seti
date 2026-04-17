import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Volume2, VolumeX, Plus, Play, Zap, Upload, Send, X } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Wave {
  id: number;
  videoUrl: string;
  thumbnailUrl?: string;
  description: string;
  userId: number;
  user: { id: number; username: string; avatar: string };
  likesCount: number;
  commentsCount: number;
  liked: boolean;
  createdAt: string;
}

interface WaveComment {
  id: number;
  content: string;
  userId: number;
  user: { id: number; username: string; avatar: string };
  createdAt: string;
}

const timeAgo = (dateStr: string) => {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч`;
  return `${Math.floor(diff / 86400)} д`;
};

const WavePlayer = ({ wave, isActive, currentUser, isMobile }: { wave: Wave; isActive: boolean; currentUser: any; isMobile: boolean }) => {
  useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const commentsBottomRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(wave.liked);
  const [likesCount, setLikesCount] = useState(wave.likesCount || 0);
  const [showHeart, setShowHeart] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<WaveComment[]>([]);
  const [commentsCount, setCommentsCount] = useState(wave.commentsCount || 0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [following, setFollowing] = useState(false); // Check if they are friends/following
  const [followLoading, setFollowLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const dbTapRef = useRef<number>(0);

  const isOwnWave = currentUser?.id === wave.user?.id;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      v.pause();
      v.currentTime = 0;
      setPlaying(false);
      setShowComment(false);
    }
  }, [isActive]);

  const loadComments = async () => {
    if (loadingComments) return;
    setLoadingComments(true);
    try {
      const res = await api.get(`/waves/${wave.id}/comments`);
      setComments(res.data || []);
    } catch {}
    setLoadingComments(false);
  };

  const toggleComments = () => {
    const next = !showComment;
    setShowComment(next);
    if (next && comments.length === 0) loadComments();
  };

  useEffect(() => {
    if (showComment) {
      setTimeout(() => {
        commentsBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        commentInputRef.current?.focus();
      }, 400);
    }
  }, [showComment, comments.length]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    const now = Date.now();
    if (now - dbTapRef.current < 300) {
      handleLike();
      dbTapRef.current = 0;
      return;
    }
    dbTapRef.current = now;
    setTimeout(() => {
      if (Date.now() - dbTapRef.current >= 280) {
        if (v.paused) { v.play(); setPlaying(true); }
        else { v.pause(); setPlaying(false); }
      }
    }, 310);
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress((v.currentTime / v.duration) * 100);
  };

  const handleLike = async () => {
    try {
      await api.post(`/waves/${wave.id}/like`);
      setLiked(prev => !prev);
      setLikesCount(prev => liked ? prev - 1 : prev + 1);
      if (!liked) {
        setShowHeart(true);
        setTimeout(() => setShowHeart(false), 900);
      }
    } catch {}
  };

  const handleSendComment = async () => {
    if (!comment.trim() || sendingComment) return;
    setSendingComment(true);
    try {
      const res = await api.post(`/waves/${wave.id}/comments`, { content: comment });
      setComments(prev => [...prev, res.data]);
      setCommentsCount(c => c + 1);
      setComment('');
    } catch {}
    setSendingComment(false);
  };

  const toggleFollow = async () => {
    if (isOwnWave || followLoading) return;
    setFollowLoading(true);
    try {
      if (following) {
        await api.delete(`/friends/request/${wave.user.id}`);
        setFollowing(false);
      } else {
        await api.post(`/friends/request/${wave.user.id}`);
        setFollowing(true);
      }
    } catch {}
    setFollowLoading(false);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/waves/${wave.id}`;
    navigator.clipboard.writeText(url).then(() => alert('Ссылка скопирована!')).catch(() => {});
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden' }}>
      {/* Video */}
      <video
        ref={videoRef}
        src={wave.videoUrl}
        loop
        muted={muted}
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onWaiting={() => setVideoLoading(true)}
        onPlaying={() => setVideoLoading(false)}
        onClick={togglePlay}
        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
      />

      {/* Video Loading Spinner */}
      {videoLoading && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10 }}>
          <motion.div 
            animate={{ rotate: 360, scale: [1, 1.2, 1] }} 
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            style={{ width: '50px', height: '50px', border: '3px solid rgba(0,245,255,0.1)', borderTopColor: '#00f5ff', borderRadius: '50%', boxShadow: '0 0 20px rgba(0,245,255,0.3)' }} 
          />
        </div>
      )}

      {/* Double-tap heart */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.4, opacity: 0.8 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.7 }}
            style={{ position: 'absolute', top: '50%', left: '50%', transform: `translate(-50%,-50%) scale(${isMobile ? 1.5 : 1})`, pointerEvents: 'none', zIndex: 20 }}
          >
            <Heart size={isMobile ? 120 : 100} fill="#ff3060" color="#ff3060" style={{ filter: 'drop-shadow(0 0 20px #ff3060)' }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play/pause overlay */}
      <AnimatePresence>
        {!playing && isActive && !videoLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            style={{ 
              position: 'absolute', 
              top: '50%', 
              left: '50%', 
              x: '-50%', 
              y: '-50%', 
              pointerEvents: 'none', 
              zIndex: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div style={{ 
              background: 'rgba(0,0,0,0.3)', 
              borderRadius: '50%', 
              width: isMobile ? '80px' : '70px',
              height: isMobile ? '80px' : '70px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)', 
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 0 40px rgba(0,0,0,0.4)'
            }}>
              <Play size={isMobile ? 40 : 35} color="white" fill="white" style={{ marginLeft: '4px' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gradients */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '20%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)', pointerEvents: 'none' }} />

      <div style={{ 
        position: 'absolute', 
        bottom: '0', 
        left: '0', 
        right: '0', 
        height: '4px', 
        background: 'rgba(255,255,255,0.08)', 
        zIndex: 100,
        overflow: 'hidden',
        backdropFilter: 'blur(4px)'
      }}>
        <motion.div 
          style={{ 
            height: '100%', 
            width: `${progress}%`, 
            background: 'linear-gradient(90deg, var(--primary), var(--secondary), var(--primary))',
            backgroundSize: '200% 100%',
            boxShadow: 'var(--glow-strong)',
          }}
          animate={{ backgroundPosition: ['0% center', '200% center'] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
        />
      </div>

      {/* User info */}
      <div style={{ position: 'absolute', bottom: isMobile ? '80px' : '80px', left: '16px', right: isMobile ? '80px' : '80px', zIndex: 15 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <img src={wave.user?.avatar} alt="" style={{ width: isMobile ? '48px' : '42px', height: isMobile ? '48px' : '42px', borderRadius: '50%', border: '2px solid var(--border-bright)', boxShadow: 'var(--glow)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <div style={{ fontWeight: '900', color: 'var(--primary)', fontSize: isMobile ? '1.1rem' : '1.05rem', textShadow: 'var(--glow-strong)' }}>@{wave.user?.username}</div>
              {!isOwnWave && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleFollow}
                  disabled={followLoading}
                  style={{
                    background: following ? 'rgba(255,255,255,0.1)' : 'color-mix(in srgb, var(--primary), transparent 85%)',
                    border: following ? '1px solid rgba(255,255,255,0.2)' : '1px solid color-mix(in srgb, var(--primary), transparent 60%)',
                    borderRadius: '8px',
                    padding: isMobile ? '2px 10px' : '2px 8px',
                    cursor: 'pointer',
                    color: following ? 'rgba(255,255,255,0.6)' : 'var(--primary)',
                    fontWeight: '800',
                    fontSize: '0.65rem',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {followLoading ? '...' : (following ? '✓ Читаю' : 'Подписаться')}
                </motion.button>
              )}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: '3px' }}><Zap size={10} color="var(--primary)" />Signal Wave</div>
          </div>
        </div>
        {wave.description && (
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: isMobile ? '0.95rem' : '0.9rem', lineHeight: '1.5', margin: 0, fontWeight: '500', textShadow: '0 1px 4px rgba(0,0,0,0.8)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
            {wave.description}
          </p>
        )}
      </div>

      <div style={{ position: 'absolute', right: '12px', bottom: isMobile ? '110px' : '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? '16px' : '28px', zIndex: 15 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <motion.button whileTap={{ scale: 0.8 }} onClick={handleLike}
            style={{ background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: isMobile ? '46px' : '52px', height: isMobile ? '46px' : '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
            <Heart size={isMobile ? 24 : 26} fill={liked ? '#ff3060' : 'none'} color={liked ? '#ff3060' : 'white'} style={{ filter: liked ? 'drop-shadow(0 0 8px #ff3060)' : 'none', transition: 'all 0.2s' }} />
          </motion.button>
          <span style={{ color: 'white', fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '700', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{likesCount}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <motion.button whileTap={{ scale: 0.8 }} onClick={toggleComments}
            style={{ background: showComment ? 'color-mix(in srgb, var(--primary), transparent 85%)' : 'rgba(0,0,0,0.4)', border: showComment ? '1px solid color-mix(in srgb, var(--primary), transparent 60%)' : 'none', borderRadius: '50%', width: isMobile ? '46px' : '52px', height: isMobile ? '46px' : '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)', position: 'relative' }}>
            <MessageCircle size={isMobile ? 24 : 26} color={showComment ? 'var(--primary)' : 'white'} style={{ filter: showComment ? 'var(--glow)' : 'none', transition: 'all 0.2s' }} />
            {commentsCount > 0 && (
              <div style={{ position: 'absolute', top: '-1px', right: '-1px', background: 'var(--primary)', color: 'black', borderRadius: '50%', width: isMobile ? '16px' : '18px', height: isMobile ? '16px' : '18px', fontSize: isMobile ? '0.6rem' : '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', boxShadow: 'var(--glow)' }}>
                {commentsCount > 99 ? '99+' : commentsCount}
              </div>
            )}
          </motion.button>
          <span style={{ color: 'white', fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '700', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{commentsCount}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <motion.button whileTap={{ scale: 0.8 }} onClick={handleShare}
            style={{ background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: isMobile ? '46px' : '52px', height: isMobile ? '46px' : '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
            <Share2 size={isMobile ? 24 : 26} color="white" />
          </motion.button>
          <span style={{ color: 'white', fontSize: isMobile ? '0.7rem' : '0.75rem', fontWeight: '700', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>Поделиться</span>
        </div>

        <motion.button whileTap={{ scale: 0.8 }} onClick={() => setMuted(m => !m)}
          style={{ background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: isMobile ? '46px' : '52px', height: isMobile ? '46px' : '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
          {muted ? <VolumeX size={isMobile ? 24 : 26} color="white" /> : <Volume2 size={isMobile ? 24 : 26} color="var(--primary)" style={{ filter: 'var(--glow)' }} />}
        </motion.button>
      </div>

      {/* Comment drawer */}
      <AnimatePresence>
        {showComment && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: isMobile ? '80%' : '72%', background: 'rgba(8,10,20,0.97)', backdropFilter: 'blur(40px)', borderRadius: '24px 24px 0 0', border: '1px solid rgba(0,245,255,0.1)', display: 'flex', flexDirection: 'column', zIndex: 30 }}
          >
            {/* Header */}
            <div style={{ padding: '16px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <div>
                <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', marginBottom: '12px' }} />
                <div style={{ fontWeight: '900', color: 'white', fontSize: '1rem' }}>
                  Комментарии <span style={{ color: 'var(--primary)', textShadow: 'var(--glow)' }}>({commentsCount})</span>
                </div>
              </div>
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowComment(false)}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </motion.button>
            </div>

            {/* Comments list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {loadingComments ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    style={{ width: '28px', height: '28px', border: '2px solid transparent', borderTopColor: 'var(--primary)', borderRadius: '50%', boxShadow: 'var(--glow)' }} />
                </div>
              ) : comments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                  <MessageCircle size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <div style={{ fontSize: '0.9rem' }}>Будь первым, кто оставит комментарий</div>
                </div>
              ) : comments.map(c => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', gap: isMobile ? '10px' : '12px', alignItems: 'flex-start' }}>
                  <img src={c.user?.avatar} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--border)', flexShrink: 0 }} />
                  <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '10px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--primary)', textShadow: 'var(--glow)' }}>@{c.user?.username}</span>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>{timeAgo(c.createdAt)}</span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>{c.content}</p>
                  </div>
                </motion.div>
              ))}
              <div ref={commentsBottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
              <img src={currentUser?.avatar} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(0,245,255,0.25)', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,245,255,0.15)', borderRadius: '25px', padding: '4px 4px 4px 16px' }}>
                <input
                  ref={commentInputRef}
                  type="text"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendComment()}
                  placeholder="Написать комментарий..."
                  style={{ flex: 1, background: 'none', border: 'none', color: 'white', fontSize: '0.9rem', outline: 'none' }}
                />
                <motion.button whileTap={{ scale: 0.9 }} onClick={handleSendComment} disabled={!comment.trim() || sendingComment}
                  style={{ background: comment.trim() ? 'linear-gradient(135deg, rgba(0,245,255,0.3), rgba(180,0,255,0.3))' : 'rgba(255,255,255,0.05)', border: comment.trim() ? '1px solid rgba(0,245,255,0.4)' : '1px solid transparent', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: comment.trim() ? 'pointer' : 'default', flexShrink: 0, transition: 'all 0.2s', boxShadow: comment.trim() ? '0 0 12px rgba(0,245,255,0.2)' : 'none' }}>
                  {sendingComment
                    ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '16px', height: '16px', border: '2px solid transparent', borderTopColor: '#00f5ff', borderRadius: '50%' }} />
                    : <Send size={16} color={comment.trim() ? '#00f5ff' : 'rgba(255,255,255,0.3)'} />
                  }
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const WavesPage = () => {
  const { user } = useAuth();
  const [waves, setWaves] = useState<Wave[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const videoUploadRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    
    const handleTriggerUpload = () => {
      videoUploadRef.current?.click();
    };
    window.addEventListener('trigger-wave-upload', handleTriggerUpload);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('trigger-wave-upload', handleTriggerUpload);
    };
  }, []);

  const fetchWaves = async () => {
    setLoading(true);
    try {
      const res = await api.get('/waves');
      setWaves(res.data || []);
    } catch {
      setWaves([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchWaves(); }, []);

  useEffect(() => {
    if (!waves.length) return;
    const observers: IntersectionObserver[] = [];
    itemRefs.current.forEach((el, idx) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveIdx(idx); },
        { threshold: 0.6 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [waves]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setShowUpload(true);
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', pendingFile);
      const uploadRes = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await api.post('/waves', { videoUrl: uploadRes.data.url, description: newDesc });
      setShowUpload(false);
      setNewDesc('');
      setPendingFile(null);
      fetchWaves();
    } catch {
      alert('Ошибка при загрузке');
    }
    setUploading(false);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '16px' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{ width: '40px', height: '40px', border: '3px solid transparent', borderTopColor: '#00f5ff', borderRadius: '50%', boxShadow: '0 0 20px rgba(0,245,255,0.5)' }} />
      <span style={{ color: '#00f5ff', fontWeight: '700', textShadow: '0 0 10px rgba(0,245,255,0.6)' }}>Ловим сигналы...</span>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'relative', height: isMobile ? '100%' : 'calc(100vh - 100px)', overflow: 'hidden', touchAction: 'none' }}>
      {/* Upload button - Only on desktop since mobile has it in the nav bar */}
      {!isMobile && (
        <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 100 }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => videoUploadRef.current?.click()}
            style={{ 
              background: 'linear-gradient(135deg, rgba(0,245,255,0.3), rgba(180,0,255,0.3))', 
              border: '1px solid rgba(0,245,255,0.5)', 
              borderRadius: '14px', 
              padding: '10px 16px', 
              cursor: 'pointer', 
              color: '#00f5ff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '8px', 
              fontWeight: '700', 
              backdropFilter: 'blur(20px)', 
              boxShadow: '0 0 30px rgba(0,245,255,0.25)', 
              fontSize: '0.85rem' 
            }}>
            <Plus size={18} /> 
            Запустить волну
          </motion.button>
        </div>
      )}
      <input ref={videoUploadRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleFileSelect} />

      {waves.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'rgba(0,245,255,0.05)', border: '2px dashed rgba(0,245,255,0.3)', borderRadius: '24px', padding: '60px 40px', textAlign: 'center' }}>
            <Zap size={60} color="rgba(0,245,255,0.3)" style={{ margin: '0 auto 16px' }} />
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>Эфир пуст</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>Запусти первую волну в SETI</div>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => videoUploadRef.current?.click()}
              style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.3), rgba(180,0,255,0.3))', border: '1px solid rgba(0,245,255,0.4)', borderRadius: '14px', padding: '12px 24px', cursor: 'pointer', color: '#00f5ff', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '800', margin: '0 auto', boxShadow: '0 0 20px rgba(0,245,255,0.2)', fontSize: '0.95rem' }}>
              <Upload size={20} /> Загрузить видео
            </motion.button>
          </div>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          style={{
            height: '100%',
            overflowY: 'scroll',
            scrollSnapType: 'y mandatory',
            scrollBehavior: 'smooth',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            touchAction: 'pan-y'
          }}
          className="hide-scrollbar"
        >
          {waves.map((wave, idx) => (
            <div
              key={wave.id}
              ref={el => { itemRefs.current[idx] = el; }}
              style={{
                flexShrink: 0,
                width: '100%',
                maxWidth: isMobile ? '100%' : '480px',
                height: isMobile ? '100%' : '100%',
                scrollSnapAlign: 'start',
                position: 'relative',
                borderRadius: isMobile ? '0' : '24px',
                overflow: 'hidden',
                border: isMobile ? 'none' : '1px solid rgba(0,245,255,0.08)',
                boxShadow: isMobile ? 'none' : '0 0 60px rgba(0,245,255,0.05), 0 30px 80px rgba(0,0,0,0.5)',
              }}
            >
              <WavePlayer wave={wave} isActive={idx === activeIdx} currentUser={user} isMobile={isMobile} />
            </div>
          ))}
        </div>
      )}

      {/* Upload modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              style={{ background: 'rgba(10,12,20,0.98)', border: '1px solid rgba(0,245,255,0.25)', borderRadius: '28px', padding: isMobile ? '24px' : '32px', width: '100%', maxWidth: '440px', boxShadow: '0 0 60px rgba(0,0,0,0.9), 0 0 30px rgba(0,245,255,0.1)' }}>
              <div style={{ fontWeight: '900', fontSize: '1.3rem', background: 'linear-gradient(135deg, #00f5ff, #b400ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
                Запустить волну
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                📡 {pendingFile?.name}
              </div>
              <textarea placeholder="Описание волны... (необязательно)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,245,255,0.2)', borderRadius: '16px', padding: '14px 18px', color: 'white', fontSize: '0.9rem', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '20px' }} />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => { setShowUpload(false); setPendingFile(null); setNewDesc(''); }}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '13px', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: '700', fontSize: '0.9rem' }}>
                  Отмена
                </button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleUpload} disabled={uploading}
                  style={{ flex: 2, background: uploading ? 'rgba(0,245,255,0.05)' : 'linear-gradient(135deg, rgba(0,245,255,0.25), rgba(180,0,255,0.25))', border: '1px solid rgba(0,245,255,0.4)', borderRadius: '14px', padding: '13px', cursor: uploading ? 'wait' : 'pointer', color: '#00f5ff', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '0.95rem', boxShadow: '0 0 20px rgba(0,245,255,0.1)' }}>
                  {uploading ? (<><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ width: '18px', height: '18px', border: '2px solid transparent', borderTopColor: '#00f5ff', borderRadius: '50%' }} /> Передача...</>) : (<><Zap size={18} /> В эфир</>)}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
