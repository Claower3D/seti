import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Send, Search, ArrowLeft, MessageSquare, Paperclip, Mic, Edit2, Trash2, X, Play, Pause, CheckCheck, Trash, Phone, PhoneOff, Video, VideoOff, MicOff, PhoneCall } from 'lucide-react';

// ─── Voice Player ────────────────────────────────────────────────────────────
const VoicePlayer = ({ src }: { src: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const toggle = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '20px', width: '220px', background: 'rgba(0,0,0,0.2)' }}>
      <button onClick={toggle} style={{ background: 'var(--primary)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--glow)', flexShrink: 0 }}>
        {isPlaying ? <Pause size={14} fill="black" /> : <Play size={14} fill="black" style={{ marginLeft: '2px' }} />}
      </button>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div onClick={() => {
          if (!audioRef.current) return;
          const rect = (event as any).currentTarget.getBoundingClientRect();
          audioRef.current.currentTime = ((event as any).clientX - rect.left) / rect.width * audioRef.current.duration;
        }} style={{ height: '3px', background: 'rgba(255,255,255,0.15)', borderRadius: '2px', cursor: 'pointer' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', borderRadius: '2px', transition: 'width 0.1s linear' }} />
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>{fmt(isPlaying ? currentTime : duration)}</div>
      </div>
      <audio ref={audioRef} src={src}
        onTimeUpdate={() => { if (audioRef.current) { setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100); setCurrentTime(audioRef.current.currentTime); } }}
        onEnded={() => { setIsPlaying(false); setProgress(0); setCurrentTime(0); }}
        onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }} />
    </div>
  );
};

// ─── Voice Recorder ──────────────────────────────────────────────────────────
const VoiceRecorder = ({ onSend, onCancel }: { onSend: (blob: Blob) => void; onCancel: () => void }) => {
  const [seconds, setSeconds] = useState(0);
  const [bars, setBars] = useState<number[]>(Array(30).fill(3));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const timerRef = useRef<any>(null);
  const dragRef = useRef<number>(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let stream: MediaStream;
    const start = async () => {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;
      const rec = new MediaRecorder(stream);
      mediaRecorderRef.current = rec;
      audioChunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      rec.start();
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
      const draw = () => {
        animFrameRef.current = requestAnimationFrame(draw);
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        setBars(prev => [...prev.slice(1), Math.max(3, (data[2] / 255) * 40)]);
      };
      draw();
    };
    start();
    return () => {
      clearInterval(timerRef.current);
      cancelAnimationFrame(animFrameRef.current);
      if (mediaRecorderRef.current) mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleSend = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.onstop = () => { onSend(new Blob(audioChunksRef.current, { type: 'audio/webm' })); };
    mediaRecorderRef.current.stop();
  };

  const handleCancel = () => {
    if (mediaRecorderRef.current) { mediaRecorderRef.current.onstop = null; mediaRecorderRef.current.stop(); }
    onCancel();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, background: 'rgba(255,0,85,0.08)', borderRadius: '20px', padding: '8px 14px', border: '1px solid rgba(255,0,85,0.3)' }}>
      <button onClick={handleCancel} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', display: 'flex', flexShrink: 0 }}><Trash size={18} /></button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flex: 1, height: '32px' }}>
        {bars.map((h, i) => <div key={i} style={{ width: '3px', height: `${h}px`, background: 'var(--primary)', borderRadius: '2px', transition: 'height 0.05s', opacity: 0.8 }} />)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff4d4d', animation: 'pulse 1s infinite' }} />
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#ff4d4d', minWidth: '36px' }}>{fmt(seconds)}</span>
      </div>
      {dragging && <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flexShrink: 0 }}>← отмена</span>}
      <button onClick={handleSend}
        onTouchStart={(e) => { dragRef.current = e.touches[0].clientX; }}
        onTouchMove={(e) => { const dx = e.touches[0].clientX - dragRef.current; if (dx < -60) handleCancel(); setDragging(dx < -20); }}
        style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary)', border: 'none', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--glow)', flexShrink: 0 }}>
        <Send size={16} />
      </button>
    </motion.div>
  );
};

