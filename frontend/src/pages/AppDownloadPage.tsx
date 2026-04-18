
import { Download, Smartphone, Zap, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export const AppDownloadPage = () => {
  return (
    <div className="glass-panel" style={{ minHeight: 'calc(100vh - 140px)', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
        <div style={{ marginBottom: '24px', display: 'inline-block' }}>
          <div className="pulse" style={{ background: 'color-mix(in srgb, var(--primary), transparent 80%)', border: '1px solid var(--primary)', padding: '24px', borderRadius: '24px', boxShadow: 'var(--glow-strong)' }}>
            <Smartphone size={64} style={{ color: 'var(--primary)', filter: 'var(--glow)' }} />
          </div>
        </div>
        <h1 className="neon-text" style={{ fontSize: '2.5rem', marginBottom: '16px' }}>SETI Mobile App</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '500px', margin: '0 auto 40px', lineHeight: '1.6' }}>
          Оставайтесь на связи где угодно. Установите официальное приложение, чтобы получать мгновенные сигналы и крутой неоновый интерфейс прямо на свой смартфон!
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '16px', maxWidth: '400px', margin: '0 auto 40px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <Zap size={24} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
            <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>Легкость</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Никаких лагов</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <Shield size={24} style={{ color: 'var(--primary)', marginBottom: '8px' }} />
            <h3 style={{ fontSize: '1rem', marginBottom: '4px' }}>Надёжность</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Защищённый канал</span>
          </div>
        </div>

        <a href="/seti-app.apk" download="seti-app.apk" style={{ textDecoration: 'none' }}>
           <button style={{ 
               background: 'var(--primary)', 
               color: 'black', 
               fontWeight: '900', 
               fontSize: '1.1rem', 
               padding: '16px 32px', 
               borderRadius: '16px', 
               border: 'none', 
               cursor: 'pointer', 
               display: 'inline-flex', 
               alignItems: 'center', 
               gap: '12px',
               boxShadow: 'var(--glow-strong)',
               transition: 'transform 0.2s',
           }}
           onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
           onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
           >
             <Download size={24} />
             Скачать APK напрямую
           </button>
        </a>
        
        <p style={{ marginTop: '24px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', maxWidth: '400px', margin: '24px auto 0' }}>
          * Сборка приложения автоматически обновляется. Нажатие на кнопку немедленно начнет загрузку .apk файла на ваше устройство. В случае предупреждения безопасности, разрешите установку из неизвестных источников.
        </p>

      </motion.div>
    </div>
  );
};
