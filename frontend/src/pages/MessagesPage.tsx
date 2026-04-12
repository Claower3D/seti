import React, { useState, useEffect, useRef } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Send, Search, MoreVertical, MessageSquare } from 'lucide-react';

export const MessagesPage = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await api.get('/friends');
        setFriends(res.data || []);
      } catch (err) {
        setFriends([]);
      }
    };
    fetchFriends();
  }, []);

  useEffect(() => {
    if (user && user.id) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(`${protocol}//${window.location.host}/ws?userId=${user.id}`);
      socket.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (selectedFriend && (msg.senderId === selectedFriend.id || msg.receiverId === selectedFriend.id)) {
            setMessages(prev => [...prev, msg]);
        }
      };
      setWs(socket);
      return () => socket.close();
    }
  }, [user, selectedFriend]);

  useEffect(() => {
    if (selectedFriend) {
      const fetchMessages = async () => {
        const res = await api.get(`/messages/${selectedFriend.id}`);
        setMessages(res.data);
      };
      fetchMessages();
    }
  }, [selectedFriend]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (ws && input.trim() && selectedFriend) {
      ws.send(JSON.stringify({
        receiverId: selectedFriend.id,
        content: input
      }));
      setInput('');
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', height: 'calc(100vh - 180px)', overflow: 'hidden' }}>
      {/* Chats Sidebar */}
      <div style={{ width: '320px', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
          <h2 style={{ marginBottom: '20px' }}>Диалоги</h2>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} />
            <input type="text" className="input-field" placeholder="Поиск чатов..." style={{ paddingLeft: '40px', padding: '10px 10px 10px 40px' }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {friends.map(friend => (
            <div 
              key={friend.id}
              onClick={() => setSelectedFriend(friend)}
              style={{ 
                padding: '16px 24px', 
                display: 'flex', 
                gap: '12px', 
                cursor: 'pointer',
                background: selectedFriend?.id === friend.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                borderLeft: selectedFriend?.id === friend.id ? '4px solid var(--primary-color)' : '4px solid transparent',
              }}
            >
              <img src={friend.avatar} alt="avatar" style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold' }}>{friend.username}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Нажмите, чтобы начать общение
                </div>
              </div>
            </div>
          ))}
          {friends.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Нет доступных чатов
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedFriend ? (
          <>
            <div style={{ padding: '16px 30px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img src={selectedFriend.avatar} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
                <div>
                  <div style={{ fontWeight: 'bold' }}>{selectedFriend.username}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)' }}>Online</div>
                </div>
              </div>
              <MoreVertical size={20} color="var(--text-secondary)" cursor="pointer" />
            </div>

            <div style={{ flex: 1, padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.map((msg, i) => (
                <div 
                  key={i}
                  style={{ 
                    alignSelf: msg.senderId === user?.id ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                    padding: '12px 18px',
                    borderRadius: msg.senderId === user?.id ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    background: msg.senderId === user?.id ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                >
                  {msg.content}
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <form onSubmit={sendMessage} style={{ padding: '20px 30px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '16px' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Ваше сообщение..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }}>
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <MessageSquare size={64} style={{ marginBottom: '20px', opacity: 0.3 }} />
            <h3>Выберите чат, чтобы начать общение</h3>
          </div>
        )}
      </div>
    </div>
  );
};
