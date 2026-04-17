import React, { useState, useRef } from 'react';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User as UserIcon, AlignLeft, Camera, Upload, Shield, Palette, Settings } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onUpdate: (updatedUser: any) => void;
}

const NEON_PRESETS = [
  { name: 'Cyan Blast', color: '#00f5ff' },
  { name: 'Neon Pink', color: '#ff00ff' },
  { name: 'Toxic Green', color: '#39ff14' },
  { name: 'Purple Haze', color: '#bc13fe' },
  { name: 'Electric Orange', color: '#ff5f1f' },
  { name: 'Crimson Glow', color: '#ff0033' }
];

export const EditProfileModal = ({ isOpen, onClose, currentUser, onUpdate }: EditProfileModalProps) => {
  const [activeTab, setActiveTab] = useState<'general' | 'design' | 'security'>('general');
  
  // General State
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  
  // Design State
  const [neonColor, setNeonColor] = useState(currentUser?.neonColor || '#00f5ff');
  
  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const mainContent = document.querySelector('.main-content') as HTMLElement;
    if (isOpen && mainContent) {
      mainContent.style.overflow = 'hidden';
    } else if (mainContent) {
      mainContent.style.overflow = 'auto';
    }
    return () => {
      if (mainContent) mainContent.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAvatar(res.data.url);
    } catch (err: any) {
      setError('Не удалось загрузить изображение');
    } finally {
      setIsUploading(false);
    }
  };

  const handleGeneralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.put('/profile', { username, bio, avatar, neonColor });
      onUpdate(res.data);
      setSuccess('Профиль обновлен');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при обновлении профиля');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/security', { currentPassword, newPassword });
      setSuccess('Пароль успешно изменен');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка при смене пароля');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'Профиль', icon: UserIcon },
    { id: 'design', label: 'Дизайн', icon: Palette },
    { id: 'security', label: 'Безопасность', icon: Shield },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass-panel"
            style={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: '600px', 
              padding: '0', 
              zIndex: 1001, 
              border: `1px solid ${neonColor}33`,
              boxShadow: `0 0 40px ${neonColor}1a`,
              display: 'flex',
              flexDirection: window.innerWidth < 768 ? 'column' : 'row',
              overflow: 'hidden',
              minHeight: '500px'
            }}
          >
            {/* Sidebar Tabs */}
            <div style={{ 
              width: window.innerWidth < 768 ? '100%' : '180px', 
              background: 'rgba(255,255,255,0.03)', 
              borderRight: window.innerWidth < 768 ? 'none' : '1px solid rgba(255,255,255,0.05)',
              borderBottom: window.innerWidth < 768 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              padding: '20px' 
            }}>
              <div style={{ marginBottom: '24px', fontWeight: '900', color: neonColor, fontSize: '1.2rem', letterSpacing: '1px' }}>SETI SETTINGS</div>
              <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'row' : 'column', gap: '8px' }}>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      background: activeTab === tab.id ? `${neonColor}1a` : 'transparent',
                      color: activeTab === tab.id ? neonColor : 'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      transition: 'all 0.2s',
                      flex: window.innerWidth < 768 ? 1 : 'none',
                      justifyContent: window.innerWidth < 768 ? 'center' : 'flex-start'
                    }}
                  >
                    <tab.icon size={18} />
                    {window.innerWidth >= 768 && tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, padding: '30px', display: 'flex', flexDirection: 'column', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white' }}>{tabs.find(t => t.id === activeTab)?.label}</h2>
                <X size={24} style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.3)' }} onClick={onClose} />
              </div>

              {error && <div style={{ color: '#ff4d4d', marginBottom: '16px', padding: '10px', background: 'rgba(255,77,77,0.1)', borderRadius: '8px', fontSize: '0.85rem' }}>{error}</div>}
              {success && <div style={{ color: neonColor, marginBottom: '16px', padding: '10px', background: `${neonColor}1a`, borderRadius: '8px', fontSize: '0.85rem' }}>{success}</div>}

              {activeTab === 'general' && (
                <form onSubmit={handleGeneralSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                   <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '10px' }}>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      style={{ position: 'relative', width: '90px', height: '90px', cursor: 'pointer', borderRadius: '24px', overflow: 'hidden', border: `2px solid ${neonColor}66`, boxShadow: `0 0 20px ${neonColor}33` }}
                    >
                      <img src={avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isUploading ? 1 : 0, transition: 'opacity 0.2s' }}>
                        {isUploading ? <div className="pulse" style={{ width: '4px', height: '4px', background: neonColor }} /> : <Camera color="white" size={20} />}
                      </div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: '0.75rem', letterSpacing: '1px' }}>НИКНЕЙМ</label>
                    <input type="text" className="input-field" value={username} onChange={(e) => setUsername(e.target.value)} />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: '0.75rem', letterSpacing: '1px' }}>О СЕБЕ</label>
                    <textarea className="input-field" style={{ minHeight: '80px', resize: 'none' }} value={bio} onChange={(e) => setBio(e.target.value)} />
                  </div>

                  <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ background: neonColor, color: 'black', fontWeight: '900', border: 'none', padding: '14px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: `0 0 20px ${neonColor}4d` }}>
                    <Save size={18} /> Сохранить изменения
                  </button>
                </form>
              )}

              {activeTab === 'design' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '16px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: '0.75rem', letterSpacing: '1px' }}>NEON GLOW PRESETS</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                      {NEON_PRESETS.map(preset => (
                        <button
                          key={preset.color}
                          onClick={() => setNeonColor(preset.color)}
                          style={{
                            padding: '12px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.03)',
                            border: `2px solid ${neonColor === preset.color ? preset.color : 'transparent'}`,
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: preset.color, boxShadow: `0 0 10px ${preset.color}` }} />
                          <span style={{ fontSize: '0.7rem', color: 'white', fontWeight: '600' }}>{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: '0.75rem', letterSpacing: '1px' }}>CUSTOM HEX</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input type="text" className="input-field" value={neonColor} onChange={(e) => setNeonColor(e.target.value)} />
                      <div style={{ width: '45px', borderRadius: '8px', background: neonColor }} />
                    </div>
                  </div>

                  <button 
                    onClick={handleGeneralSubmit} 
                    className="btn-primary" 
                    style={{ background: neonColor, color: 'black', fontWeight: '900', border: 'none', padding: '14px', borderRadius: '12px', cursor: 'pointer', marginTop: '20px', boxShadow: `0 0 20px ${neonColor}4d` }}
                  >
                    Применить Дизайн
                  </button>
                </div>
              )}

              {activeTab === 'security' && (
                <form onSubmit={handleSecuritySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: '0.75rem', letterSpacing: '1px' }}>ТЕКУЩИЙ ПАРОЛЬ</label>
                    <input type="password" className="input-field" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: '0.75rem', letterSpacing: '1px' }}>НОВЫЙ ПАРОЛЬ</label>
                    <input type="password" className="input-field" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: '0.75rem', letterSpacing: '1px' }}>ПОДТВЕРЖДЕНИЕ ПАРОЛЯ</label>
                    <input type="password" className="input-field" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  </div>

                  <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ background: '#ff3060', color: 'white', fontWeight: '900', border: 'none', padding: '14px', borderRadius: '12px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 0 20px rgba(255,48,96,0.3)' }}>
                    Обновить пароль
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
