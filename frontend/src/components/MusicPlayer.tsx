import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Minimize2, Repeat, Shuffle, X, Music as MusicIcon } from 'lucide-react';
import { useMusic } from '../context/MusicContext';

export const MusicPlayer = () => {
  const { currentSong, isPlaying, togglePlay, currentTime, duration, seek, pauseSong } = useMusic();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Auto-show player if a new song starts playing while hidden
  useEffect(() => {
    if (currentSong && isPlaying) {
      setIsVisible(true);
    }
  }, [currentSong, isPlaying]);

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    pauseSong();
    setIsVisible(false);
  };

  return (
    <>
      {/* Floating Restore Button (Visible only when player is hidden) */}
      <AnimatePresence>
        {!isVisible && (
          <motion.button
            initial={{ scale: 0, y: 100 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 100 }}
            whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(0, 245, 255, 0.4)' }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsVisible(true)}
            style={{
              position: 'fixed',
              bottom: '100px',
              right: '20px',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(0, 245, 255, 0.1)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 245, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1999,
              cursor: 'pointer',
              color: '#00f5ff',
            }}
          >
            <MusicIcon size={24} />
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '1px solid #00f5ff' }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isVisible && (
          <motion.div 
            initial={{ x: '-50%', y: 100, opacity: 0 }}
            animate={{ 
              x: '-50%',
              y: 0, 
              opacity: 1,
              height: isExpanded ? '100%' : '80px',
              bottom: isExpanded ? '0px' : '90px',
              width: isExpanded ? '100%' : 'calc(100% - 32px)',
              borderRadius: isExpanded ? '0px' : '24px',
            }}
            exit={{ x: '-50%', y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ 
              position: 'fixed', 
              left: '50%', 
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(80px) saturate(200%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
              zIndex: 2000,
              boxShadow: '0 20px 80px rgba(0,0,0,0.4)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Compact View Content */}
            {!isExpanded && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '0 20px', height: '100%', position: 'relative' }}>
                <div 
                  onClick={() => setIsExpanded(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0, cursor: 'pointer' }}
                >
                  <div style={{ position: 'relative', width: '50px', height: '50px', flexShrink: 0 }}>
                    <img src={currentSong.imageUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />
                    {isPlaying && (
                      <motion.div 
                        animate={{ scale: [1, 1.1, 1] }} 
                        transition={{ repeat: Infinity, duration: 2 }}
                        style={{ position: 'absolute', inset: '-2px', border: '2px solid #00f5ff', borderRadius: '14px', opacity: 0.5 }}
                      />
                    )}
                  </div>
                  <div style={{ minWidth: '0px' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentSong.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{currentSong.artist}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} style={{ background: 'white', border: 'none', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    {isPlaying ? <Pause size={22} color="black" fill="black" /> : <Play size={22} color="black" fill="black" style={{ marginLeft: '3px' }} />}
                  </button>
                  <button 
                    onClick={handleClose}
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }}
                  >
                    <X size={18} />
                  </button>
                </div>
                
                {/* Minimal progress line */}
                <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '2px', background: 'rgba(255,255,255,0.05)' }}>
                   <motion.div style={{ height: '100%', background: '#00f5ff', width: `${progress}%` }} />
                </div>
              </div>
            )}

            {/* Expanded View Content */}
            {isExpanded && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '40px 30px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px', alignItems: 'center' }}>
                  <Minimize2 size={24} color="white" style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => setIsExpanded(false)} />
                  <div style={{ fontSize: '0.7rem', fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textTransform: 'uppercase' }}>Playing Now</div>
                  <X size={24} color="white" style={{ cursor: 'pointer', opacity: 0.5 }} onClick={handleClose} />
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '40px' }}>
                  <motion.div 
                    animate={{ scale: isPlaying ? 1 : 0.95 }}
                    style={{ width: '100%', maxWidth: '320px', aspectRatio: '1/1', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}
                  >
                    <img src={currentSong.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </motion.div>

                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white', marginBottom: '8px' }}>{currentSong.title}</h2>
                    <p style={{ fontSize: '1.1rem', color: '#00f5ff', fontWeight: '700', opacity: 0.8 }}>{currentSong.artist}</p>
                  </div>

                  <div style={{ width: '100%', maxWidth: '500px' }}>
                    <div 
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        seek((x / rect.width) * duration);
                      }}
                      style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', cursor: 'pointer', position: 'relative', marginBottom: '12px' }}
                    >
                      <motion.div 
                        style={{ height: '100%', background: 'linear-gradient(90deg, #00f5ff, #7b61ff)', borderRadius: '3px', width: `${progress}%` }}
                      />
                      <div style={{ position: 'absolute', top: '50%', left: `${progress}%`, width: '14px', height: '14px', background: 'white', borderRadius: '50%', transform: 'translate(-50%, -50%)', boxShadow: '0 0 10px rgba(0,245,255,0.5)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontWeight: '700' }}>
                      <span>{Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}</span>
                      <span>{Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    <Shuffle size={20} color="white" style={{ opacity: 0.3 }} />
                    <SkipBack size={32} color="white" fill="white" style={{ opacity: 0.8 }} />
                    <button onClick={togglePlay} style={{ background: 'white', border: 'none', width: '76px', height: '76px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 10px 30px rgba(255,255,255,0.2)' }}>
                      {isPlaying ? <Pause size={36} color="black" fill="black" /> : <Play size={36} color="black" fill="black" style={{ marginLeft: '4px' }} />}
                    </button>
                    <SkipForward size={32} color="white" fill="white" style={{ opacity: 0.8 }} />
                    <Repeat size={20} color="white" style={{ opacity: 0.3 }} />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
