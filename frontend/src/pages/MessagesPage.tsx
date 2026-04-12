import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Send, Search, ArrowLeft, MessageSquare } from 'lucide-react';

export const MessagesPage = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

  const showList = !isMobile || !selectedFriend;
  const showChat = !isMobile || selectedFriend;

  return (
    <div style={{ height: 'calc(100vh - 140px)', display: 'flex', gap: '16px' }}>

      {/* Friends list */}
      {showList && (
        <div className="glass-panel" style={{ width: isMobile ? '100%' : '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ marginBottom: '14px', fontSize: '1.2rem' }}>Сообщения</h2>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-secondary)' }} />
              <input type="text" className="input-field" placeholder="Поиск..." style={{ paddingLeft: '38px', padding: '10px 10px 10px 38px', fontSize: '0.9rem' }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {friends.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <MessageSquare size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <p>Нет диалогов</p>
              </div>
            ) : friends.map(friend => (
              <div key={friend.id} onClick={() => setSelectedFriend(friend)}
                style={{ padding: '14px 20px', display: 'flex', gap: '12px', cursor: 'pointer', alignItems: 'center',
                  background: selectedFriend?.id === friend.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                  borderLeft: selectedFriend?.id === friend.id ? '3px solid var(--primary-color)' : '3px solid transparent',
                  transition: 'all 0.2s' }}>
                <div style={{ position: 'relative' }}>
                  <img src={friend.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + friend.username}
                    alt="avatar" style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 1, right: 1, width: '11px', height: '11px', background: '#22c55e', borderRadius: '50%', border: '2px solid var(--bg-color)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{friend.username}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Нажмите чтобы написать</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat window */}
      {showChat && (
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {selectedFriend ? (
            <>
              {/* Chat header */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {isMobile && (
                  <button onClick={() => setSelectedFriend(null)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex' }}>
                    <ArrowLeft size={22} />
                  </button>
                )}
                <img src={selectedFriend.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + selectedFriend.username}
                  alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                <div>
                  <div style={{ fontWeight: '700' }}>{selectedFriend.username}</div>
                  <div style={{ fontSize: '0.75rem', color: '#22c55e' }}>● Online</div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px' }}>
                    <p>Начните общение 👋</p>
                  </div>
                )}
                {messages.map((msg, i) => {
                  const isMe = msg.senderId === user?.id;
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '75%',
                        padding: '10px 14px',
                        borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: isMe ? 'linear-gradient(135deg, var(--primary-color), #8b5cf6)' : 'rgba(255,255,255,0.07)',
                        color: 'white',
                        fontSize: '0.95rem',
                        lineHeight: '1.4',
                        wordBreak: 'break-word',
                        boxShadow: isMe ? '0 4px 12px rgba(99,102,241,0.3)' : '0 2px 8px rgba(0,0,0,0.2)'
                      }}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input ref={inputRef} type="text" className="input-field"
                  placeholder="Написать сообщение..."
                  value={input} onChange={(e) => setInput(e.target.value)}
                  style={{ borderRadius: '50px', padding: '12px 20px' }} />
                <button type="submit" className="btn-primary"
                  style={{ padding: '12px 16px', borderRadius: '50px', flexShrink: 0 }}>
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              <MessageSquare size={64} style={{ marginBottom: '16px', opacity: 0.2 }} />
              <h3 style={{ marginBottom: '8px' }}>Выберите диалог</h3>
              <p style={{ fontSize: '0.9rem' }}>Нажмите на друга слева чтобы начать общение</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};