import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useCall } from '../context/CallContext';
import { Send, Search, ArrowLeft, MessageSquare, Paperclip, Mic, Edit2, Trash2, X, Play, Pause, CheckCheck, Trash, Phone, Video, Plus, Users, Shield, Info, Settings, FileText, LogOut, Archive, Inbox } from 'lucide-react';
// ... rest of the imports and components ...
// (Note: I will only replace the specific block but I need to make sure Shield is in imports)


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



// ─── Swipeable Chat Item ────────────────────────────────────────────────────
interface SwipeableChatItemProps {
  children: React.ReactNode;
  onAction: () => void;
  actionIcon: React.ReactNode;
  type: 'archive' | 'unarchive';
}

const SwipeableChatItem = ({ children, onAction, actionIcon, type }: SwipeableChatItemProps) => {
  const controls = useAnimation();
  const [isSwiping, setIsSwiping] = useState(false);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x < -80) {
      onAction();
      controls.start({ x: 0 });
    } else {
      controls.start({ x: 0 });
    }
    setTimeout(() => setIsSwiping(false), 100);
  };

  return (
    <div style={{ position: 'relative', marginBottom: '8px', overflow: 'hidden', borderRadius: '16px' }}>
      {/* Background Action Layer */}
      <div className={`swipe-action-bg ${type}`} style={{ opacity: isSwiping ? 1 : 0.4 }}>
        <div style={{ color: 'white', marginRight: '-40px' }}>
          {actionIcon}
        </div>
      </div>

      {/* Foreground Draggable Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        animate={controls}
        onDragStart={() => setIsSwiping(true)}
        onDragEnd={handleDragEnd}
        style={{ position: 'relative', zIndex: 2, touchAction: 'pan-y' }}
      >
        {children}
      </motion.div>
    </div>
  );
};
export const MessagesPage = () => {
  const { user } = useAuth();
  const { ws, lastMessage } = useNotifications();
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isRecording, setIsRecording] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<number | null>(null);
  const [fullscreenMedia, setFullscreenMedia] = useState<{url: string, type: string} | null>(null);
  const [showCreateCluster, setShowCreateCluster] = useState(false);
  const [newClusterName, setNewClusterName] = useState('');
  const [selectedFriendsForCluster, setSelectedFriendsForCluster] = useState<number[]>([]);
  
  // Media Gallery & Admin
  const [galleryMedia, setGalleryMedia] = useState<any[]>([]);
  const [galleryFilter, setGalleryFilter] = useState<'photo'|'video'|'file'>('photo');
  const [showAddMember, setShowAddMember] = useState(false);
  const [friendsToAdd, setFriendsToAdd] = useState<number[]>([]);
  
  const location = useLocation();
  const { startCall } = useCall();

  // Info Drawer & Settings
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [infoTab, setInfoTab] = useState<'info'|'gallery'|'members'|'settings'>('info');
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');
  const [editGroupAvatar, setEditGroupAvatar] = useState('');
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);
  const [viewArchived, setViewArchived] = useState(false);

  // Keyboard/Viewport height fix for mobile
  const [vh, setVh] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setVh(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const archiveConversation = async (type: 'friend'|'group', id: number, archived: boolean) => {
    try {
      await api.post('/conversations/archive', { type, id, archived });
      if (type === 'friend') {
        setFriends(friends.map(f => f.id === id ? { ...f, isArchived: archived } : f));
      } else {
        setGroups(groups.map(g => g.id === id ? { ...g, isArchived: archived } : g));
      }
      if (archived && ((selectedFriend?.id === id && type === 'friend') || (selectedGroup?.id === id && type === 'group'))) {
        setSelectedFriend(null);
        setSelectedGroup(null);
      }
    } catch {
      alert('Ошибка при архивации');
    }
  };

  useEffect(() => {
    if (selectedGroup) {
      setEditGroupName(selectedGroup.name);
      setEditGroupDesc(selectedGroup.description || '');
      setEditGroupAvatar(selectedGroup.avatar || '');
    }
  }, [selectedGroup]);


  useEffect(() => {
    if (!lastMessage) return;
    const data = lastMessage;
    const action = data.action || 'send';
    const msg = data.message || data;
    setMessages(prev => {
      if (action === 'delete') return prev.filter(m => m.id !== msg.id);
      if (action === 'edit') return prev.map(m => m.id === msg.id ? { ...m, content: msg.content } : m);
      if (action === 'read_receipt') {
        if (selectedFriend && data.senderId === selectedFriend.id) return prev.map(m => m.receiverId === data.senderId ? { ...m, isRead: true } : m);
        return prev;
      }
      const inDirectChat = selectedFriend && (msg.senderId === selectedFriend.id || msg.receiverId === selectedFriend.id) && !msg.groupId;
      const inGroupChat = selectedGroup && msg.groupId === selectedGroup.id;
      
      if ((inDirectChat || inGroupChat) && msg.senderId !== user?.id) {
        if (selectedFriend) markAsRead(selectedFriend.id);
      }
      
      if ((inDirectChat || inGroupChat) && prev.some(m => m.id === msg.id && action === 'send')) return prev;
      return (inDirectChat || inGroupChat) ? [...prev, msg] : prev;
    });
  }, [lastMessage, selectedFriend, selectedGroup, friends, user]);

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

  const fetchInitialData = async () => {
    try {
      const [fRes, gRes] = await Promise.all([
        api.get('/friends'),
        api.get('/groups')
      ]);
      setFriends(fRes.data || []);
      setGroups(gRes.data || []);
    } catch {}
  };

  useEffect(() => { fetchInitialData(); }, []);

  useEffect(() => {
    if (selectedFriend) {
      setSelectedGroup(null);
      api.get(`/messages/${selectedFriend.id}`).then(res => { setMessages(res.data || []); markAsRead(selectedFriend.id); });
    }
  }, [selectedFriend]);

  useEffect(() => {
    if (selectedGroup) {
      setSelectedFriend(null);
      api.get(`/groups/${selectedGroup.id}/messages`).then(res => { setMessages(res.data || []); });
    }
  }, [selectedGroup]);

  const markAsRead = (friendId: number) => {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: 'read', receiverId: friendId }));
  };

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ws || !input.trim() || (!selectedFriend && !selectedGroup)) return;
    
    const payload: any = {
      action: editingMsgId ? 'edit' : 'send',
      content: input,
      messageId: editingMsgId
    };

    if (selectedFriend) payload.receiverId = selectedFriend.id;
    if (selectedGroup) payload.groupId = selectedGroup.id;

    ws.send(JSON.stringify(payload));
    
    if (editingMsgId) setEditingMsgId(null);
    setInput('');
    inputRef.current?.focus();
  };

  const handleVoiceSend = async (blob: Blob) => {
    setIsRecording(false);
    if ((!selectedFriend && !selectedGroup) || !ws) return;
    const fd = new FormData();
    fd.append('file', blob, `voice-${Date.now()}.webm`);
    try {
      const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const payload: any = { action: 'send', content: '', fileUrl: r.data.url, fileName: 'Голосовое сообщение.webm', fileType: 'audio/webm' };
      if (selectedFriend) payload.receiverId = selectedFriend.id;
      if (selectedGroup) payload.groupId = selectedGroup.id;
      ws.send(JSON.stringify(payload));
    } catch { alert('Ошибка отправки голосового сообщения'); }
  };

  const handleDelete = (msgId: number) => {
    if (!ws || (!selectedFriend && !selectedGroup)) return;
    if (confirm('Удалить сообщение?')) {
      const payload: any = { action: 'delete', messageId: msgId };
      if (selectedFriend) payload.receiverId = selectedFriend.id;
      if (selectedGroup) payload.groupId = selectedGroup.id;
      ws.send(JSON.stringify(payload));
    }
  };

  const handeEditClick = (msg: any) => { setEditingMsgId(msg.id); setInput(msg.content); inputRef.current?.focus(); };

  const sendFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || (!selectedFriend && !selectedGroup) || !ws) return;
    const fd = new FormData();
    fd.append('file', e.target.files[0]);
    try {
      const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const payload: any = { action: 'send', content: '', fileUrl: r.data.url, fileName: r.data.fileName, fileType: r.data.fileType };
      if (selectedFriend) payload.receiverId = selectedFriend.id;
      if (selectedGroup) payload.groupId = selectedGroup.id;
      ws.send(JSON.stringify(payload));
    } catch { alert('Ошибка загрузки файла'); }
    e.target.value = '';
  };

  const guessTypeFromUrl = (url?: string): string => {
    if (!url) return '';
    const ext = url.split('.').pop()?.toLowerCase() || '';
    if (['jpg','jpeg','png','gif','webp','svg','bmp','heic'].includes(ext)) return 'image/' + ext;
    if (['mp4','mov','avi','webm','mkv','m4v','3gp'].includes(ext)) return 'video/' + ext;
    return 'application/octet-stream';
  };

  const isImage = (type?: string, url?: string) => {
    const t = type || guessTypeFromUrl(url);
    return t.startsWith('image/');
  };
  const isVideo = (type?: string, url?: string) => {
    const t = type || guessTypeFromUrl(url);
    return t.startsWith('video/');
  };
  const isDoc = (type?: string, url?: string) => !isImage(type, url) && !isVideo(type, url);

  const showList = !isMobile || (!selectedFriend && !selectedGroup);
  const showChat = !isMobile || selectedFriend || selectedGroup;

  const fetchGallery = async () => {
    if (!selectedFriend && !selectedGroup) return;
    try {
      const params = selectedGroup ? { groupId: selectedGroup.id } : { receiverId: selectedFriend.id };
      const res = await api.get('/messages/media', { params });
      setGalleryMedia(res.data || []);
    } catch {
      alert('Ошибка доступа к архиву');
    }
  };

  useEffect(() => {
    if (showInfoDrawer && infoTab === 'gallery') {
      fetchGallery();
    }
  }, [showInfoDrawer, infoTab, selectedFriend, selectedGroup]);

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    setIsUpdatingGroup(true);
    try {
      const res = await api.put(`/groups/${selectedGroup.id}`, {
        name: editGroupName,
        description: editGroupDesc,
        avatar: editGroupAvatar
      });
      setSelectedGroup(res.data);
      setGroups(groups.map(g => g.id === res.data.id ? res.data : g));
      setInfoTab('info');
    } catch {
      alert('Ошибка обновления');
    }
    setIsUpdatingGroup(false);
  };

  const addMembersToCluster = async () => {
    if (!selectedGroup || friendsToAdd.length === 0) return;
    try {
      await api.post(`/groups/${selectedGroup.id}/members`, { memberIds: friendsToAdd });
      setShowAddMember(false);
      setFriendsToAdd([]);
      // Maybe refresh group list or show success
    } catch {
      alert('Ошибка при расширении Кластера');
    }
  };

  const createCluster = async () => {
    if (!newClusterName.trim()) return;
    try {
      const res = await api.post('/groups', {
        name: newClusterName,
        memberIds: selectedFriendsForCluster
      });
      setGroups([res.data, ...groups]);
      setShowCreateCluster(false);
      setNewClusterName('');
      setSelectedFriendsForCluster([]);
      setSelectedGroup(res.data);
    } catch {
      alert('Ошибка при создании Кластера');
    }
  };

  const containerHeight = isMobile ? `${vh - 70}px` : 'calc(100vh - 140px)';

  return (
    <div style={{ height: containerHeight, display: 'flex', gap: isMobile ? '0' : '16px', position: 'relative' }}>

      {showList && (
        <div className="glass-panel" style={{ 
          width: isMobile ? '100%' : '320px', 
          flexShrink: 0, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden',
          borderRadius: isMobile ? '0' : '24px'
        }}>
          <div style={{ padding: isMobile ? '20px 24px' : '24px', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '0' : '18px' }}>
              <h2 style={{ fontSize: isMobile ? '1.4rem' : '1.6rem', fontWeight: '900' }} className="neon-text">Каналы</h2>
              {isMobile && (
                 <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowCreateCluster(true)}
                  style={{ background: 'color-mix(in srgb, var(--primary), transparent 90%)', border: '1px solid var(--primary)', color: 'var(--primary)', width: '36px', height: '36px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={20} />
                </motion.button>
              )}
            </div>
            {!isMobile && (
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input type="text" className="input-field" placeholder="Поиск сигналов..." style={{ paddingLeft: '44px', height: '44px', fontSize: '0.9rem' }} />
              </div>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '12px 8px' : '12px' }}>
            {/* Archive Toggle Banner */}
            {(() => {
              const archivedCount = friends.filter(f => f.isArchived).length + groups.filter(g => g.isArchived).length;
              if (archivedCount > 0 && !viewArchived) {
                return (
                  <div onClick={() => setViewArchived(true)}
                    style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', borderRadius: '18px', background: 'rgba(255,255,255,0.03)', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Archive size={20} color="var(--primary)" />
                    <div style={{ flex: 1, fontWeight: '800', fontSize: '0.95rem' }}>Архивные чаты</div>
                    <div style={{ background: 'var(--primary)', color: 'black', fontSize: '0.75rem', padding: '2px 10px', borderRadius: '12px', fontWeight: '900' }}>{archivedCount}</div>
                  </div>
                );
              }
              if (viewArchived) {
                return (
                  <div onClick={() => setViewArchived(false)}
                    style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', borderRadius: '18px', background: 'color-mix(in srgb, var(--primary), transparent 90%)', marginBottom: '16px', border: '1px solid var(--primary)' }}>
                    <Inbox size={20} color="var(--primary)" />
                    <div style={{ flex: 1, fontWeight: '800', fontSize: '0.95rem', color: 'var(--primary)' }}>Вернуться назад</div>
                  </div>
                );
              }
              return null;
            })()}

            {!isMobile && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px 12px', opacity: 0.8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--primary)' }}>Кластеры</span>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowCreateCluster(true)}
                  style={{ background: 'color-mix(in srgb, var(--primary), transparent 90%)', border: '1px solid currentColor', color: 'var(--primary)', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Plus size={14} />
                </motion.button>
              </div>
            )}
            
            {groups.filter(g => g.isArchived === viewArchived).map(group => (
               <SwipeableChatItem 
                 key={`g-${group.id}`}
                 onAction={() => archiveConversation('group', group.id, !viewArchived)}
                 actionIcon={viewArchived ? <Inbox size={24} /> : <Archive size={24} />}
                 type={viewArchived ? 'unarchive' : 'archive'}
               >
                 <div onClick={() => setSelectedGroup(group)}
                   style={{ padding: '14px 16px', display: 'flex', gap: '14px', cursor: 'pointer', alignItems: 'center', borderRadius: '18px',
                    background: selectedGroup?.id === group.id ? 'color-mix(in srgb, var(--primary), transparent 92%)' : 'transparent',
                    border: selectedGroup?.id === group.id ? '1px solid color-mix(in srgb, var(--primary), transparent 75%)' : '1px solid transparent' }}>
                   <div style={{ position: 'relative', flexShrink: 0 }}>
                     <div style={{ width: '54px', height: '54px', borderRadius: '18px', background: 'linear-gradient(45deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: selectedGroup?.id === group.id ? 'var(--glow)' : 'none' }}>
                       <Users size={26} color="black" />
                     </div>
                   </div>
                   <div style={{ flex: 1, minWidth: 0 }}>
                     <div style={{ fontWeight: '900', fontSize: '1.05rem', color: selectedGroup?.id === group.id ? 'var(--primary)' : 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.name}</div>
                     <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>Групповой поток активен</div>
                   </div>
                 </div>
               </SwipeableChatItem>
            ))}

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '12px 8px' }} />
            
            {friends.filter(f => f.isArchived === viewArchived).map(friend => (
              <SwipeableChatItem 
                key={`f-${friend.id}`}
                onAction={() => archiveConversation('friend', friend.id, !viewArchived)}
                actionIcon={viewArchived ? <Inbox size={24} /> : <Archive size={24} />}
                type={viewArchived ? 'unarchive' : 'archive'}
              >
                <div onClick={() => setSelectedFriend(friend)}
                  style={{ padding: '14px 16px', display: 'flex', gap: '14px', cursor: 'pointer', alignItems: 'center', borderRadius: '18px',
                    background: selectedFriend?.id === friend.id ? 'color-mix(in srgb, var(--primary), transparent 92%)' : 'transparent',
                    border: selectedFriend?.id === friend.id ? '1px solid color-mix(in srgb, var(--primary), transparent 75%)' : '1px solid transparent' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img src={friend.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + friend.username} 
                      alt="" style={{ width: '54px', height: '54px', borderRadius: '18px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', boxShadow: selectedFriend?.id === friend.id ? 'var(--glow)' : 'none' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '900', fontSize: '1.05rem', color: selectedFriend?.id === friend.id ? 'var(--primary)' : 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{friend.username}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>{friend.bio || 'Персональный сигнал'}</div>
                  </div>
                </div>
              </SwipeableChatItem>
            ))}

            {(friends.filter(f => f.isArchived === viewArchived).length === 0 && groups.filter(g => g.isArchived === viewArchived).length === 0) && (
              <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                {viewArchived ? <Archive size={48} style={{ marginBottom: '16px', opacity: 0.2 }} /> : <MessageSquare size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />}
                <p style={{ fontWeight: '700', letterSpacing: '0.5px' }}>{viewArchived ? 'Архив пуст' : 'Пока нет сообщений'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showChat && (
        <div className="glass-panel" style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden', 
          minWidth: 0, 
          border: isMobile ? 'none' : '1px solid var(--border)',
          borderRadius: isMobile ? '0' : '24px',
          background: isMobile ? 'var(--bg)' : 'rgba(255,255,255,0.01)',
          position: 'relative'
        }}>
          {(selectedFriend || selectedGroup) ? (
            <>
              {/* Chat header */}
              <div style={{ 
                padding: isMobile ? '12px 16px' : '16px 24px', 
                borderBottom: '1px solid var(--border-color)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(10px)',
                zIndex: 100
              }}>
                {isMobile && (
                  <button onClick={() => { setSelectedFriend(null); setSelectedGroup(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '12px' }}>
                    <ArrowLeft size={28} />
                  </button>
                )}
                
                {selectedFriend ? (
                  <>
                    <img src={selectedFriend.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + selectedFriend.username}
                      alt="avatar" style={{ width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px', borderRadius: '14px', border: '2px solid var(--primary)', boxShadow: 'var(--glow)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '900', fontSize: isMobile ? '1.1rem' : '1.25rem', color: 'white', textShadow: 'var(--glow)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFriend.username}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.9, fontWeight: '800' }}>
                        <div className="pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', boxShadow: 'var(--glow)' }}></div> ONLINE
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ width: isMobile ? '38px' : '48px', height: isMobile ? '38px' : '48px', borderRadius: '12px', background: 'linear-gradient(45deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={isMobile ? 20 : 24} color="black" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '900', fontSize: isMobile ? '1rem' : '1.2rem', color: 'var(--primary)', textShadow: 'var(--glow)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedGroup.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.8 }}>
                        <Shield size={12} /> CLUSTER STREAM
                      </div>
                    </div>
                  </>
                )}

                {/* UTILITY BUTTONS */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {!isMobile && (
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowInfoDrawer(true)}
                      style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Info size={18} />
                    </motion.button>
                  )}

                  {selectedFriend && (
                    <>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => startCall(selectedFriend, false)}
                        style={{ width: isMobile ? '38px' : '42px', height: isMobile ? '38px' : '42px', borderRadius: '12px', background: 'color-mix(in srgb, var(--primary), transparent 85%)', border: '1px solid color-mix(in srgb, var(--primary), transparent 60%)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Phone size={18} />
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => startCall(selectedFriend, true)}
                        style={{ width: isMobile ? '38px' : '42px', height: isMobile ? '38px' : '42px', borderRadius: '12px', background: 'color-mix(in srgb, var(--secondary), transparent 85%)', border: '1px solid color-mix(in srgb, var(--secondary), transparent 60%)', color: 'var(--secondary, #7b2ff7)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Video size={18} />
                      </motion.button>
                    </>
                  )}
                  
                  {isMobile && (
                     <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowInfoDrawer(true)}
                      style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Settings size={18} />
                    </motion.button>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, padding: isMobile ? '16px' : '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '80px', opacity: 0.5 }}>
                    <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }}>
                       <MessageSquare size={48} style={{ margin: '0 auto 16px' }} />
                    </motion.div>
                    <p style={{ letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: '800' }}>СЕАНС СВЯЗИ УСТАНОВЛЕН</p>
                  </div>
                )}
                  {messages.map((msg, i) => {
                    const isMe = msg.senderId === user?.id;
                    const showSender = !isMe && selectedGroup && (i === 0 || messages[i-1].senderId !== msg.senderId);
                    
                    return (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i}
                        style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: showSender ? '8px' : '0' }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '8px', flexDirection: isMe ? 'row-reverse' : 'row', maxWidth: isMobile ? '90%' : '75%', minWidth: 0 }}>
                          {!isMe && selectedGroup && (
                            <img src={msg.sender?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + msg.sender?.username} 
                              alt="" style={{ width: '30px', height: '30px', borderRadius: '10px', opacity: showSender ? 1 : 0, flexShrink: 0 }} />
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                            {showSender && <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '900', marginLeft: '4px', marginBottom: '4px', letterSpacing: '0.5px' }}>{msg.sender?.username}</span>}
                             <div style={{ 
                               padding: isMobile ? '12px 16px' : '14px 22px', 
                               borderRadius: isMe ? '24px 24px 6px 24px' : '24px 24px 24px 6px',
                               background: isMe ? 'linear-gradient(135deg, color-mix(in srgb, var(--primary), transparent 70%), color-mix(in srgb, var(--secondary), transparent 70%))' : 'rgba(255,255,255,0.08)',
                               color: 'white', 
                               fontSize: isMobile ? '0.95rem' : '1.1rem', 
                               lineHeight: '1.5',
                               fontWeight: '600',
                               boxShadow: isMe ? 'var(--glow)' : '0 10px 30px rgba(0,0,0,0.3)',
                               border: '1px solid rgba(255,255,255,0.1)',
                               wordBreak: 'break-word',
                               position: 'relative',
                               backdropFilter: isMe ? 'none' : 'blur(10px)'
                             }}>
                              {msg.fileUrl ? (
                                msg.fileType?.includes('audio') ? <VoicePlayer src={msg.fileUrl} />
                                  : isVideo(msg.fileType, msg.fileUrl) ? <video src={msg.fileUrl} controls style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '12px' }} />
                                  : isImage(msg.fileType, msg.fileUrl) ? <img src={msg.fileUrl} alt={msg.fileName} onClick={() => setFullscreenMedia({url: msg.fileUrl, type: msg.fileType || guessTypeFromUrl(msg.fileUrl)})} style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '12px', display: 'block', cursor: 'zoom-in' }} />
                                  : <a href={msg.fileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline', fontWeight: '800' }}>📎 {msg.fileName || 'Файл'}</a>
                              ) : msg.content}
                              
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginTop: '4px', opacity: 0.5, fontSize: '0.65rem', fontWeight: '900' }}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {isMe && !selectedGroup && (
                                  <CheckCheck size={12} color={msg.isRead ? 'var(--primary)' : 'white'} />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                <div ref={scrollRef} />
              </div>

              <form onSubmit={sendMessage} style={{ 
                padding: isMobile ? '12px' : '20px 24px', 
                borderTop: '1px solid var(--border-color)', 
                display: 'flex', 
                gap: '8px', 
                alignItems: 'center', 
                background: 'rgba(0,0,0,0.3)',
                paddingBottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 12px)' : '20px'
              }}>
                <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={sendFile} />
                {!isRecording && (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    style={{ width: isMobile ? '42px' : '52px', height: isMobile ? '42px' : '52px', borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Paperclip size={20} />
                  </button>
                )}
                {isRecording ? (
                  <VoiceRecorder onSend={handleVoiceSend} onCancel={() => setIsRecording(false)} />
                ) : (
                  <>
                    <input ref={inputRef} type="text" className="input-field"
                      placeholder={editingMsgId ? "Редактирование..." : "Сообщение..."}
                      value={input} onChange={(e) => setInput(e.target.value)}
                      style={{ borderRadius: '24px', padding: isMobile ? '10px 18px' : '14px 24px', flex: 1, background: 'rgba(255,255,255,0.05)', border: editingMsgId ? '1px solid var(--primary)' : 'none', minWidth: 0, height: isMobile ? '42px' : '52px' }} />
                    
                    {input.trim() || editingMsgId ? (
                      <button type="submit" className="btn-primary" style={{ width: isMobile ? '42px' : '52px', height: isMobile ? '42px' : '52px', borderRadius: '50%', flexShrink: 0, padding: 0, justifyContent: 'center' }}>
                        <Send size={20} />
                      </button>
                    ) : (
                      <button type="button" onClick={() => setIsRecording(true)}
                        style={{ width: isMobile ? '42px' : '52px', height: isMobile ? '42px' : '52px', borderRadius: '50%', flexShrink: 0, background: 'var(--primary)', border: 'none', cursor: 'pointer', color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--glow)' }}>
                        <Mic size={20} />
                      </button>
                    )}
                  </>
                )}
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
              <motion.div animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 5 }}>
                <MessageSquare size={100} style={{ marginBottom: '32px', color: 'var(--primary)', filter: 'drop-shadow(0 0 20px var(--primary))' }} />
              </motion.div>
              <h3 style={{ marginBottom: '12px', fontWeight: '900', fontSize: '1.6rem', color: 'white', textAlign: 'center' }}>ВЫБЕРИТЕ КАНАЛ СВЯЗИ</h3>
              <p style={{ fontSize: '1rem', letterSpacing: '1px', opacity: 0.6, textAlign: 'center' }}>инициализируйте поток для обмена данными</p>
            </div>
          )}
        </div>
      )}

      {/* Media Fullscreen & Other Modals remain similar but with mobile-optimized padding/scaling */}

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

      {/* NEW CLUSTER MODAL */}
      <AnimatePresence>
        {showCreateCluster && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} 
              className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '32px', border: '1px solid var(--border-bright)', boxShadow: 'var(--glow-strong)' }}>
              <h2 style={{ marginBottom: '24px', fontSize: '1.5rem', fontWeight: '900' }} className="neon-text">Новый Кластер</h2>
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary)' }}>Имя Кластера</label>
                <input type="text" className="input-field" placeholder="Введите название..." value={newClusterName} onChange={e => setNewClusterName(e.target.value)} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary)' }}>Пригласить (необязательно)</label>
                <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {friends.map(f => (
                    <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', transition: 'background 0.2s' }} 
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <input type="checkbox" checked={selectedFriendsForCluster.includes(f.id)} 
                        onChange={e => {
                          if (e.target.checked) setSelectedFriendsForCluster([...selectedFriendsForCluster, f.id]);
                          else setSelectedFriendsForCluster(selectedFriendsForCluster.filter(id => id !== f.id));
                        }}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                      <img src={f.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + f.username} style={{ width: '32px', height: '32px', borderRadius: '10px' }} />
                      <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{f.username}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setShowCreateCluster(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>Отмена</button>
                <button onClick={createCluster} className="btn-primary" style={{ flex: 1, padding: '12px', borderRadius: '12px', justifyContent: 'center' }}>Создать</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ADD MEMBER MODAL */}
      <AnimatePresence>
        {showAddMember && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} 
              className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '32px', border: '1px solid var(--border-bright)', boxShadow: 'var(--glow-strong)' }}>
              <h2 style={{ marginBottom: '24px', fontSize: '1.5rem', fontWeight: '900' }} className="neon-text">Расширить Кластер</h2>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary)' }}>Выберите новые узлы</label>
                <div style={{ maxHeight: '250px', overflowY: 'auto', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {friends.filter(f => !selectedGroup?.members?.some((m: any) => m.userId === f.id)).map(f => (
                    <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={friendsToAdd.includes(f.id)} 
                        onChange={e => {
                          if (e.target.checked) setFriendsToAdd([...friendsToAdd, f.id]);
                          else setFriendsToAdd(friendsToAdd.filter(id => id !== f.id));
                        }}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                      <img src={f.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + f.username} style={{ width: '32px', height: '32px', borderRadius: '10px' }} />
                      <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{f.username}</span>
                    </label>
                  ))}
                  {friends.filter(f => !selectedGroup?.members?.some((m: any) => m.userId === f.id)).length === 0 && (
                    <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Нет доступных узлов для подключения</p>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setShowAddMember(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: '700', cursor: 'pointer' }}>Отмена</button>
                <button onClick={addMembersToCluster} className="btn-primary" style={{ flex: 1, padding: '12px', borderRadius: '12px', justifyContent: 'center' }}>Подключить</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHAT INFO DRAWER */}
      <AnimatePresence>
        {showInfoDrawer && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 6000, overflow: 'hidden' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowInfoDrawer(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(15px)' }} />
            
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '400px', background: 'rgba(5, 7, 12, 0.95)', borderLeft: '1px solid var(--border-bright)', display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 50px rgba(0,0,0,0.5)' }}>
              
              <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button onClick={() => setShowInfoDrawer(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <ArrowLeft size={24} />
                </button>
                <div style={{ fontWeight: '900', fontSize: '1.2rem' }} className="neon-text">Информация</div>
              </div>

              <div style={{ padding: '32px 24px', textAlign: 'center', background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)' }}>
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
                  {selectedFriend ? (
                    <img src={selectedFriend.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + selectedFriend.username} style={{ width: '100px', height: '100px', borderRadius: '35px', border: '3px solid var(--primary)', boxShadow: 'var(--glow-strong)' }} />
                  ) : (
                    <div style={{ width: '100px', height: '100px', borderRadius: '35px', background: 'linear-gradient(45deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--glow-strong)' }}>
                      <Users size={40} color="black" />
                    </div>
                  )}
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '4px' }}>{selectedFriend?.username || selectedGroup?.name}</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '16px' }}>
                  {selectedFriend ? 'Узел активен' : 'Кластер вещания'}
                </div>
                {(selectedFriend?.bio || selectedGroup?.description) && (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', maxWidth: '300px', margin: '0 auto' }}>
                    {selectedFriend?.bio || selectedGroup?.description}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', padding: '0 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {[
                  { id: 'info', label: 'Данные', icon: Info },
                  { id: 'gallery', label: 'Архив', icon: Paperclip },
                  ...(selectedGroup ? [{ id: 'members', label: 'Узлы', icon: Users }] : []),
                  ...(selectedGroup && selectedGroup.ownerId === user?.id ? [{ id: 'settings', label: 'Настр.', icon: Settings }] : [])
                ].map(tab => (
                  <button key={tab.id} onClick={() => setInfoTab(tab.id as any)}
                    style={{ flex: 1, padding: '14px 0', background: 'none', border: 'none', borderBottom: infoTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent', color: infoTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', opacity: infoTab === tab.id ? 1 : 0.6, transition: 'all 0.2s' }}>
                    <tab.icon size={18} />
                    <span style={{ fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase' }}>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {infoTab === 'info' && (
                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}>Протокол</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>{selectedFriend ? 'SIGNAL_P2P' : 'CLUSTER_BROADCAST'}</div>
                        </div>
                        <Shield size={20} color="var(--primary)" />
                      </div>
                      <div className="glass-panel" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                         <div style={{ flex: 1 }}>
                           <div style={{ fontSize: '0.7rem', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}>Статус</div>
                           <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>Синхронизирован</div>
                         </div>
                         <div className="pulse" style={{ width: '10px', height: '10px', background: 'var(--primary)', boxShadow: 'var(--glow)' }} />
                      </div>
                    </div>
                  </div>
                )}

                {infoTab === 'gallery' && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                     <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', background: 'rgba(0,0,0,0.2)' }}>
                        {['photo', 'video', 'file'].map(type => (
                          <button key={type} onClick={() => setGalleryFilter(type as any)}
                            style={{ flex: 1, padding: '8px', borderRadius: '10px', background: galleryFilter === type ? 'var(--primary)' : 'rgba(255,255,255,0.03)', border: 'none', color: galleryFilter === type ? 'black' : 'white', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer' }}>
                            {type === 'photo' ? 'СИГНАЛЫ' : type === 'video' ? 'ЭФИРЫ' : 'ДАННЫЕ'}
                          </button>
                        ))}
                     </div>
                     <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: galleryFilter === 'file' ? '1fr' : 'repeat(3, 1fr)', gap: '8px' }}>
                        {(() => {
                          const filtered = galleryMedia.filter(m => {
                            if (galleryFilter === 'photo') return isImage(m.fileType, m.fileUrl);
                            if (galleryFilter === 'video') return isVideo(m.fileType, m.fileUrl);
                            return isDoc(m.fileType, m.fileUrl);
                          });
                          if (filtered.length === 0) return (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                              <div style={{ marginBottom: '8px', opacity: 0.4, fontSize: '2rem' }}>{galleryFilter === 'photo' ? '🖼️' : galleryFilter === 'video' ? '🎬' : '📎'}</div>
                              Архив пуст
                            </div>
                          );
                          return filtered.map((m, idx) =>
                            galleryFilter === 'file' ? (
                              <a key={idx} href={m.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <FileText size={18} color="var(--primary)" />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ color: 'white', fontWeight: '700', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.fileName || m.fileUrl?.split('/').pop()}</div>
                                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.6rem' }}>{new Date(m.createdAt).toLocaleDateString()}</div>
                                </div>
                              </a>
                            ) : (
                              <div key={idx} onClick={() => setFullscreenMedia({ url: m.fileUrl, type: m.fileType || guessTypeFromUrl(m.fileUrl) })} 
                                style={{ aspectRatio: '1/1', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', position: 'relative', background: 'rgba(255,255,255,0.05)' }}>
                                {isImage(m.fileType, m.fileUrl)
                                  ? <img src={m.fileUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : <video src={m.fileUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                              </div>
                            )
                          );
                        })()}
                     </div>
                  </div>
                )}

                {infoTab === 'members' && selectedGroup && (
                  <div style={{ padding: '16px' }}>
                    <button onClick={() => setShowAddMember(true)} className="btn-primary" style={{ width: '100%', marginBottom: '20px', borderRadius: '14px', justifyContent: 'center' }}>
                      <Plus size={18} /> Подключить узел
                    </button>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedGroup.members?.map((m: any) => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px' }}>
                          <img src={m.user?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + m.user?.username} style={{ width: '36px', height: '36px', borderRadius: '12px' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{m.user?.username}</div>
                            <div style={{ fontSize: '0.7rem', color: m.role === 'owner' ? 'var(--primary)' : 'var(--text-secondary)' }}>{m.role === 'owner' ? 'Главный узел' : 'Активный узел'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {infoTab === 'settings' && selectedGroup && (
                  <form onSubmit={handleUpdateGroup} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px' }}>Идентификатор</label>
                      <input className="input-field" value={editGroupName} onChange={e => setEditGroupName(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px' }}>Описание</label>
                      <textarea className="input-field" rows={3} style={{ resize: 'none' }} value={editGroupDesc} onChange={e => setEditGroupDesc(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px' }}>Аватар URL</label>
                      <input className="input-field" value={editGroupAvatar} onChange={e => setEditGroupAvatar(e.target.value)} />
                    </div>
                    <button type="submit" disabled={isUpdatingGroup} className="btn-primary" style={{ width: '100%', borderRadius: '14px', justifyContent: 'center' }}>
                      {isUpdatingGroup ? 'Синхронизация...' : 'Применить изменения'}
                    </button>
                  </form>
                )}
              </div>

              <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button onClick={() => { 
                  if (selectedGroup) api.post(`/groups/${selectedGroup.id}/leave`).then(() => { setSelectedGroup(null); fetchInitialData(); setShowInfoDrawer(false); });
                }} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,70,70,0.1)', border: '1px solid rgba(255,70,70,0.2)', color: '#ff4646', fontWeight: '800', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <LogOut size={18} /> {selectedFriend ? 'Прервать связь' : 'Покинуть кластер'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
};
