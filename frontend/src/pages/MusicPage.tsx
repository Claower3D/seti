import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Play, Pause, Plus, Trash2, Music as MusicIcon } from 'lucide-react';
import api from '../api/client';
import { useMusic } from '../context/MusicContext';

interface Song {
  id?: number;
  title: string;
  artist: string;
  url: string;
  imageUrl: string;
  duration: number;
}

export const MusicPage = () => {
  const [tab, setTab] = useState<'my' | 'search'>('search');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [myMusic, setMyMusic] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const { currentSong, isPlaying, playSong, pauseSong } = useMusic();

  useEffect(() => {
    fetchMyMusic();
  }, []);

  const fetchMyMusic = async () => {
    try {
      const res = await api.get('/music/my');
      setMyMusic(res.data || []);
    } catch (err) {
      console.error('Failed to fetch library', err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    try {
      const res = await api.get(`/music/search?q=${encodeURIComponent(query)}`);
      setSearchResults(res.data || []);
      setTab('search');
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  };

  const addToLibrary = async (song: Song) => {
    try {
      await api.post('/music/my', song);
      fetchMyMusic();
    } catch (err) {
      console.error('Add failed', err);
    }
  };

  const removeFromLibrary = async (id: number) => {
    try {
      await api.delete(`/music/my/${id}`);
      fetchMyMusic();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px 140px' }}>
      <div style={{ position: 'relative', height: '240px', borderRadius: '32px', overflow: 'hidden', marginBottom: '40px', display: 'flex', alignItems: 'flex-end', padding: '40px', background: 'linear-gradient(135deg, #1a1c2c 0%, #0a0c12 100%)', border: '1px solid var(--border-bright)' }}>
         <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at top right, var(--primary)0%, transparent 70%)', opacity: 0.15 }} />
         <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '30px', width: '100%' }}>
            <div style={{ width: '120px', height: '120px', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'var(--glow)' }}>
                <MusicIcon size={48} color="var(--primary)" />
            </div>
            <div style={{ flex: 1 }}>
               <h1 style={{ fontSize: '3rem', fontWeight: '900', color: 'white', margin: 0, letterSpacing: '-1px' }}>Музыка</h1>
               <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button onClick={() => setTab('my')} style={{ padding: '10px 24px', borderRadius: '14px', border: 'none', background: tab === 'my' ? 'white' : 'rgba(255,255,255,0.1)', color: tab === 'my' ? 'black' : 'white', fontWeight: '800', cursor: 'pointer', transition: '0.3s' }}>Мои аудиозаписи</button>
                  <button onClick={() => setTab('search')} style={{ padding: '10px 24px', borderRadius: '14px', border: 'none', background: tab === 'search' ? 'white' : 'rgba(255,255,255,0.1)', color: tab === 'search' ? 'black' : 'white', fontWeight: '800', cursor: 'pointer', transition: '0.3s' }}>Поиск песен</button>
               </div>
            </div>
         </div>
      </div>

      <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '40px', maxWidth: '600px' }}>
        <Search size={22} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
        <input 
          type="text" 
          value={query} 
          onChange={e => setQuery(e.target.value)}
          placeholder="Поиск по миллионам треков..." 
          style={{ width: '100%', padding: '20px 24px 20px 60px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '20px', color: 'white', fontSize: '1.1rem', outline: 'none', transition: '0.3s' }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--primary)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
        />
        {loading && <div style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)' }} className="pulse">...</div>}
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', padding: '0 20px 10px', color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>
           <div style={{ width: '60px' }}>#</div>
           <div style={{ flex: 1 }}>Название</div>
           <div style={{ width: '100px' }}>Длительность</div>
           <div style={{ width: '80px' }}></div>
        </div>

        {(tab === 'my' ? myMusic : searchResults).map((song, i) => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02 }}
            key={song.id || song.url} 
            className="song-row"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '12px 20px', 
              borderRadius: '16px', 
              cursor: 'pointer',
              background: currentSong?.url === song.url ? 'rgba(0, 245, 255, 0.08)' : 'transparent',
              border: '1px solid transparent',
              transition: '0.2s'
            }}
            onClick={() => currentSong?.url === song.url && isPlaying ? pauseSong() : playSong(song)}
          >
            <div style={{ width: '60px', position: 'relative' }}>
               <div style={{ width: '44px', height: '44px', borderRadius: '10px', overflow: 'hidden', background: '#1a1c2c' }}>
                  <img src={song.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               </div>
               <div className="play-overlay" style={{ position: 'absolute', inset: 0, width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: currentSong?.url === song.url ? 1 : 0, transition: '0.2s' }}>
                  {currentSong?.url === song.url && isPlaying ? <Pause size={18} color="var(--primary)" /> : <Play size={18} color="white" fill="white" />}
               </div>
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '800', color: currentSong?.url === song.url ? 'var(--primary)' : 'white', fontSize: '0.95rem' }}>{song.title}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '2px' }}>{song.artist}</div>
            </div>

            <div style={{ width: '100px', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', fontWeight: '600' }}>
              {song.duration > 0 ? `${Math.floor(song.duration / 60)}:${(song.duration % 60).toString().padStart(2, '0')}` : '--:--'}
            </div>

            <div style={{ width: '80px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              {tab === 'search' ? (
                <button 
                  onClick={(e) => { e.stopPropagation(); addToLibrary(song); }}
                  className="action-btn"
                  style={{ background: 'rgba(0,245,255,0.1)', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--primary)' }}
                >
                  <Plus size={18} />
                </button>
              ) : (
                <button 
                  onClick={(e) => { e.stopPropagation(); removeFromLibrary(song.id!); }}
                  className="action-btn"
                  style={{ background: 'rgba(255,48,96,0.1)', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ff3060' }}
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <style>{`
        .song-row:hover { background: rgba(255,255,255,0.04) !important; }
        .song-row:hover .play-overlay { opacity: 1 !important; }
        .action-btn:hover { transform: scale(1.1); filter: brightness(1.2); }
      `}</style>
    </div>
  );
};
