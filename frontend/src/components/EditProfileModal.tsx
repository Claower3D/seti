import { useState, useRef, useEffect } from 'react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User as UserIcon, Camera, Shield, Palette, Sun, MapPin, Globe, Calendar, Heart, AtSign, Info, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const navigate = useNavigate();
  const { updateUser, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const [activeTab, setActiveTab] = useState<'general' | 'info' | 'design' | 'security' | 'language'>('general');

  // General
  const [username, setUsername]   = useState(currentUser?.username    || '');
  const [fullName, setFullName]   = useState(currentUser?.fullName    || '');
  const [bio, setBio]             = useState(currentUser?.bio         || '');
  const [avatar, setAvatar]       = useState(currentUser?.avatar      || '');
  const [phone, setPhone]         = useState(currentUser?.phone       || '');

  // Info
  const [dateOfBirth, setDateOfBirth] = useState(currentUser?.dateOfBirth || '');
  const [city, setCity]               = useState(currentUser?.city        || '');
  const [website, setWebsite]         = useState(currentUser?.website     || '');
  const [hobbies, setHobbies]         = useState(currentUser?.hobbies     || '');

  // Design
  const [neonColor,      setNeonColor]      = useState(currentUser?.neonColor      || '#00f5ff');
  const [neonBrightness, setNeonBrightness] = useState(currentUser?.neonBrightness || 1.0);
  const [theme,          setTheme]          = useState(currentUser?.theme          || 'custom');

  // Security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,      setNewPassword]      = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading,  setIsUploading]  = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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
        username, fullName, bio, avatar, phone,
        neonColor, neonBrightness, theme,
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

  const handleDeleteAccount = async () => {
    if (!window.confirm('ВНИМАНИЕ: Это действие необратимо. Вы уверены, что хотите навсегда удалить свой аккаунт?')) return;
    setIsSubmitting(true);
    try {
      await api.delete('/me');
      logout();
      onClose();
      navigate('/login');
    } catch {
      setError('Ошибка при удалении аккаунта');
    } finally { setIsSubmitting(false); }
  };

  const isMobile = window.innerWidth < 768;

  const tabs = [
    { id: 'general',  label: t('settings.profile'),      icon: UserIcon },
    { id: 'info',     label: t('settings.about'),        icon: Info     },
    { id: 'design',   label: t('settings.design'),       icon: Palette  },
    { id: 'security', label: t('settings.security'),     icon: Shield   },
    { id: 'language', label: t('settings.language'),     icon: Globe    },
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
                  {t('settings.title')}
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

              {activeTab === 'general' && (
                <form onSubmit={handleGeneralSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div onClick={() => fileInputRef.current?.click()} style={{ position: 'relative', width: '80px', height: '80px', cursor: 'pointer', borderRadius: '20px', overflow: 'hidden', border: `2px solid ${neonColor}55`, boxShadow: `0 0 20px ${neonColor}22`, flexShrink: 0 }}>
                      <img src={avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isUploading ? 1 : 0, transition: 'opacity 0.2s' }}>
                        {isUploading ? <div className="pulse" style={{ width: '4px', height: '4px', background: neonColor }} /> : <Camera color="white" size={22} />}
                      </div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                    <div>
                      <div style={{ fontWeight: '800', color: 'white', fontSize: '0.95rem' }}>{t('settings.profilePhoto')}</div>
                      <button type="button" onClick={() => fileInputRef.current?.click()} style={{ marginTop: '10px', background: `${neonColor}18`, border: `1px solid ${neonColor}44`, color: neonColor, borderRadius: '10px', padding: '6px 14px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}>
                        {t('settings.changePhoto')}
                      </button>
                    </div>
                  </div>
                  <div>
                    <FieldLabel><AtSign size={12} style={{ display: 'inline', marginRight: '6px' }} />{t('settings.nickname')}</FieldLabel>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: neonColor, fontWeight: '800' }}>@</span>
                      <input type="text" value={username} onChange={e => setUsername(e.target.value)} style={{ ...inputStyle, paddingLeft: '32px' }} />
                    </div>
                  </div>
                  <div>
                    <FieldLabel><Phone size={12} style={{ display: 'inline', marginRight: '6px' }} />{t('settings.phone')}</FieldLabel>
                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} placeholder="+7 (XXX) XXX-XX-XX" />
                  </div>
                  <div>
                    <FieldLabel><UserIcon size={12} style={{ display: 'inline', marginRight: '6px' }} />{t('settings.fullName')}</FieldLabel>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <FieldLabel>{t('settings.bio')}</FieldLabel>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'none' }} />
                  </div>
                  <button type="submit" disabled={isSubmitting} style={saveBtnStyle}>
                    <Save size={18} /> {isSubmitting ? t('settings.saving') : t('settings.saveChanges')}
                  </button>
                </form>
              )}

              {activeTab === 'info' && (
                <form onSubmit={handleGeneralSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div>
                    <FieldLabel><Calendar size={12} style={{ display: 'inline', marginRight: '6px' }} />{t('settings.birthDate')}</FieldLabel>
                    <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
                  </div>
                  <div>
                    <FieldLabel><MapPin size={12} style={{ display: 'inline', marginRight: '6px' }} />{t('settings.city')}</FieldLabel>
                    <input type="text" value={city} onChange={e => setCity(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <FieldLabel><Globe size={12} style={{ display: 'inline', marginRight: '6px' }} />{t('settings.website')}</FieldLabel>
                    <input type="url" value={website} onChange={e => setWebsite(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <FieldLabel><Heart size={12} style={{ display: 'inline', marginRight: '6px' }} />{t('settings.hobbies')}</FieldLabel>
                    <textarea value={hobbies} onChange={e => setHobbies(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'none' }} />
                  </div>
                  <button type="submit" disabled={isSubmitting} style={saveBtnStyle}>
                    <Save size={18} /> {t('settings.saveInfo')}
                  </button>
                </form>
              )}

              {activeTab === 'design' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <FieldLabel>{t('settings.interfaceTheme') || 'Тема интерфейса'}</FieldLabel>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      {[
                        { id: 'light', label: 'Светлая', icon: '☀️' },
                        { id: 'dark', label: 'Темная', icon: '🌑' },
                        { id: 'custom', label: 'Неон', icon: '⚡' }
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setTheme(t.id);
                            updateUser({ ...currentUser, theme: t.id });
                          }}
                          style={{
                            padding: '12px 8px',
                            borderRadius: '14px',
                            background: theme === t.id ? `${neonColor}18` : 'rgba(255,255,255,0.03)',
                            border: `2px solid ${theme === t.id ? neonColor : 'transparent'}`,
                            color: 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span style={{ fontSize: '1.2rem' }}>{t.icon}</span>
                          <span style={{ fontSize: '0.7rem', fontWeight: '800' }}>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {theme === 'custom' && (
                    <>
                      <div>
                        <FieldLabel>{t('settings.neonPresets')}</FieldLabel>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                          {NEON_PRESETS.map(preset => (
                            <button key={preset.name} onClick={() => { setNeonColor(preset.color); updateUser({ ...currentUser, neonColor: preset.color, neonBrightness, theme }); }}
                              style={{ padding: '12px 8px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: `2px solid ${neonColor === preset.color ? preset.color : 'transparent'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
                              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: preset.color, margin: '0 auto 8px', boxShadow: `0 0 10px ${preset.color}` }} />
                              <span style={{ fontSize: '0.65rem', color: 'white', fontWeight: '600' }}>{preset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <FieldLabel>{t('settings.customColor')}</FieldLabel>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <div style={{ position: 'relative', flex: 1 }}>
                            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: neonColor, fontWeight: '800' }}>#</span>
                            <input type="text" value={neonColor.replace('#', '')} 
                              onChange={e => { 
                                const val = '#' + e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                                setNeonColor(val); 
                                updateUser({ ...currentUser, neonColor: val, neonBrightness, theme }); 
                              }}
                              style={{ ...inputStyle, paddingLeft: '32px' }} placeholder="00f5ff" />
                          </div>
                          <input type="color" value={neonColor.startsWith('#') && neonColor.length === 7 ? neonColor : '#00f5ff'} 
                            onChange={e => { setNeonColor(e.target.value); updateUser({ ...currentUser, neonColor: e.target.value, neonBrightness, theme }); }}
                            style={{ width: '48px', height: '48px', padding: '4px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', cursor: 'pointer' }} />
                        </div>
                      </div>

                      <div>
                        <FieldLabel>{t('settings.neonBrightness')}</FieldLabel>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.03)', padding: '14px 18px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <Sun size={18} color={neonColor} />
                          <input type="range" min="0" max="1.5" step="0.05" value={neonBrightness}
                            onChange={e => { const v = parseFloat(e.target.value); setNeonBrightness(v); updateUser({ ...currentUser, neonColor, neonBrightness: v, theme }); }}
                            style={{ flex: 1, accentColor: neonColor, cursor: 'pointer' }} />
                          <span style={{ minWidth: '40px', fontSize: '0.85rem', fontWeight: '800', color: neonColor }}>{Math.round(neonBrightness * 100)}%</span>
                        </div>
                      </div>
                    </>
                  )}

                  <button onClick={() => handleGeneralSubmit()} disabled={isSubmitting} style={saveBtnStyle}>
                    <Save size={18} /> {t('settings.applyDesign')}
                  </button>
                </div>
              )}

              {activeTab === 'security' && (
                <form onSubmit={handleSecuritySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div>
                    <FieldLabel>{t('settings.currentPassword')}</FieldLabel>
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={inputStyle} required />
                  </div>
                  <div>
                    <FieldLabel>{t('settings.newPassword')}</FieldLabel>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} required />
                  </div>
                  <div>
                    <FieldLabel>{t('settings.confirmPassword')}</FieldLabel>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} required />
                  </div>
                  <button type="submit" disabled={isSubmitting} style={saveBtnStyle}>
                    <Shield size={18} /> {t('settings.updatePassword')}
                  </button>
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={() => { onClose(); logout(); }} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800' }}>
                      {t('settings.logout')}
                    </button>
                    <button type="button" onClick={handleDeleteAccount} style={{ flex: 1, background: 'rgba(255,48,96,0.1)', color: '#ff3060', border: '1px solid rgba(255,48,96,0.2)', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800' }}>
                      {t('settings.deleteAccount')}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'language' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <FieldLabel>{t('settings.selectLanguage')}</FieldLabel>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {[
                      { code: 'ru', name: 'Русский', flag: '🇷🇺' },
                      { code: 'en', name: 'English', flag: '🇬🇧' },
                      { code: 'kk', name: 'Қазақша', flag: '🇰🇿' }
                    ].map(lang => (
                      <button 
                        key={lang.code}
                        onClick={() => {
                          i18n.changeLanguage(lang.code);
                          localStorage.setItem('appLanguage', lang.code);
                        }}
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: '16px',
                          padding: '16px', borderRadius: '14px', 
                          background: i18n.language === lang.code ? `${neonColor}18` : 'rgba(255,255,255,0.03)', 
                          border: `2px solid ${i18n.language === lang.code ? neonColor : 'rgba(255,255,255,0.05)'}`, 
                          cursor: 'pointer', transition: 'all 0.2s',
                          color: 'white', fontSize: '1rem', fontWeight: '800'
                        }}
                      >
                        <span style={{ fontSize: '1.4rem' }}>{lang.flag}</span>
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
