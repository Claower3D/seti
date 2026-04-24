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

  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    const fetchMyMusic = async () => {
      try {
        const res = await api.get('/music/my');
        setMyMusic(res.data || []);
      } catch (err) {
        console.error('Failed to fetch library', err);
      }
    };
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
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '10px 16px 140px' }}>
      {/* Mini Adaptive Header */}
      <div style={{ 
        padding: isMobile ? '20px 16px' : '30px 24px', 
        background: 'rgba(255,255,255,0.02)', 
        borderRadius: '24px', 
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: 'rgba(0,245,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00f5ff' }}>
            <MusicIcon size={24} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'white', margin: 0 }}>Музыка</h1>
        </div>

        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '12px' }}>
          <button 
            onClick={() => setTab('my')} 
            style={{ 
              padding: '8px 16px', borderRadius: '10px', border: 'none', 
              background: tab === 'my' ? 'rgba(255,255,255,0.1)' : 'transparent', 
              color: tab === 'my' ? 'white' : 'rgba(255,255,255,0.4)', 
              fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', transition: '0.2s' 
            }}>Моё</button>
          <button 
            onClick={() => setTab('search')} 
            style={{ 
              padding: '8px 16px', borderRadius: '10px', border: 'none', 
              background: tab === 'search' ? 'rgba(255,255,255,0.1)' : 'transparent', 
              color: tab === 'search' ? 'white' : 'rgba(255,255,255,0.4)', 
              fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', transition: '0.2s' 
            }}>Поиск</button>
        </div>
      </div>

      <form onSubmit={handleSearch} style={{ position: 'relative', marginBottom: '32px', width: '100%' }}>
        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
        <input 
          type="text" 
          value={query} 
          onChange={e => setQuery(e.target.value)}
          placeholder="Искать музыку..." 
          style={{ width: '100%', padding: '14px 16px 14px 48px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', color: 'white', fontSize: '0.95rem', outline: 'none' }}
        />
        {loading && <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', className: 'pulse' }}><div style={{ width: '4px', height: '4px', background: '#00f5ff', borderRadius: '50%' }} /></div>}
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {(tab === 'my' ? myMusic : searchResults).map((song, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.01 }}
            key={(song.id || '') + song.url} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '10px 12px', 
              borderRadius: '14px', 
              cursor: 'pointer',
              background: currentSong?.url === song.url ? 'rgba(0, 245, 255, 0.05)' : 'transparent',
              transition: '0.2s'
            }}
            onClick={() => currentSong?.url === song.url && isPlaying ? pauseSong() : playSong(song)}
          >
            <div style={{ position: 'relative', width: '42px', height: '42px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, marginRight: '14px' }}>
               <img src={song.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               <div style={{ position: 'absolute', inset: '0px', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: currentSong?.url === song.url && isPlaying ? 1 : 0 }}>
                  <Pause size={14} color="#00f5ff" />
               </div>
            </div>
            
            <div style={{ flex: 1, minWidth: '0px' }}>
              <div style={{ fontWeight: '700', color: currentSong?.url === song.url ? '#00f5ff' : 'white', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '2px' }}>{song.artist}</div>
            </div>

            <div style={{ width: '44px', display: 'flex', justifyContent: 'flex-end' }}>
              {tab === 'search' ? (
                <button onClick={(e) => { e.stopPropagation(); addToLibrary(song); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}>
                  <Plus size={18} />
                </button>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); removeFromLibrary(song.id!); }} style={{ background: 'none', border: 'none', color: 'rgba(255,77,77,0.3)', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
