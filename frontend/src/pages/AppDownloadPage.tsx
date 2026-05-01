import { Download, Zap, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import SetiLogo from '../components/SetiLogo';
import { useState, useEffect } from 'react';

export const AppDownloadPage = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="glass-panel" style={{ 
      minHeight: isMobile ? 'calc(100vh - 180px)' : 'calc(100vh - 140px)', 
      padding: isMobile ? '32px 20px' : '60px 40px', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      textAlign: 'center',
      gap: isMobile ? '24px' : '32px'
    }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
        <div style={{ marginBottom: isMobile ? '20px' : '32px', display: 'inline-block' }}>
          <div className="pulse" style={{ 
            background: 'color-mix(in srgb, var(--primary), transparent 85%)', 
            border: '1px solid var(--border-bright)', 
            padding: isMobile ? '12px' : '20px', 
            borderRadius: '24px', 
            boxShadow: 'var(--glow-strong)' 
          }}>
            <SetiLogo size={isMobile ? 64 : 100} />
          </div>
        </div>

        <h1 className="neon-text" style={{ 
          fontSize: isMobile ? '1.8rem' : '3rem', 
          marginBottom: isMobile ? '12px' : '20px',
          fontWeight: '900',
          letterSpacing: '1px'
        }}>SETI Mobile</h1>
        
        <p style={{ 
          color: 'var(--text-secondary)', 
          fontSize: isMobile ? '0.95rem' : '1.25rem', 
          maxWidth: '500px', 
          margin: '0 auto', 
          lineHeight: '1.6',
          fontWeight: '500'
        }}>
          Оставайтесь на связи где угодно. Установите официальное приложение для мгновенного доступа к сигналу и эксклюзивного неонового интерфейса!
        </p>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
          gap: isMobile ? '12px' : '20px', 
          maxWidth: '440px', 
          margin: isMobile ? '24px auto' : '40px auto' 
        }}>
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '18px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
            <Zap size={24} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
            <h3 style={{ fontSize: '1.05rem', marginBottom: '4px', fontWeight: '800' }}>Скорость</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Мгновенный отклик</span>
          </div>
          <div className="glass-panel" style={{ padding: '20px', borderRadius: '18px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
            <Shield size={24} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
            <h3 style={{ fontSize: '1.05rem', marginBottom: '4px', fontWeight: '800' }}>Безопасность</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Шифрование данных</span>
          </div>
        </div>

        <a href="https://github.com/Claower3D/seti/releases/latest/download/SETI.apk" download style={{ textDecoration: 'none', display: 'block' }}>
           <motion.button 
            whileTap={{ scale: 0.96 }}
            style={{ 
               background: 'var(--primary)', 
               color: 'black', 
               fontWeight: '900', 
               fontSize: isMobile ? '1rem' : '1.1rem', 
               padding: isMobile ? '16px 28px' : '18px 40px', 
               borderRadius: '20px', 
               border: 'none', 
               cursor: 'pointer', 
               display: 'inline-flex', 
               alignItems: 'center', 
               gap: '12px',
               boxShadow: 'var(--glow-strong)',
               width: isMobile ? '100%' : 'auto',
               justifyContent: 'center'
            }}
           >
             <Download size={isMobile ? 20 : 24} />
             Скачать APK (v2.0.8)
           </motion.button>
        </a>
        
        <p style={{ 
          marginTop: isMobile ? '24px' : '32px', 
          fontSize: '0.75rem', 
          color: 'rgba(255,255,255,0.3)', 
          maxWidth: '400px', 
          margin: '24px auto 0',
          lineHeight: '1.5'
        }}>
          * Нажатие кнопки начнет загрузку .apk файла. Разрешите установку из неизвестных источников в настройках вашего устройства.
        </p>

      </motion.div>
    </div>
  );
};
