import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface Song {
  id?: number;
  title: string;
  artist: string;
  url: string;
  imageUrl: string;
  duration?: number;
}

interface MusicContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  playSong: (song: Song) => void;
  pauseSong: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  currentTime: number;
  duration: number;
  error: string | null;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = "anonymous"; // Essential for some browsers and canvas visualizers
    audioRef.current = audio;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setError(null);
    };
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e: any) => {
      console.error('Audio playback error:', audio.error);
      setError('Ошибка воспроизведения. Попробуйте другой трек.');
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, []);

  const playSong = async (song: Song) => {
    if (!audioRef.current) return;

    setError(null);
    let targetUrl = song.url;
    if (targetUrl.startsWith('/api')) {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      // Ensure the URL is absolute and doesn't have double slashes if baseUrl ends with /
      const cleanBase = baseUrl.replace(/\/$/, '');
      targetUrl = cleanBase + targetUrl;
    }

    try {
      if (currentSong?.url === song.url) {
        if (audioRef.current.paused) {
          await audioRef.current.play();
        }
      } else {
        audioRef.current.src = targetUrl;
        audioRef.current.load(); // Force reset
        await audioRef.current.play();
        setCurrentSong(song);
      }
      setIsPlaying(true);
    } catch (err: any) {
      console.error('Playback failed', err);
      if (err.name !== 'AbortError') {
        setError('Не удалось запустить воспроизведение');
        setIsPlaying(false);
      }
    }
  };

  const pauseSong = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) pauseSong();
    else if (currentSong) playSong(currentSong);
  };

  const seek = (time: number) => {
    if (audioRef.current && !isNaN(time)) {
      audioRef.current.currentTime = time;
    }
  };

  return (
    <MusicContext.Provider value={{ currentSong, isPlaying, playSong, pauseSong, togglePlay, seek, currentTime, duration, error }}>
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) throw new Error('useMusic must be used within a MusicProvider');
  return context;
};
