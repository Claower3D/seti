import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Send, Search, ArrowLeft, MessageSquare, Paperclip } from 'lucide-react';

export const MessagesPage = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    api.get('/friends').then(res => setFriends(res.data || [])).catch(() => setFriends([]));
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws?userId=${user.id}`);
    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      setMessages(prev => {
        const inChat = selectedFriend && (msg.senderId === selectedFriend.id || msg.receiverId === selectedFriend.id);
        return inChat ? [...prev, msg] : prev;
      });
    };
    setWs(socket);
    return () => socket.close();
  }, [user, selectedFriend]);

  useEffect(() => {
    if (!selectedFriend) return;
    api.get(`/messages/${selectedFriend.id}`).then(res => setMessages(res.data || []));
  }, [selectedFriend]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ws || !input.trim() || !selectedFriend) return;
    ws.send(JSON.stringify({ receiverId: selectedFriend.id, content: input }));
    setInput('');
    inputRef.current?.focus();
  };

  const sendFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selectedFriend || !ws) return;
    const fd = new FormData();
    fd.append('file', e.target.files[0]);
    try {
      const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      ws.send(JSON.stringify({
        receiverId: selectedFriend.id,
        content: '',
        fileUrl: r.data.url,
        fileName: r.data.fileName,
        fileType: r.data.fileType,
      }));
    } catch { alert('Ошибка загрузки файла'); }
    e.target.value = '';
  };

  const isImage = (type?: string) => type?.startsWith('image/');
  const showList = !isMobile || !selectedFriend;
  const showChat = !isMobile || selectedFriend;

  return (
    <div style={{ height: 'calc(100vh - 140px)', display: 'flex', gap: '16px' }}>

      {showList && (
        <div className="glass-panel" style={{ width: isMobile ? '100%' : '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: isMobile ? '' : '1px solid var(--border-color)' }}>
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
                  background: selectedFriend?.id === friend.id ? 'rgba(0,245,255,0.08)' : 'transparent',
                  border: selectedFriend?.id === friend.id ? '1px solid rgba(0,245,255,0.2)' : '1px solid transparent',
                  transition: 'all 0.3s', marginBottom: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <img src={friend.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + friend.username}
                    alt="avatar" style={{ width: '52px', height: '52px', borderRadius: '18px', objectFit: 'cover', border: selectedFriend?.id === friend.id ? '2px solid #00f5ff' : '2px solid transparent' }} />
                  <div style={{ position: 'absolute', bottom: -2, right: -2, width: '12px', height: '12px', background: '#00ff00', borderRadius: '50%', border: '2px solid var(--bg-color)', boxShadow: '0 0 10px #00ff00' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '800', fontSize: '1rem', color: selectedFriend?.id === friend.id ? '#00f5ff' : 'white' }}>{friend.username}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Установлено соединение...</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showChat && (
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, border: '1px solid rgba(0,245,255,0.1)' }}>
          {selectedFriend ? (
            <>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.02)' }}>
                {isMobile && (
                  <button onClick={() => setSelectedFriend(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px', display: 'flex', borderRadius: '12px' }}>
                    <ArrowLeft size={24} />
                  </button>
                )}
                <img src={selectedFriend.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + selectedFriend.username}
                  alt="avatar" style={{ width: '44px', height: '44px', borderRadius: '14px', border: '2px solid #00f5ff' }} />
                <div>
                  <div style={{ fontWeight: '900', fontSize: '1.1rem', color: '#00f5ff' }}>{selectedFriend.username}</div>
                  <div style={{ fontSize: '0.8rem', color: '#00ff00', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div className="pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff00' }}></div> Online Signal
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', background: 'radial-gradient(circle at 50% 50%, rgba(0,242,255,0.02) 0%, transparent 100%)' }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '60px' }}>
                    <p style={{ letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.8rem' }}>Инициализация сеанса связи 👋</p>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <motion.div
                      initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={i}
                      style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '70%', padding: '12px 18px',
                        borderRadius: isMe ? '22px 22px 4px 22px' : '22px 22px 22px 4px',
                        background: isMe ? 'linear-gradient(135deg, rgba(0,245,255,0.3), rgba(180,0,255,0.3))' : 'rgba(255,255,255,0.08)',
                        color: isMe ? '#ffffff' : '#e8f4f8', fontSize: '1rem', lineHeight: '1.5',
                        wordBreak: 'break-word', fontWeight: isMe ? '700' : '500',
                        boxShadow: isMe ? '0 0 15px rgba(0,245,255,0.3), 0 0 30px rgba(0,245,255,0.1)' : '0 0 15px rgba(180,0,255,0.2), 0 4px 20px rgba(0,0,0,0.3)',
                        border: isMe ? '1px solid rgba(0,245,255,0.4)' : '1px solid rgba(255,255,255,0.12)'
                      }}>
                        {msg.fileUrl ? (
                          isImage(msg.fileType)
                            ? <img src={`http://localhost:8080${msg.fileUrl}`} alt={msg.fileName} style={{ maxWidth: '240px', borderRadius: '10px', display: 'block' }} />
                            : <a href={`http://localhost:8080${msg.fileUrl}`} target="_blank" rel="noreferrer"
                                style={{ color: isMe ? 'black' : '#00f5ff', textDecoration: 'underline' }}>
                                📎 {msg.fileName}
                              </a>
                        ) : msg.content}
                      </div>
                    </motion.div>
                  );
                })}
                <div ref={scrollRef} />
              </div>

              <form onSubmit={sendMessage} style={{ padding: '20px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
                <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={sendFile} />
                <button type="button" onClick={() => fileRef.current?.click()}
                  style={{ width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0, background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)', cursor: 'pointer', color: '#00f5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Paperclip size={20} />
                </button>
                <input ref={inputRef} type="text" className="input-field"
                  placeholder="Введите сообщение в SETI..."
                  value={input} onChange={(e) => setInput(e.target.value)}
                  style={{ borderRadius: '20px', padding: '14px 24px', flex: 1, background: 'rgba(255,255,255,0.03)' }} />
                <button type="submit" className="btn-primary"
                  style={{ width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0, padding: 0, justifyContent: 'center' }}>
                  <Send size={22} />
                </button>
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
    </div>
  );
};


