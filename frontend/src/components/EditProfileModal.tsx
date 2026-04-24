import React, { useState, useRef } from 'react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User as UserIcon, Camera, Shield, Palette, Sun, LogOut, MapPin, Globe, Calendar, Heart, AtSign, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onUpdate: (updatedUser: any) => void;
}

const NEON_PRESETS = [
  { name: 'Cyan Blast',      color: '#00f5ff' },
  { name: 'Neon Pink',       color: '#ff00ff' },
  { name: 'Toxic Green',     color: '#39ff14' },
  { name: 'Purple Haze',     color: '#bc13fe' },
  { name: 'Electric Orange', color: '#ff5f1f' },
  { name: 'Crimson Glow',    color: '#ff0033' },
];

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: '0.7rem', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
    {children}
  </label>
);

export const EditProfileModal = ({ isOpen, onClose, currentUser, onUpdate }: EditProfileModalProps) => {
  const navigate    = useNavigate();
  const { updateUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'general' | 'info' | 'design' | 'security'>('general');

  // General
  const [username, setUsername]   = useState(currentUser?.username    || '');
  const [fullName, setFullName]   = useState(currentUser?.fullName    || '');
  const [bio, setBio]             = useState(currentUser?.bio         || '');
  const [avatar, setAvatar]       = useState(currentUser?.avatar      || '');

  // Info
  const [dateOfBirth, setDateOfBirth] = useState(currentUser?.dateOfBirth || '');
  const [city, setCity]               = useState(currentUser?.city        || '');
  const [website, setWebsite]         = useState(currentUser?.website     || '');
  const [hobbies, setHobbies]         = useState(currentUser?.hobbies     || '');

  // Design
  const [neonColor,      setNeonColor]      = useState(currentUser?.neonColor      || '#00f5ff');
  const [neonBrightness, setNeonBrightness] = useState(currentUser?.neonBrightness || 1.0);

  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,      setNewPassword]      = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading,  setIsUploading]  = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const el = document.querySelector('.main-content') as HTMLElement;
    if (el) el.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => { if (el) el.style.overflow = 'auto'; };
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAvatar(res.data.url);
    } catch { setError('Не удалось загрузить изображение'); }
    finally { setIsUploading(false); }
  };

  const handleGeneralSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.put('/profile', {
        username, fullName, bio, avatar,
        neonColor, neonBrightness,
        dateOfBirth, city, website, hobbies,
      });
      onUpdate(res.data);
      updateUser(res.data);
      setSuccess('Профиль обновлён!');
      if (res.data.username !== currentUser.username) navigate(`/profile/${res.data.username}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при обновлении профиля');
    } finally { setIsSubmitting(false); }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('Пароли не совпадают'); return; }
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/security', { currentPassword, newPassword });
      setSuccess('Пароль успешно изменён');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при смене пароля');
    } finally { setIsSubmitting(false); }
  };

  const isMobile = window.innerWidth < 768;

  const tabs = [
    { id: 'general',  label: 'Профиль',      icon: UserIcon },
    { id: 'info',     label: 'Обо мне',       icon: Info     },
    { id: 'design',   label: 'Дизайн',        icon: Palette  },
    { id: 'security', label: 'Безопасность',  icon: Shield   },
  ];

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px', padding: '12px 16px', color: 'white', fontSize: '0.95rem',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s',
  };

  const saveBtnStyle: React.CSSProperties = {
    background: neonColor, color: 'black', fontWeight: '900', border: 'none',
    padding: '14px', borderRadius: '12px', cursor: isSubmitting ? 'wait' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
    boxShadow: `0 0 20px ${neonColor}4d`, fontSize: '0.95rem', marginTop: '8px',
    opacity: isSubmitting ? 0.7 : 1,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }} />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass-panel"
            style={{
              position: 'relative', width: '100%', maxWidth: '640px',
              padding: '0', zIndex: 1001,
              border: `1px solid ${neonColor}33`,
              boxShadow: `0 0 60px ${neonColor}1a, 0 30px 80px rgba(0,0,0,0.8)`,
              display: 'flex', flexDirection: isMobile ? 'column' : 'row',
              overflow: 'hidden', maxHeight: isMobile ? '95vh' : '90vh',
            }}
          >
            {/* ── Sidebar ── */}
            <div style={{
              width: isMobile ? '100%' : '190px',
              background: 'rgba(255,255,255,0.02)',
              borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.05)',
              borderBottom: isMobile ? '1px solid rgba(255,255,255,0.05)' : 'none',
              padding: isMobile ? '16px' : '24px 16px',
              flexShrink: 0,
            }}>
              {!isMobile && (
                <div style={{ marginBottom: '24px', fontWeight: '900', color: neonColor, fontSize: '1rem', letterSpacing: '2px', textShadow: `0 0 10px ${neonColor}` }}>
                  SETI SETTINGS
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '6px' }}>
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); setError(''); setSuccess(''); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: isMobile ? '10px 8px' : '12px 14px',
                      borderRadius: '12px', border: 'none',
                      background: activeTab === tab.id ? `${neonColor}18` : 'transparent',
                      color: activeTab === tab.id ? neonColor : 'rgba(255,255,255,0.45)',
                      cursor: 'pointer', fontSize: '0.88rem', fontWeight: '700',
                      transition: 'all 0.2s',
                      flex: isMobile ? 1 : 'none',
                      justifyContent: isMobile ? 'center' : 'flex-start',
                      boxShadow: activeTab === tab.id ? `inset 0 0 12px ${neonColor}10` : 'none',
                    }}>
                    <tab.icon size={17} />
                    {!isMobile && tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Content ── */}
            <div style={{ flex: 1, padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'white', margin: 0 }}>
                  {tabs.find(t => t.id === activeTab)?.label}
                </h2>
                <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', borderRadius: '10px', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              {error   && <div style={{ color: '#ff4d4d', marginBottom: '16px', padding: '10px 14px', background: 'rgba(255,77,77,0.1)', borderRadius: '10px', fontSize: '0.85rem', border: '1px solid rgba(255,77,77,0.2)' }}>{error}</div>}
              {success && <div style={{ color: neonColor, marginBottom: '16px', padding: '10px 14px', background: `${neonColor}15`, borderRadius: '10px', fontSize: '0.85rem', border: `1px solid ${neonColor}30` }}>✓ {success}</div>}

              {/* ── GENERAL TAB ── */}
              {activeTab === 'general' && (
                <form onSubmit={handleGeneralSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Avatar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div onClick={() => fileInputRef.current?.click()} style={{ position: 'relative', width: '80px', height: '80px', cursor: 'pointer', borderRadius: '20px', overflow: 'hidden', border: `2px solid ${neonColor}55`, boxShadow: `0 0 20px ${neonColor}22`, flexShrink: 0 }}>
                      <img src={avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isUploading ? 1 : 0, transition: 'opacity 0.2s' }}>
                        {isUploading ? <div className="pulse" style={{ width: '4px', height: '4px', background: neonColor }} /> : <Camera color="white" size={22} />}
                      </div>
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.45)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0)')}>
                        <Camera color="white" size={22} style={{ opacity: 0.8 }} />
                      </div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                    <div>
                      <div style={{ fontWeight: '800', color: 'white', fontSize: '0.95rem' }}>Фото профиля</div>
                      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '4px' }}>JPG, PNG, GIF до 10 МБ</div>
                      <button type="button" onClick={() => fileInputRef.current?.click()} style={{ marginTop: '10px', background: `${neonColor}18`, border: `1px solid ${neonColor}44`, color: neonColor, borderRadius: '10px', padding: '6px 14px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
                        Изменить фото
                      </button>
                    </div>
                  </div>

                  {/* Username */}
                  <div>
                    <FieldLabel><AtSign size={12} style={{ display: 'inline', marginRight: '6px' }} />Никнейм (уникальная ссылка)</FieldLabel>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: neonColor, fontWeight: '800', fontSize: '0.95rem' }}>@</span>
                      <input type="text" value={username} onChange={e => setUsername(e.target.value)} style={{ ...inputStyle, paddingLeft: '32px' }} placeholder="your_username" />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', marginTop: '5px' }}>Ваш профиль: seti.app/profile/{username || '...'}</div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <FieldLabel><UserIcon size={12} style={{ display: 'inline', marginRight: '6px' }} />Имя и Фамилия</FieldLabel>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} placeholder="Иван Иванов" />
                  </div>

                  {/* Bio */}
                  <div>
                    <FieldLabel>О себе</FieldLabel>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                      style={{ ...inputStyle, resize: 'none', lineHeight: '1.5' }}
                      placeholder="Расскажите о себе..." />
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', marginTop: '5px', textAlign: 'right' }}>{bio.length}/300</div>
                  </div>

                  <button type="submit" disabled={isSubmitting} style={saveBtnStyle}>
                    <Save size={18} /> {isSubmitting ? 'Сохранение...' : 'Сохранить изменения'}
                  </button>
                </form>
              )}

              {/* ── INFO TAB ── */}
              {activeTab === 'info' && (
                <form onSubmit={handleGeneralSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Date of birth */}
                  <div>
                    <FieldLabel><Calendar size={12} style={{ display: 'inline', marginRight: '6px' }} />Дата рождения</FieldLabel>
                    <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)}
                      style={{ ...inputStyle, colorScheme: 'dark' }} />
                  </div>

                  {/* City */}
                  <div>
                    <FieldLabel><MapPin size={12} style={{ display: 'inline', marginRight: '6px' }} />Город / Страна</FieldLabel>
                    <input type="text" value={city} onChange={e => setCity(e.target.value)} style={inputStyle} placeholder="Алматы, Казахстан" />
                  </div>

                  {/* Website */}
                  <div>
                    <FieldLabel><Globe size={12} style={{ display: 'inline', marginRight: '6px' }} />Сайт / Ссылка</FieldLabel>
                    <input type="url" value={website} onChange={e => setWebsite(e.target.value)} style={inputStyle} placeholder="https://example.com" />
                  </div>

                  {/* Hobbies */}
                  <div>
                    <FieldLabel><Heart size={12} style={{ display: 'inline', marginRight: '6px' }} />Хобби и увлечения</FieldLabel>
                    <textarea value={hobbies} onChange={e => setHobbies(e.target.value)} rows={4}
                      style={{ ...inputStyle, resize: 'none', lineHeight: '1.6' }}
                      placeholder="Музыка, фотография, путешествия, программирование..." />
                    <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)', marginTop: '5px' }}>Расскажите о своих интересах — они помогут найти вас друзьям</div>
                  </div>

                  <button type="submit" disabled={isSubmitting} style={saveBtnStyle}>
                    <Save size={18} /> {isSubmitting ? 'Сохранение...' : 'Сохранить информацию'}
                  </button>
                </form>
              )}

              {/* ── DESIGN TAB ── */}
              {activeTab === 'design' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <FieldLabel>NEON GLOW PRESETS</FieldLabel>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {NEON_PRESETS.map(preset => (
                        <button key={preset.color} onClick={() => { setNeonColor(preset.color); updateUser({ ...currentUser, neonColor: preset.color, neonBrightness }); }}
                          style={{ padding: '12px 8px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: `2px solid ${neonColor === preset.color ? preset.color : 'transparent'}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}>
                          <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: preset.color, boxShadow: `0 0 12px ${preset.color}` }} />
                          <span style={{ fontSize: '0.68rem', color: 'white', fontWeight: '600', textAlign: 'center' }}>{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <FieldLabel>INTENSITY (ЯРКОСТЬ)</FieldLabel>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.03)', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <Sun size={18} color={neonColor} style={{ filter: `drop-shadow(0 0 5px ${neonColor})` }} />
                      <input type="range" min="0" max="1.5" step="0.05" value={neonBrightness}
                        onChange={e => { const v = parseFloat(e.target.value); setNeonBrightness(v); updateUser({ ...currentUser, neonColor, neonBrightness: v }); }}
                        style={{ flex: 1, accentColor: neonColor, cursor: 'pointer' }} />
                      <span style={{ minWidth: '40px', fontSize: '0.85rem', fontWeight: '800', color: neonColor }}>{Math.round(neonBrightness * 100)}%</span>
                    </div>
                  </div>

                  <div>
                    <FieldLabel>CUSTOM HEX COLOR</FieldLabel>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input type="text" value={neonColor} onChange={e => { setNeonColor(e.target.value); updateUser({ ...currentUser, neonColor: e.target.value, neonBrightness }); }}
                        style={{ ...inputStyle, flex: 1 }} placeholder="#00f5ff" />
                      <input type="color" value={neonColor} onChange={e => { setNeonColor(e.target.value); updateUser({ ...currentUser, neonColor: e.target.value, neonBrightness }); }}
                        style={{ width: '46px', height: '46px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'none', padding: '2px' }} />
                    </div>
                  </div>

                  <button onClick={() => handleGeneralSubmit()} disabled={isSubmitting} style={saveBtnStyle}>
                    <Save size={18} /> Применить и сохранить
                  </button>
                </div>
              )}

              {/* ── SECURITY TAB ── */}
              {activeTab === 'security' && (
                <form onSubmit={handleSecuritySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div>
                    <FieldLabel>Текущий пароль</FieldLabel>
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={inputStyle} required placeholder="••••••••" />
                  </div>
                  <div>
                    <FieldLabel>Новый пароль</FieldLabel>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} required placeholder="минимум 6 символов" />
                  </div>
                  <div>
                    <FieldLabel>Подтверждение нового пароля</FieldLabel>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} required placeholder="повторите пароль" />
                  </div>

                  <button type="submit" disabled={isSubmitting} style={saveBtnStyle}>
                    <Shield size={18} /> {isSubmitting ? 'Обновление...' : 'Обновить пароль'}
                  </button>

                  <div style={{ marginTop: '8px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ color: 'rgba(255,255,255,0.35)', fontWeight: '700', fontSize: '0.7rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>Аккаунт</div>
                    <button type="button" onClick={() => { onClose(); logout(); }}
                      style={{ background: 'rgba(255,48,96,0.08)', color: '#ff3060', border: '1px solid rgba(255,48,96,0.25)', padding: '13px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s', fontSize: '0.9rem' }}>
                      <LogOut size={18} /> Выйти со всех устройств
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
