import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Play, Pause, Plus, Trash2, Music as MusicIcon, Heart, Disc, ListMusic } from 'lucide-react';
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
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--primary)', textShadow: 'var(--glow)' }}>МУЗЫКА</h1>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <button onClick={() => setTab('my')} style={{ padding: '8px 16px', borderRadius: '11px', border: 'none', background: tab === 'my' ? 'var(--primary)' : 'transparent', color: tab === 'my' ? 'black' : 'white', fontWeight: '800', cursor: 'pointer', transition: '0.2s' }}>Мои треки</button>
          <button onClick={() => setTab('search')} style={{ padding: '8px 16px', borderRadius: '11px', border: 'none', background: tab === 'search' ? 'var(--primary)' : 'transparent', color: tab === 'search' ? 'black' : 'white', fontWeight: '800', cursor: 'pointer', transition: '0.2s' }}>Поиск</button>
        </div>
      </div>

      <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '30px' }}>
        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input 
          type="text" 
          value={query} 
          onChange={e => setQuery(e.target.value)}
          placeholder="Поиск музыки с Jamendo API..." 
          style={{ width: '100%', padding: '16px 20px 16px 48px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '16px', color: 'white', fontSize: '1rem', outline: 'none' }}
        />
        {loading && <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }} className="pulse">...</div>}
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {(tab === 'my' ? myMusic : searchResults).map((song, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            key={song.id || song.url} 
            className="glass-panel" 
            style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 18px', borderRadius: '18px', border: currentSong?.url === song.url ? '1px solid var(--primary)' : '1px solid var(--border)' }}
          >
            <div style={{ position: 'relative', width: '54px', height: '54px', flexShrink: 0 }}>
              <img src={song.imageUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />
              <button 
                onClick={() => currentSong?.url === song.url && isPlaying ? pauseSong() : playSong(song)}
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: currentSong?.url === song.url ? 1 : 0, transition: '0.2s' }}
                className="play-hover"
              >
                {currentSong?.url === song.url && isPlaying ? <Pause size={24} color="var(--primary)" /> : <Play size={24} color="white" fill="white" />}
              </button>
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: '800', color: 'white', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{song.title}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>{song.artist}</div>
            </div>

            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: '600' }}>
              {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {tab === 'search' ? (
                <button 
                  onClick={() => addToLibrary(song)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--primary)' }}
                >
                  <Plus size={18} />
                </button>
              ) : (
                <button 
                  onClick={() => removeFromLibrary(song.id!)}
                  style={{ background: 'rgba(255,48,96,0.1)', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ff3060' }}
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {(tab === 'my' ? myMusic : searchResults).length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
            <MusicIcon size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>{tab === 'my' ? 'Ваша библиотека пуста. Найдите что-нибудь в поиске!' : 'Ничего не найдено. Начните поиск!'}</p>
          </div>
        )}
      </div>

      <style>{`
        .play-hover:hover { opacity: 1 !important; }
      `}</style>
    </div>
  );
};
