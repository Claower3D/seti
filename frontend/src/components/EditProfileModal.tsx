import React, { useState } from 'react';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, User as UserIcon, AlignLeft } from 'lucide-react';

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
  const [error, setError] = useState('');

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
            style={{ position: 'relative', width: '100%', maxWidth: '500px', padding: '30px', zIndex: 1001 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2>Редактировать профиль</h2>
              <X size={24} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={onClose} />
            </div>

            {error && <div style={{ color: '#ff4d4d', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  <UserIcon size={18} /> URL Аватара
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  <AlignLeft size={18} /> О себе (Bio)
                </label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: '120px', resize: 'none' }}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Расскажите о себе..."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="input-field" style={{ flex: 1 }} onClick={onClose}>Отмена</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isSubmitting}>
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
