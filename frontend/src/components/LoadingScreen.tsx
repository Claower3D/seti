import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import SetiLogo from './SetiLogo';

const LoadingScreen = () => {
  const [telemetry, setTelemetry] = useState<string[]>([]);
  const [status, setStatus] = useState('ИННИЦИАЛИЗАЦИЯ КВАНТОВОГО КАНАЛА...');

  const statuses = [
    'ПОИСК ВНЕЗЕМНЫХ СИГНАЛОВ...',
    'ДЕШИФРОВКА ПОТОКА ДАННЫХ...',
    'ПОДКЛЮЧЕНИЕ К ОРБИТАЛЬНОМУ УЗЛУ...',
    'СИНХРОНИЗАЦИЯ НЕЙРОННОЙ СЕТИ...',
    'ПРОВЕРКА ПРОТОКОЛОВ БЕЗОПАСНОСТИ...',
    'ЗАГРУЗКА ИНТЕРФЕЙСА SETI...'
  ];

  useEffect(() => {
    const statusInterval = setInterval(() => {
      setStatus(statuses[Math.floor(Math.random() * statuses.length)]);
    }, 2000);

    const telemetryInterval = setInterval(() => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>[]{}/\\|';
      let randomStr = '';
      for (let i = 0; i < 20; i++) {
        randomStr += chars[Math.floor(Math.random() * chars.length)];
      }
      setTelemetry(prev => [randomStr, ...prev].slice(0, 5));
    }, 200);

    return () => {
      clearInterval(statusInterval);
      clearInterval(telemetryInterval);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#050510',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      overflow: 'hidden',
      color: '#00f5ff',
      fontFamily: "'Space Grotesk', 'Inter', sans-serif",
    }}>
      {/* Background Radar Effect */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80vh',
          height: '80vh',
          border: '1px solid #00f5ff',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '50vh',
          height: '50vh',
          border: '1px solid #00f5ff',
          borderRadius: '50%',
        }} />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100vh',
            height: '2px',
            background: 'linear-gradient(90deg, #00f5ff, transparent)',
            transformOrigin: 'left center',
          }}
        />
      </div>

      {/* Grid Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(rgba(0, 245, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 245, 255, 0.05) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
        pointerEvents: 'none'
      }} />

      {/* Main Logo & Pulse */}
      <div style={{ position: 'relative', marginBottom: '40px' }}>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          style={{
            position: 'absolute',
            inset: -20,
            background: 'radial-gradient(circle, rgba(0, 245, 255, 0.3) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{
            position: 'relative',
            background: 'rgba(0, 0, 0, 0.5)',
            border: '2px solid #00f5ff',
            borderRadius: '24px',
            padding: '30px',
            boxShadow: '0 0 30px rgba(0, 245, 255, 0.4)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <SetiLogo size={88} />
        </motion.div>
      </div>

      {/* Status & Loader */}
      <div style={{ textAlign: 'center', zIndex: 10 }}>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          style={{
            fontSize: '1rem',
            fontWeight: '900',
            letterSpacing: '3px',
            textShadow: '0 0 10px #00f5ff',
            marginBottom: '15px'
          }}
        >
          {status}
        </motion.div>
        
        <div style={{
          width: '260px',
          height: '4px',
          background: 'rgba(0, 245, 255, 0.1)',
          borderRadius: '2px',
          margin: '0 auto',
          overflow: 'hidden',
          border: '1px solid rgba(0, 245, 255, 0.2)'
        }}>
          <motion.div
            animate={{ left: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            style={{
              width: '60%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, #00f5ff, transparent)',
              position: 'relative'
            }}
          />
        </div>
      </div>

      {/* Telemetry Display (Bottom Right) */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        right: '30px',
        textAlign: 'right',
        fontSize: '0.65rem',
        opacity: 0.5,
        fontFamily: 'monospace',
        pointerEvents: 'none'
      }}>
        {telemetry.map((line, i) => (
          <div key={i} style={{ marginBottom: '2px' }}>{`SIGNAL_DATA_STR [${line}]`}</div>
        ))}
      </div>

      {/* App Version (Bottom Left) */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        left: '30px',
        fontSize: '0.7rem',
        fontWeight: '700',
        letterSpacing: '1px',
        opacity: 0.6
      }}>
        PROTOC_V.2.0.4 // SYSTEM_STABLE
      </div>

      {/* Scanline Effect */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
        backgroundSize: '100% 4px, 3px 100%',
        pointerEvents: 'none',
        zIndex: 100
      }} />
    </div>
  );
};

export default LoadingScreen;
