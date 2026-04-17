import React, { useState, useRef } from 'react';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User as UserIcon, AlignLeft, Camera, Upload } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onUpdate: (updatedUser: any) => void;
}

export const EditProfileModal = ({ isOpen, onClose, currentUser, onUpdate }: EditProfileModalProps) => {
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.put('/profile', { bio, avatar });
      onUpdate(res.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass-panel"
            style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '30px', zIndex: 1001, border: '1px solid rgba(0,245,255,0.2)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#00f5ff' }}>Редактировать профиль</h2>
              <X size={24} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={onClose} />
            </div>

            {error && <div style={{ color: '#ff4d4d', marginBottom: '16px', textAlign: 'center', fontSize: '0.85rem' }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '10px' }}>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ position: 'relative', width: '100px', height: '100px', cursor: 'pointer', borderRadius: '24px', overflow: 'hidden', border: '2px solid rgba(0,245,255,0.4)', boxShadow: '0 0 20px rgba(0,245,255,0.2)' }}
                >
                  <img src={avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isUploading ? 1 : 0, transition: 'opacity 0.2s' }}>
                    {isUploading ? (
                      <div className="pulse" style={{ width: '4px', height: '4px', background: '#00f5ff' }} />
                    ) : (
                      <Camera color="white" size={24} />
                    )}
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)', borderRadius: '12px', padding: '8px 16px', color: '#00f5ff', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Upload size={14} /> Выбрать файл
                </button>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.9rem' }}>
                  <UserIcon size={18} /> URL Аватара (или загрузите выше)
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                  style={{ fontSize: '0.9rem' }}
                />
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.9rem' }}>
                  <AlignLeft size={18} /> О себе (Bio)
                </label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: '100px', resize: 'none', fontSize: '0.9rem' }}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Расскажите о себе..."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="input-field" style={{ flex: 1 }} onClick={onClose}>Отмена</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSubmitting || isUploading}>
                  {isSubmitting ? 'Сохранение...' : <><Save size={18} /> Сохранить</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

