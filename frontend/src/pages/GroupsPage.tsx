import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Search, Send, ArrowLeft, LogIn, X } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

interface Group { id: number; name: string; description: string; avatar: string; ownerId: number; members: any[]; }
interface Message { id: number; senderId: number; groupId: number; content: string; fileUrl?: string; fileName?: string; fileType?: string; createdAt: string; }

export const GroupsPage = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selected, setSelected] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Group[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const ws = useRef<WebSocket | null>(null);

  const fetchGroups = async () => {
    try { const r = await api.get('/groups'); setGroups(r.data || []); } catch { setGroups([]); }
  };

  useEffect(() => { fetchGroups(); }, []);

  useEffect(() => {
    if (!selected) return;
    api.get(`/groups/${selected.id}/messages`).then(r => setMessages(r.data || []));
    const token = localStorage.getItem('token');
    ws.current = new WebSocket(`ws://localhost:8080/ws?token=${token}&groupId=${selected.id}`);
    ws.current.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.groupId === selected.id) setMessages(prev => [...prev, msg]);
    };
    return () => ws.current?.close();
  }, [selected]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const doSearch = async (q: string) => {
    setSearch(q);
    if (!q.trim()) { setSearchResults([]); return; }
    const r = await api.get(`/groups/search?q=${q}`);
    setSearchResults(r.data || []);
  };

  const createGroup = async () => {
    if (!newName.trim()) return;
    await api.post('/groups', { name: newName, description: newDesc });
    setShowCreate(false); setNewName(''); setNewDesc('');
    fetchGroups();
  };

  const joinGroup = async (g: Group) => {
    await api.post(`/groups/${g.id}/join`);
    setSearch(''); setSearchResults([]);
    fetchGroups();
  };

  const sendMessage = async () => {
    if (!text.trim() || !selected) return;
    ws.current?.send(JSON.stringify({ groupId: selected.id, content: text }));
    setText('');
  };

  const sendFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !selected) return;
    const fd = new FormData();
    fd.append('file', e.target.files[0]);
    const r = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    ws.current?.send(JSON.stringify({ groupId: selected.id, content: '', fileUrl: r.data.url, fileName: r.data.fileName, fileType: r.data.fileType }));
  };

  const isImage = (type?: string) => type?.startsWith('image/');

  if (selected) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      <div className="glass-panel" style={{ padding: '14px 20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid var(--border)' }}>
        <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)', display: 'flex' }}><ArrowLeft size={20} /></button>
        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary), transparent 70%), color-mix(in srgb, var(--secondary), transparent 70%))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-bright)', boxShadow: 'var(--glow)' }}>
          <Users size={18} color="var(--primary)" />
        </div>
        <div>
          <div style={{ fontWeight: '900', color: 'var(--primary)', textShadow: 'var(--glow)' }}>{selected.name}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{selected.members?.length || 0} участников</div>
        </div>
      </div>
      <div className="glass-panel" style={{ flex: 1, overflowY: 'auto', padding: '16px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid var(--border)' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.senderId === user?.id ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '70%', background: m.senderId === user?.id ? 'linear-gradient(135deg, color-mix(in srgb, var(--primary), transparent 85%), color-mix(in srgb, var(--secondary), transparent 85%))' : 'rgba(255,255,255,0.04)', border: `1px solid ${m.senderId === user?.id ? 'var(--border-bright)' : 'var(--border)'}`, borderRadius: '14px', padding: '10px 14px' }}>
              {m.fileUrl ? (
                isImage(m.fileType)
                  ? <img src={`http://localhost:8080${m.fileUrl}`} alt={m.fileName} style={{ maxWidth: '240px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                  : <a href={`http://localhost:8080${m.fileUrl}`} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textShadow: 'var(--glow)' }}>{m.fileName}</a>
              ) : <span style={{ fontSize: '0.9rem' }}>{m.content}</span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={sendFile} />
        <button onClick={() => fileRef.current?.click()} style={{ background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)', borderRadius: '10px', padding: '9px 12px', cursor: 'pointer', color: '#00f5ff', display: 'flex' }}>📎</button>
        <input className="input-field" style={{ flex: 1 }} placeholder="Сообщение..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
        <button onClick={sendMessage} style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.2), rgba(180,0,255,0.2))', border: '1px solid rgba(0,245,255,0.3)', borderRadius: '10px', padding: '9px 14px', cursor: 'pointer', color: '#00f5ff', display: 'flex' }}><Send size={18} /></button>
      </div>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#00f5ff', fontWeight: '800', fontSize: '1.4rem' }}>Группы</h2>
        <button onClick={() => setShowCreate(true)} style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.15), rgba(180,0,255,0.15))', border: '1px solid rgba(0,245,255,0.3)', borderRadius: '12px', padding: '9px 16px', cursor: 'pointer', color: '#00f5ff', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
          <Plus size={16} /> Создать
        </button>
      </div>

      {showCreate && (
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px', position: 'relative' }}>
          <button onClick={() => setShowCreate(false)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}><X size={16} /></button>
          <div style={{ fontWeight: '700', color: '#00f5ff', marginBottom: '14px' }}>Новая группа</div>
          <input className="input-field" placeholder="Название группы" value={newName} onChange={e => setNewName(e.target.value)} style={{ marginBottom: '10px', width: '100%' }} />
          <input className="input-field" placeholder="Описание (необязательно)" value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ marginBottom: '14px', width: '100%' }} />
          <button onClick={createGroup} style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary), transparent 80%), color-mix(in srgb, var(--secondary), transparent 80%))', border: '1px solid var(--border-bright)', borderRadius: '10px', padding: '10px 20px', cursor: 'pointer', color: 'var(--primary)', fontWeight: '900', boxShadow: 'var(--glow)' }}>Создать</button>
        </div>
      )}

      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input className="input-field" placeholder="Поиск групп..." value={search} onChange={e => doSearch(e.target.value)} style={{ paddingLeft: '40px', width: '100%' }} />
      </div>

      {searchResults.length > 0 && (
        <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Результаты поиска</div>
          {searchResults.map(g => (
            <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary), transparent 85%), color-mix(in srgb, var(--secondary), transparent 85%))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}><Users size={18} color="var(--primary)" /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '900', color: 'var(--primary)' }}>{g.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{g.description}</div>
              </div>
              <button onClick={() => joinGroup(g)} style={{ background: 'color-mix(in srgb, var(--primary), transparent 92%)', border: '1px solid color-mix(in srgb, var(--primary), transparent 75%)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '800' }}><LogIn size={14} /> Вступить</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {groups.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div>Вы пока не состоите в группах</div>
          </div>
        ) : groups.map(g => (
          <motion.div key={g.id} whileHover={{ scale: 1.01 }} className="glass-panel" onClick={() => setSelected(g)} style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid var(--border)' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary), transparent 85%), color-mix(in srgb, var(--secondary), transparent 85%))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-bright)', boxShadow: 'var(--glow)' }}><Users size={20} color="var(--primary)" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '900', color: 'var(--primary)', textShadow: 'var(--glow)' }}>{g.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{g.members?.length || 0} участников · {g.description || 'Нет описания'}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};