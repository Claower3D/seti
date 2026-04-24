import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { useMusic } from '../context/MusicContext';

export const MusicPlayer = () => {
  const { currentSong, isPlaying, togglePlay, currentTime, duration, seek } = useMusic();

  if (!currentSong) return null;

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      style={{ 
        position: 'fixed', 
        bottom: '80px', 
        left: '50%', 
        transform: 'translateX(-50%)',
        width: 'calc(100% - 40px)',
        maxWidth: '800px',
        background: 'rgba(10, 12, 25, 0.8)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-bright)',
        borderRadius: '24px',
        padding: '12px 20px',
        zIndex: 1000,
        boxShadow: '0 20px 40px rgba(0,0,0,0.6), var(--glow)',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
        <div style={{ position: 'relative', width: '48px', height: '48px', flexShrink: 0 }}>
           <img src={currentSong.imageUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />
           {isPlaying && (
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
               style={{ position: 'absolute', inset: 0, border: '2px solid var(--primary)', borderRadius: '12px', pointerEvents: 'none' }}
             />
           )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: '900', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentSong.title}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700' }}>{currentSong.artist}</div>
        </div>
      </div>

      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px' }}>
          <SkipBack size={20} color="white" style={{ opacity: 0.5, cursor: 'not-allowed' }} />
          <button onClick={togglePlay} style={{ background: 'var(--primary)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--glow)' }}>
            {isPlaying ? <Pause size={24} color="black" /> : <Play size={24} color="black" fill="black" style={{ marginLeft: '2px' }} />}
          </button>
          <SkipForward size={20} color="white" style={{ opacity: 0.5, cursor: 'not-allowed' }} />
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', minWidth: '35px' }}>
            {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')}
          </span>
          <div 
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              seek((x / rect.width) * duration);
            }}
            style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', cursor: 'pointer', position: 'relative' }}
          >
            <motion.div 
              style={{ height: '100%', background: 'var(--primary)', borderRadius: '2px', boxShadow: 'var(--glow)', width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', minWidth: '35px' }}>
            {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Volume2 size={20} color="white" style={{ opacity: 0.6 }} />
        <div style={{ width: '80px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }} />
      </div>
    </motion.div>
  );
};
