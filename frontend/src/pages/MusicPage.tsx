import { motion } from 'framer-motion';
import { Disc } from 'lucide-react';

export const MusicPage = () => {
  const isMobile = window.innerWidth < 768;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '10px 20px 160px', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ textAlign: 'center', color: 'white', padding: '40px', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
      >
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{ display: 'inline-block', marginBottom: '24px' }}
        >
          <Disc size={80} color="var(--primary)" opacity={0.5} />
        </motion.div>
        
        <h1 style={{ fontSize: isMobile ? '1.5rem' : '2.5rem', fontWeight: '900', margin: '0 0 16px 0', background: 'linear-gradient(135deg, white, rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Технические работы
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', lineHeight: '1.6', maxWidth: '400px', margin: '0 auto' }}>
          Раздел музыки временно скрыт для проведения технического обслуживания и улучшения качества звука. Мы скоро вернемся!
        </p>
      </motion.div>
    </div>
  );
};

