import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Maximize2, Minimize2, Repeat, Shuffle } from 'lucide-react';
import { useMusic } from '../context/MusicContext';

export const MusicPlayer = () => {
  const { currentSong, isPlaying, togglePlay, currentTime, duration, seek } = useMusic();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ x: '-50%', y: 100, opacity: 0 }}
        animate={{ 
          x: '-50%',
          y: 0, 
          opacity: 1,
          height: isExpanded ? '100%' : '80px',
          bottom: isExpanded ? '0px' : '16px',
          width: isExpanded ? '100%' : 'calc(100% - 32px)',
          borderRadius: isExpanded ? '0px' : '20px',
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{ 
          position: 'fixed', 
          left: '50%', 
          background: 'rgba(15, 18, 30, 0.95)',
          backdropFilter: 'blur(30px) saturate(150%)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 2000,
          boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 15px rgba(0,245,255,0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Background Blur for Expanded Mode */}
        {isExpanded && (
          <div style={{ position: 'absolute', inset: '0px', zIndex: -1, overflow: 'hidden' }}>
            <img src={currentSong.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(100px) brightness(0.4)', transform: 'scale(1.5)' }} />
          </div>
        )}

        {/* Compact View Content */}
        {!isExpanded && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '12px 24px', height: '100%' }}>
            <div 
              onClick={() => setIsExpanded(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0, cursor: 'pointer' }}
            >
              <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
                <img src={currentSong.imageUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '14px', objectFit: 'cover', boxShadow: '0 8px 16px rgba(0,0,0,0.4)' }} />
                {isPlaying && (
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1] }} 
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{ position: 'absolute', inset: '-2px', border: '2px solid #00f5ff', borderRadius: '16px', opacity: 0.5 }}
                  />
                )}
              </div>
              <div style={{ minWidth: '0px' }}>
                <div style={{ fontSize: '1rem', fontWeight: '900', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentSong.title}</div>
                <div style={{ fontSize: '0.8rem', color: '#00f5ff', fontWeight: '700', letterSpacing: '0.5px' }}>{currentSong.artist}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <SkipBack size={22} color="white" style={{ opacity: 0.4 }} />
                <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} style={{ background: '#00f5ff', border: 'none', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 15px rgba(0,245,255,0.4)' }}>
                  {isPlaying ? <Pause size={26} color="black" fill="black" /> : <Play size={26} color="black" fill="black" style={{ marginLeft: '4px' }} />}
                </button>
                <SkipForward size={22} color="white" style={{ opacity: 0.4 }} />
              </div>
              <Maximize2 size={20} color="white" style={{ opacity: 0.5, cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setIsExpanded(true); }} />
            </div>
          </div>
        )}

        {/* Expanded View Content */}
        {isExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '40px 30px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
              <Minimize2 size={28} color="white" style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => setIsExpanded(false)} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: '900', color: '#00f5ff', letterSpacing: '3px', textTransform: 'uppercase' }}>Now Playing</div>
              </div>
              <div style={{ width: '28px' }} />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '40px' }}>
              <motion.div 
                animate={{ scale: isPlaying ? 1 : 0.9 }}
                style={{ width: '100%', maxWidth: '340px', aspectRatio: '1/1', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.6)' }}
              >
                <img src={currentSong.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </motion.div>

              <div style={{ textAlign: 'center', width: '100%' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white', marginBottom: '8px' }}>{currentSong.title}</h2>
                <p style={{ fontSize: '1.1rem', color: '#00f5ff', fontWeight: '700' }}>{currentSong.artist}</p>
              </div>

              <div style={{ width: '100%', maxWidth: '500px' }}>
                <div 
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    seek((x / rect.width) * duration);
                  }}
                  style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', cursor: 'pointer', position: 'relative', marginBottom: '12px' }}
                >
                  <motion.div 
                    style={{ height: '100%', background: 'linear-gradient(90deg, #00f5ff, #7b61ff)', borderRadius: '4px', width: `${progress}%` }}
                  />
                  <div style={{ position: 'absolute', top: '50%', left: `${progress}%`, width: '16px', height: '16px', background: 'white', borderRadius: '50%', transform: 'translate(-50%, -50%)', border: '3px solid #00f5ff' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: '800' }}>
                  <span>{Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}</span>
                  <span>{Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                <Shuffle size={24} color="white" style={{ opacity: 0.3 }} />
                <SkipBack size={36} color="white" fill="white" style={{ opacity: 0.8 }} />
                <button onClick={togglePlay} style={{ background: 'white', border: 'none', width: '84px', height: '84px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 30px rgba(255,255,255,0.3)' }}>
                  {isPlaying ? <Pause size={42} color="black" fill="black" /> : <Play size={42} color="black" fill="black" style={{ marginLeft: '6px' }} />}
                </button>
                <SkipForward size={36} color="white" fill="white" style={{ opacity: 0.8 }} />
                <Repeat size={24} color="white" style={{ opacity: 0.3 }} />
              </div>
            </div>
          </div>
        )}

        {/* Progress bar in compact mode */}
        {!isExpanded && (
          <div style={{ position: 'absolute', bottom: '0px', left: '0px', right: '0px', height: '3px', background: 'rgba(255,255,255,0.05)' }}>
            <motion.div 
              style={{ height: '100%', background: '#00f5ff', width: `${progress}%` }}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
