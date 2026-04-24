import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Trash2, Music as MusicIcon, Play, Pause, Headphones, Disc, BarChart2 } from 'lucide-react';
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

const AudioVisualizerIcon = () => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '14px' }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ height: ['4px', '14px', '6px', '12px', '4px'] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
          style={{ width: '3px', background: '#00f5ff', borderRadius: '1px' }}
        />
      ))}
    </div>
);

const SkeletonRow = () => (
  <div style={{ display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', marginBottom: '8px' }}>
    <div className="pulse" style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)' }} />
    <div style={{ flex: 1, marginLeft: '16px' }}>
      <div className="pulse" style={{ width: '40%', height: '12px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', marginBottom: '8px' }} />
      <div className="pulse" style={{ width: '25%', height: '10px', borderRadius: '5px', background: 'rgba(255,255,255,0.03)' }} />
    </div>
  </div>
);

export const MusicPage = () => {
  const [tab, setTab] = useState<'my' | 'search'>('my');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [myMusic, setMyMusic] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { currentSong, isPlaying, playSong, pauseSong } = useMusic();

  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    fetchMyMusic().finally(() => setInitialLoading(false));
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
    if (!query.trim()) return;
    setLoading(true);
    setTab('search');
    try {
      const res = await api.get(`/music/search?q=${encodeURIComponent(query)}`);
      setSearchResults(res.data || []);
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
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '10px 20px 160px' }}>
      
      {/* Premium Dynamic Background Glow */}
      <div style={{ 
          position: 'fixed', 
          top: '0', left: '50%', transform: 'translateX(-50%)', 
          width: '100%', maxWidth: '1200px', height: '400px', 
          background: currentSong ? `radial-gradient(circle at 50% 0%, color-mix(in srgb, ${currentSong.imageUrl ? '#00f5ff' : 'transparent'}, transparent 92%), transparent 70%)` : 'none',
          pointerEvents: 'none', zIndex: -1, opacity: 0.5 
      }} />

      {/* Header & Tabs */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'flex-start' : 'center', 
        gap: '24px',
        marginBottom: '40px',
        padding: '20px 0'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
             <Headphones size={20} color="#00f5ff" />
             <span style={{ fontSize: '0.7rem', fontWeight: '900', color: '#00f5ff', letterSpacing: '4px', textTransform: 'uppercase' }}>Discovery</span>
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: '900', color: 'white', margin: 0, letterSpacing: '-1px' }}>Музыка</h1>
        </div>

        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {[
            { id: 'my', label: 'Моя коллекция', icon: Disc },
            { id: 'search', label: 'Поиск мировых треков', icon: Search }
          ].map(t => (
            <button 
              key={t.id}
              onClick={() => setTab(t.id as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 20px', borderRadius: '14px', border: 'none',
                background: tab === t.id ? 'white' : 'transparent',
                color: tab === t.id ? 'black' : 'rgba(255,255,255,0.5)',
                fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <t.icon size={16} />
              {(!isMobile || tab === t.id) && t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '48px' }}>
        <Search size={20} style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#00f5ff', opacity: 0.5 }} />
        <input 
          type="text" 
          value={query} 
          onChange={e => setQuery(e.target.value)}
          placeholder="Найти любую музыку или исполнителя..." 
          style={{ 
            width: '100%', 
            padding: '20px 24px 20px 60px', 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.08)', 
            borderRadius: '24px', 
            color: 'white', 
            fontSize: '1.1rem', 
            outline: 'none',
            transition: '0.3s',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(0, 245, 255, 0.4)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
        <motion.button 
          whileTap={{ scale: 0.95 }}
          type="submit"
          style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: '#00f5ff', color: 'black', border: 'none', padding: '10px 22px', borderRadius: '16px', fontWeight: '900', fontSize: '0.85rem', cursor: 'pointer', boxShadow: '0 0 20px rgba(0,245,255,0.3)' }}
        >
          {loading ? 'Ищем...' : 'Поиск'}
        </motion.button>
      </form>

      {/* Playlists / Tracks Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {initialLoading || loading ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
        ) : (
          <>
            <AnimatePresence>
              {(tab === 'my' ? myMusic : searchResults).length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ textAlign: 'center', padding: '100px 20px', color: 'rgba(255,255,255,0.2)' }}
                >
                  <MusicIcon size={64} style={{ marginBottom: '24px', opacity: 0.1 }} />
                  <h3 style={{ fontSize: '1.4rem', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>
                    {tab === 'my' ? 'Ваша фонотека пуста' : 'Начните поиск музыки'}
                  </h3>
                  <p style={{ maxWidth: '300px', margin: '8px auto', fontSize: '0.9rem' }}>
                    {tab === 'my' ? 'Добавляйте треки из поиска, чтобы они всегда были под рукой' : 'Мы найдем любой трек из мировых чартов'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {(tab === 'my' ? myMusic : searchResults).map((song, i) => {
              const isActive = currentSong?.url === song.url;
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  key={(song.id || '') + song.url} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '12px 16px', 
                    borderRadius: '20px', 
                    cursor: 'pointer',
                    background: isActive ? 'rgba(0, 245, 255, 0.08)' : 'transparent',
                    border: '1px solid',
                    borderColor: isActive ? 'rgba(0, 245, 255, 0.1)' : 'transparent',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  onClick={() => isActive && isPlaying ? pauseSong() : playSong(song)}
                >
                  <div style={{ position: 'relative', width: '52px', height: '52px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, marginRight: '20px', boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>
                    <img src={song.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: '0.3s' }} className="song-thumb" />
                    <div style={{ position: 'absolute', inset: '0px', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isActive ? 1 : 0, transition: '0.2s' }}>
                        {isPlaying && isActive ? <AudioVisualizerIcon /> : <Play size={20} color="white" fill="white" />}
                    </div>
                  </div>
                  
                  <div style={{ flex: 1, minWidth: '0px' }}>
                    <div style={{ fontWeight: '800', color: isActive ? '#00f5ff' : 'white', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {song.title}
                        {isActive && isPlaying && <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00f5ff', boxShadow: '0 0 10px #00f5ff' }} />}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '4px', fontWeight: '600' }}>{song.artist}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
                    {tab === 'search' ? (
                      <motion.button 
                        whileHover={{ scale: 1.1, color: '#00f5ff' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); addToLibrary(song); }} 
                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.3)', width: '38px', height: '38px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Plus size={20} />
                      </motion.button>
                    ) : (
                      <motion.button 
                        whileHover={{ scale: 1.1, color: '#ff4d4d' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); removeFromLibrary(song.id!); }} 
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.15)', cursor: 'pointer', padding: '8px' }}
                      >
                        <Trash2 size={18} />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </>
        )}
      </div>

      <style>{`
        .pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0, 245, 255, 0.2); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0, 245, 255, 0.5); }
      `}</style>
    </div>
  );
};