// ─── Call Screen ─────────────────────────────────────────────────────────────
const CallScreen = ({
  friend, isVideo, isIncoming, onAccept, onDecline, onEnd,
  localStream, remoteStream, isMuted, isVideoOff, onToggleMute, onToggleVideo
}: {
  friend: any; isVideo: boolean; isIncoming: boolean;
  onAccept?: () => void; onDecline: () => void; onEnd: () => void;
  localStream: MediaStream | null; remoteStream: MediaStream | null;
  isMuted: boolean; isVideoOff: boolean;
  onToggleMute: () => void; onToggleVideo: () => void;
}) => {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      setConnected(true);
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (!connected) return;
    const t = setInterval(() => setCallDuration(d => d + 1), 1000);
    return () => clearInterval(t);
  }, [connected]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 3000, background: isVideo ? '#000' : 'linear-gradient(135deg, #0a0a1a, #0d1a2e)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

      {/* Remote video (background for video calls) */}
      {isVideo && remoteStream && (
        <video ref={remoteVideoRef} autoPlay playsInline
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}

      {/* Blur overlay */}
      {isVideo && !remoteStream && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0a0a1a, #0d1a2e)' }} />
      )}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 24px' }}>
        {/* Avatar */}
        <motion.div
          animate={!connected ? { scale: [1, 1.08, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ position: 'relative' }}>
          {/* Ripple rings when ringing */}
          {!connected && [1, 2, 3].map(i => (
            <motion.div key={i}
              animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
              transition={{ repeat: Infinity, duration: 2, delay: i * 0.6 }}
              style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--primary)', margin: '-20px' }} />
          ))}
          <img src={friend.avatar} alt="" style={{ width: '120px', height: '120px', borderRadius: '40px', border: '3px solid var(--primary)', boxShadow: '0 0 40px rgba(0,242,255,0.4)', position: 'relative', zIndex: 1 }} />
        </motion.div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'white', fontWeight: '900', fontSize: '1.8rem', marginBottom: '8px', textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}>{friend.username}</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', letterSpacing: '0.05em' }}>
            {isIncoming && !connected ? (
              isVideo ? '📹 Входящий видеозвонок' : '📞 Входящий звонок'
            ) : connected ? (
              `🟢 ${fmt(callDuration)}`
            ) : (
              isVideo ? '📹 Видеозвонок...' : '📞 Вызов...'
            )}
          </p>
        </div>
      </div>

      {/* Local video pip */}
      {isVideo && localStream && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          style={{ position: 'absolute', bottom: '160px', right: '20px', width: '120px', height: '180px', borderRadius: '20px', overflow: 'hidden', border: '2px solid var(--primary)', boxShadow: '0 0 20px rgba(0,242,255,0.3)', zIndex: 20 }}>
          <video ref={localVideoRef} autoPlay playsInline muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
        </motion.div>
      )}

      {/* Controls */}
      <div style={{ position: 'absolute', bottom: '60px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '24px', zIndex: 20 }}>
        {isIncoming && !connected ? (
          // Incoming call — accept / decline
          <>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onDecline}
              style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#ff3060', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 30px rgba(255,48,96,0.5)' }}>
              <PhoneOff size={30} />
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onAccept}
              style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#00c853', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 30px rgba(0,200,83,0.5)' }}>
              <Phone size={30} />
            </motion.button>
          </>
        ) : (
          // Active call controls
          <>
            {isVideo && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={onToggleVideo}
                style={{ width: '60px', height: '60px', borderRadius: '50%', background: isVideoOff ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.9 }} onClick={onToggleMute}
              style={{ width: '60px', height: '60px', borderRadius: '50%', background: isMuted ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onEnd}
              style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#ff3060', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 30px rgba(255,48,96,0.5)' }}>
              <PhoneOff size={30} />
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
};

// ─── Main MessagesPage ────────────────────────────────────────────────────────
export const MessagesPage = () => {
  const { user } = useAuth();
  const { ws, lastMessage } = useNotifications();
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isRecording, setIsRecording] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
  const [fullscreenMedia, setFullscreenMedia] = useState<{url: string, type: string} | null>(null);
  const location = useLocation();

  // ── WebRTC state ──
  const [callState, setCallState] = useState<'idle' | 'outgoing' | 'incoming' | 'active'>('idle');
  const [callIsVideo, setCallIsVideo] = useState(false);
  const [callFriend, setCallFriend] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);

  const iceServers = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];

  // ── Start call ──
  const startCall = useCallback(async (friend: any, video: boolean) => {
    if (!ws) return;
    setCallFriend(friend);
    setCallIsVideo(video);
    setCallState('outgoing');

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video });
    setLocalStream(stream);

    const pc = new RTCPeerConnection({ iceServers });
    pcRef.current = pc;
    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    const remoteS = new MediaStream();
    setRemoteStream(remoteS);
    pc.ontrack = (e) => { e.streams[0].getTracks().forEach(t => remoteS.addTrack(t)); };

    pc.onicecandidate = (e) => {
      if (e.candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'call_ice', receiverId: friend.id, candidate: e.candidate }));
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    ws.send(JSON.stringify({ action: 'call_offer', receiverId: friend.id, offer, isVideo: video }));
  }, [ws]);

  // ── Accept call ──
  const acceptCall = useCallback(async () => {
    if (!ws || !callFriend || !pendingOfferRef.current) return;
    setCallState('active');

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: callIsVideo });
    setLocalStream(stream);

    const pc = new RTCPeerConnection({ iceServers });
    pcRef.current = pc;
    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    const remoteS = new MediaStream();
    setRemoteStream(remoteS);
    pc.ontrack = (e) => { e.streams[0].getTracks().forEach(t => remoteS.addTrack(t)); };

    pc.onicecandidate = (e) => {
      if (e.candidate && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'call_ice', receiverId: callFriend.id, candidate: e.candidate }));
      }
    };

    await pc.setRemoteDescription(pendingOfferRef.current);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    ws.send(JSON.stringify({ action: 'call_answer', receiverId: callFriend.id, answer }));
  }, [ws, callFriend, callIsVideo]);

  // ── End call ──
  const endCall = useCallback(() => {
    if (ws && callFriend && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'call_end', receiverId: callFriend.id }));
    }
    if (localStream) localStream.getTracks().forEach(t => t.stop());
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    setCallFriend(null);
    setIsMuted(false);
    setIsVideoOff(false);
  }, [ws, callFriend, localStream]);

  // ── Toggle mute ──
  const toggleMute = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsMuted(m => !m);
  };

  // ── Toggle video ──
  const toggleVideo = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setIsVideoOff(v => !v);
  };

  // ── Handle WS call signaling ──
  useEffect(() => {
    if (!lastMessage) return;
    const data = lastMessage;

    if (data.action === 'call_offer') {
      const callerFriend = friends.find(f => f.id === data.senderId) || { id: data.senderId, username: 'Звонок', avatar: '' };
      setCallFriend(callerFriend);
      setCallIsVideo(!!data.isVideo);
      pendingOfferRef.current = data.offer;
      setCallState('incoming');
      return;
    }
    if (data.action === 'call_answer' && pcRef.current) {
      pcRef.current.setRemoteDescription(data.answer);
      setCallState('active');
      return;
    }
    if (data.action === 'call_ice' && pcRef.current) {
      pcRef.current.addIceCandidate(data.candidate).catch(() => {});
      return;
    }
    if (data.action === 'call_end') {
      if (localStream) localStream.getTracks().forEach(t => t.stop());
      if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
      setLocalStream(null); setRemoteStream(null);
      setCallState('idle'); setCallFriend(null);
      return;
    }

    // regular message handling
    const action = data.action || 'send';
    const msg = data.message || data;
    setMessages(prev => {
      if (action === 'delete') return prev.filter(m => m.id !== msg.id);
      if (action === 'edit') return prev.map(m => m.id === msg.id ? { ...m, content: msg.content } : m);
      if (action === 'read_receipt') {
        if (selectedFriend && data.senderId === selectedFriend.id) return prev.map(m => m.receiverId === data.senderId ? { ...m, isRead: true } : m);
        return prev;
      }
      const inChat = selectedFriend && (msg.senderId === selectedFriend.id || msg.receiverId === selectedFriend.id);
      if (inChat && msg.senderId === selectedFriend.id) markAsRead(selectedFriend.id);
      if (inChat && prev.some(m => m.id === msg.id && action === 'send')) return prev;
      return inChat ? [...prev, msg] : prev;
    });
  }, [lastMessage, selectedFriend, friends]);

  useEffect(() => {
    (window as any).lastSelectedFriendId = selectedFriend?.id || null;
    return () => { (window as any).lastSelectedFriendId = null; };
  }, [selectedFriend]);

  useEffect(() => {
    if (friends.length > 0 && location.state?.selectedFriendId) {
      const friend = friends.find(f => f.id === location.state.selectedFriendId);
      if (friend) setSelectedFriend(friend);
    }
  }, [friends, location.state]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    api.get('/friends').then(res => setFriends(res.data || [])).catch(() => setFriends([]));
  }, []);

  useEffect(() => {
    if (!selectedFriend) return;
    api.get(`/messages/${selectedFriend.id}`).then(res => { setMessages(res.data || []); markAsRead(selectedFriend.id); });
  }, [selectedFriend]);

  const markAsRead = (friendId: number) => {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: 'read', receiverId: friendId }));
  };

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ws || !input.trim() || !selectedFriend) return;
    if (editingMsgId) {
      ws.send(JSON.stringify({ action: 'edit', messageId: editingMsgId, content: input, receiverId: selectedFriend.id }));
      setEditingMsgId(null);
    } else {
      ws.send(JSON.stringify({ action: 'send', receiverId: selectedFriend.id, content: input }));
    }
    setInput('');
    inputRef.current?.focus();
  };

  const handleVoiceSend = async (blob: Blob) => {
    setIsRecording(false);
    if (!selectedFriend || !ws) return;
    const fd = new FormData();
    fd.append('file', blob, `voice-${Date.now()}.webm`);
    try {
      const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      ws.send(JSON.stringify({ action: 'send', receiverId: selectedFriend.id, content: '', fileUrl: r.data.url, fileName: 'Голосовое сообщение.webm', fileType: 'audio/webm' }));
    } catch { alert('Ошибка отправки голосового сообщения'); }
  };

  const handleDelete = (msgId: number) => {
    if (!ws || !selectedFriend) return;
    if (confirm('Удалить сообщение?')) ws.send(JSON.stringify({ action: 'delete', messageId: msgId, receiverId: selectedFriend.id }));
  };

  const handeEditClick = (msg: any) => { setEditingMsgId(msg.id); setInput(msg.content); inputRef.current?.focus(); };

  const sendFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selectedFriend || !ws) return;
    const fd = new FormData();
    fd.append('file', e.target.files[0]);
    try {
      const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      ws.send(JSON.stringify({ action: 'send', receiverId: selectedFriend.id, content: '', fileUrl: r.data.url, fileName: r.data.fileName, fileType: r.data.fileType }));
    } catch { alert('Ошибка загрузки файла'); }
    e.target.value = '';
  };

  const isImage = (type?: string) => type?.startsWith('image/');
  const showList = !isMobile || !selectedFriend;
  const showChat = !isMobile || selectedFriend;

  return (
    <div style={{ height: 'calc(100vh - 140px)', display: 'flex', gap: '16px' }}>

      {showList && (
        <div className="glass-panel" style={{ width: isMobile ? '100%' : '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ marginBottom: '18px', fontSize: '1.4rem', fontWeight: '900' }} className="neon-text">Каналы связи</h2>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input type="text" className="input-field" placeholder="Поиск сигналов..." style={{ paddingLeft: '44px', height: '44px', fontSize: '0.9rem' }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {friends.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <MessageSquare size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                <p>Нет активных сессий</p>
              </div>
            ) : friends.map(friend => (
              <div key={friend.id} onClick={() => setSelectedFriend(friend)}
                style={{ padding: '16px', display: 'flex', gap: '14px', cursor: 'pointer', alignItems: 'center', borderRadius: '16px',
                  background: selectedFriend?.id === friend.id ? 'color-mix(in srgb, var(--primary), transparent 92%)' : 'transparent',
                  border: selectedFriend?.id === friend.id ? '1px solid color-mix(in srgb, var(--primary), transparent 80%)' : '1px solid transparent',
                  transition: 'all 0.3s', marginBottom: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <img src={friend.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + friend.username}
                    alt="avatar" style={{ width: '52px', height: '52px', borderRadius: '18px', objectFit: 'cover', border: selectedFriend?.id === friend.id ? '2px solid var(--primary)' : '2px solid transparent' }} />
                  <div style={{ position: 'absolute', bottom: -2, right: -2, width: '12px', height: '12px', background: 'var(--primary)', borderRadius: '50%', border: '2px solid var(--bg)', boxShadow: 'var(--glow)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '800', fontSize: '1rem', color: selectedFriend?.id === friend.id ? 'var(--primary)' : 'white' }}>{friend.username}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Установлено соединение...</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showChat && (
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, border: '1px solid var(--border)' }}>
          {selectedFriend ? (
            <>
              {/* Chat header with call buttons */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.02)' }}>
                {isMobile && (
                  <button onClick={() => setSelectedFriend(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', display: 'flex', borderRadius: '12px' }}>
                    <ArrowLeft size={24} />
                  </button>
                )}
                <img src={selectedFriend.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + selectedFriend.username}
                  alt="avatar" style={{ width: '44px', height: '44px', borderRadius: '14px', border: '2px solid var(--primary)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '900', fontSize: '1.1rem', color: 'var(--primary)', textShadow: 'var(--glow)' }}>{selectedFriend.username}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div className="pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', boxShadow: 'var(--glow)' }}></div> Online Signal
                  </div>
                </div>

                {/* CALL BUTTONS */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => startCall(selectedFriend, false)}
                    title="Аудиозвонок"
                    style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'color-mix(in srgb, var(--primary), transparent 85%)', border: '1px solid color-mix(in srgb, var(--primary), transparent 60%)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 10px rgba(0,242,255,0.15)' }}>
                    <Phone size={18} />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => startCall(selectedFriend, true)}
                    title="Видеозвонок"
                    style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'color-mix(in srgb, var(--secondary), transparent 85%)', border: '1px solid color-mix(in srgb, var(--secondary), transparent 60%)', color: 'var(--secondary, #7b2ff7)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 10px rgba(123,47,247,0.15)' }}>
                    <Video size={18} />
                  </motion.button>
                </div>
              </div>

              <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '60px' }}>
                    <p style={{ letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.8rem' }}>инициализация сеанса связи 👋</p>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <motion.div initial={{ opacity: 0, x: isMe ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} key={i}
                      style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div className="msg-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isMe ? 'row-reverse' : 'row', maxWidth: isMobile ? '88%' : '70%', minWidth: 0 }}>
                        <div style={{ width: '100%', padding: '12px 18px', borderRadius: isMe ? '22px 22px 4px 22px' : '22px 22px 22px 4px',
                          background: isMe ? 'linear-gradient(135deg, color-mix(in srgb, var(--primary), transparent 70%), color-mix(in srgb, var(--secondary), transparent 70%))' : 'rgba(255,255,255,0.08)',
                          color: isMe ? '#ffffff' : '#e8f4f8', fontSize: '1rem', lineHeight: '1.5',
                          overflowWrap: 'break-word', wordBreak: 'break-word', whiteSpace: 'normal', fontWeight: isMe ? '700' : '500',
                          boxShadow: isMe ? 'var(--glow)' : '0 4px 20px rgba(0,0,0,0.3)',
                          border: isMe ? '1px solid var(--border-bright)' : '1px solid rgba(255,255,255,0.12)' }}>
                          {msg.fileUrl ? (
                            msg.fileType?.includes('audio') ? <VoicePlayer src={msg.fileUrl} />
                              : msg.fileType?.includes('video') ? <video src={msg.fileUrl} controls style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '10px', outline: 'none' }} />
                              : isImage(msg.fileType) ? <img src={msg.fileUrl} alt={msg.fileName} onClick={() => setFullscreenMedia({url: msg.fileUrl, type: msg.fileType})} style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '10px', display: 'block', cursor: 'zoom-in' }} />
                              : <a href={msg.fileUrl} target="_blank" rel="noreferrer" style={{ color: isMe ? 'black' : 'var(--primary)', textDecoration: 'underline' }}>📎 {msg.fileName}</a>
                          ) : msg.content}
                          {isMe && (
                            <div style={{ position: 'absolute', bottom: '8px', right: '12px', opacity: 0.8 }}>
                              <CheckCheck size={14} color={msg.isRead ? '#39ff14' : 'rgba(255,255,255,0.4)'} style={{ filter: msg.isRead ? 'drop-shadow(0 0 5px #39ff14)' : 'none' }} />
                            </div>
                          )}
                        </div>
                        {isMe && (
                          <div className="msg-actions" style={{ display: 'flex', gap: '4px', opacity: 0.6, flexShrink: 0 }}>
                            {!msg.fileUrl && (
                              <button onClick={() => handeEditClick(msg)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}><Edit2 size={14} /></button>
                            )}
                            <button onClick={() => handleDelete(msg.id)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '4px' }}><Trash2 size={14} /></button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={scrollRef} />
              </div>

              <form onSubmit={sendMessage} style={{ padding: isMobile ? '12px 16px' : '20px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={sendFile} />
                {!isRecording && (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    style={{ width: isMobile ? '44px' : '52px', height: isMobile ? '44px' : '52px', borderRadius: '50%', flexShrink: 0, background: 'color-mix(in srgb, var(--primary), transparent 92%)', border: '1px solid color-mix(in srgb, var(--primary), transparent 80%)', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Paperclip size={20} />
                  </button>
                )}
                {isRecording ? (
                  <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setIsRecording(false)} />
                ) : (
                  <>
                    <input ref={inputRef} type="text" className="input-field"
                      placeholder={editingMsgId ? "Ред..." : (isMobile ? "Текст..." : "Введите сообщение в SETI...")}
                      value={input} onChange={(e) => setInput(e.target.value)}
                      style={{ borderRadius: '20px', padding: isMobile ? '10px 16px' : '14px 24px', flex: 1, background: editingMsgId ? 'color-mix(in srgb, var(--primary), transparent 95%)' : 'rgba(255,255,255,0.03)', border: editingMsgId ? '1px solid color-mix(in srgb, var(--primary), transparent 60%)' : 'none', minWidth: 0 }} />
                    {editingMsgId && (
                      <button type="button" onClick={() => { setEditingMsgId(null); setInput(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px' }}>
                        <X size={20} />
                      </button>
                    )}
                    {input.trim() || editingMsgId ? (
                      <button type="submit" className="btn-primary" style={{ width: isMobile ? '44px' : '52px', height: isMobile ? '44px' : '52px', borderRadius: '50%', flexShrink: 0, padding: 0, justifyContent: 'center' }}>
                        <Send size={20} />
                      </button>
                    ) : (
                      <button type="button" onClick={() => setIsRecording(true)}
                        style={{ width: isMobile ? '44px' : '52px', height: isMobile ? '44px' : '52px', borderRadius: '50%', flexShrink: 0, background: 'color-mix(in srgb, var(--primary), transparent 92%)', border: '1px solid var(--border-bright)', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--glow)' }}>
                        <Mic size={20} />
                      </button>
                    )}
                  </>
                )}
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }} transition={{ repeat: Infinity, duration: 4 }}>
                <MessageSquare size={80} className="neon-text" style={{ marginBottom: '24px' }} />
              </motion.div>
              <h3 style={{ marginBottom: '8px', fontWeight: '900', fontSize: '1.4rem' }} className="neon-text">Точка доступа SETI</h3>
              <p style={{ fontSize: '1rem', letterSpacing: '0.5px' }}>Выберите частоту друга для передачи данных</p>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen media */}
      <AnimatePresence>
        {fullscreenMedia && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(10,15,30,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', backdropFilter: 'blur(30px)' }}
            onClick={() => setFullscreenMedia(null)}>
            <button style={{ position: 'absolute', top: '24px', right: '24px', background: 'color-mix(in srgb, var(--primary), transparent 90%)', border: '1px solid currentColor', color: 'var(--primary)', width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000 }}>
              <X size={28} />
            </button>
            {fullscreenMedia.type.includes('video')
              ? <video src={fullscreenMedia.url} controls autoPlay onClick={e => e.stopPropagation()} style={{ maxWidth: '90%', maxHeight: '90%', outline: 'none', borderRadius: '12px' }} />
              : <img src={fullscreenMedia.url} alt="Fullscreen" onClick={e => e.stopPropagation()} style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain', borderRadius: '12px' }} />
            }
          </motion.div>
        )}
      </AnimatePresence>

      {/* Call Screen */}
      <AnimatePresence>
        {callState !== 'idle' && callFriend && (
          <CallScreen
            friend={callFriend}
            isVideo={callIsVideo}
            isIncoming={callState === 'incoming'}
            onAccept={acceptCall}
            onDecline={endCall}
            onEnd={endCall}
            localStream={localStream}
            remoteStream={remoteStream}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
