import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, LogIn, Activity, Cpu, ShieldAlert, Globe } from 'lucide-react';
import SetiLogo from './SetiLogo';

const SCRIPT = [
  { t: 0, cls: 'dim', text: '$ seti-analyzer --freq 1420.405 --mode full' },
  { t: 220, cls: 'green', text: '> инициализация модулей...' },
  { t: 420, cls: 'white', text: '  [✓] fft.so          loaded' },
  { t: 560, cls: 'white', text: '  [✓] entropy.so      loaded' },
  { t: 700, cls: 'white', text: '  [✓] correlator.so   loaded' },
  { t: 850, cls: 'green', text: '> захват антенны dish-7...' },
  { t: 1020, cls: 'white', text: '  azimuth  34.2°  elevation 18.7°' },
  { t: 1150, cls: 'green', text: '> блокировка частоты 1420.405 MHz' },
  { t: 1280, cls: 'white', text: '  noise floor: -118.3 dBm  ✓' },
  { t: 1420, cls: 'green', text: '> запуск FFT (окно Hanning, 8192 pts)' },
  { t: 1580, cls: 'white', text: '  обработка пакетов: 0 / 84291' },
  { t: 1750, cls: 'white', text: '  обработка пакетов: 12 048 / 84291' },
  { t: 1900, cls: 'white', text: '  обработка пакетов: 31 774 / 84291' },
  { t: 2050, cls: 'white', text: '  обработка пакетов: 57 209 / 84291' },
  { t: 2180, cls: 'white', text: '  обработка пакетов: 84 291 / 84291  ✓' },
  { t: 2320, cls: 'green', text: '> анализ паттернов...' },
  { t: 2450, cls: 'white', text: '  SIGNAL_DATA_STR  [GRN7YM||[L7CYN4|{|2B]' },
  { t: 2570, cls: 'white', text: '  SIGNAL_DATA_STR  [B/6PAVOLOS|S60Bx8I.2X]' },
  { t: 2680, cls: 'white', text: '  SIGNAL_DATA_STR  [N7ZM63JPRNMKC|#YC5GP]' },
  { t: 2780, cls: 'white', text: '  SIGNAL_DATA_STR  [3B51]4O3RNK9OI[LVJ}>' },
  { t: 2900, cls: 'warn', text: '  ! отклонение +4.7σ — нетипичный паттерн' },
  { t: 3050, cls: 'green', text: '> проверка энтропии...' },
  { t: 3180, cls: 'warn', text: '  H = 6.82 bits — выше нормы (норма < 5.5)' },
  { t: 3320, cls: 'green', text: '> автокорреляционный анализ...' },
  { t: 3460, cls: 'err', text: '  !! пик на τ = 0.037s — АНОМАЛИЯ #1' },
  { t: 3600, cls: 'green', text: '> триангуляция источника...' },
  { t: 3730, cls: 'white', text: '  RA 19h 25m 12s  /  Dec +31° 04\'' },
  { t: 3850, cls: 'green', text: '> поиск периодичности...' },
  { t: 3980, cls: 'err', text: '  !! повтор каждые 72.1s — АНОМАЛИЯ #2' },
  { t: 4150, cls: 'green', text: '> декодирование...' },
  { t: 4280, cls: 'white', text: '  попытка UTF-8  ... fail' },
  { t: 4380, cls: 'white', text: '  попытка ASCII  ... fail' },
  { t: 4480, cls: 'white', text: '  попытка Base64 ... inconclusive' },
  { t: 4620, cls: 'green', text: '> финализация отчёта...' },
  { t: 4800, cls: 'green', text: '> готово.' },
];

const PROG_STEPS = [
  { t: 0, pct: 0, txt: 'ИНИЦИАЛИЗАЦИЯ...' },
  { t: 850, pct: 18, txt: 'ЗАХВАТ ЧАСТОТЫ...' },
  { t: 1420, pct: 35, txt: 'FFT АНАЛИЗ...' },
  { t: 2320, pct: 52, txt: 'АНАЛИЗ ПАТТЕРНОВ...' },
  { t: 3050, pct: 67, txt: 'ПРОВЕРКА ЭНТРОПИИ...' },
  { t: 3600, pct: 80, txt: 'ТРИАНГУЛЯЦИЯ...' },
  { t: 3850, pct: 88, txt: 'ПОИСК ПЕРИОДИЧНОСТИ...' },
  { t: 4620, pct: 96, txt: 'ФИНАЛИЗАЦИЯ...' },
  { t: 4900, pct: 100, txt: 'ЗАВЕРШЕНО' },
];

const Waveform = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const start = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let wt = 0;
    let animationId: number;

    const render = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const elapsed = Date.now() - start.current;
      const anomaly = elapsed > 3300;

      ctx.strokeStyle = '#00e5cc';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00e5cc';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const p = x / W;
        const s1 = Math.sin(p * 10 + wt * 4.5) * 0.5;
        const s2 = Math.sin(p * 3.5 + wt * 2.1) * 0.18;
        const s3 = Math.sin(p * 1.5 + wt * 3.3) * 0.1;
        const noise = (Math.random() - 0.5) * 0.06;
        const spike = anomaly ? Math.sin(p * 20 + wt * 8) * 0.28 * Math.abs(Math.sin(wt * 0.6)) : 0;
        const y = H / 2 + (s1 + s2 + s3 + noise + spike) * H * 0.38;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      wt += 0.1;
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, []);

  return <canvas ref={canvasRef} width={800} height={100} style={{ width: '100%', height: '50px', opacity: 0.8 }} />;
};

export const StartupScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('ИНИЦИАЛИЗАЦИЯ...');
  const [isDone, setIsDone] = useState(false);
  const [authStatus, setAuthStatus] = useState<'none' | 'pending' | 'success'>('none');

  useEffect(() => {
    // Terminal Script
    SCRIPT.forEach(s => {
      setTimeout(() => {
        setLogs(prev => [...prev, s].slice(-13));
      }, s.t);
    });

    // Progress bar
    PROG_STEPS.forEach(s => {
      setTimeout(() => {
        setProgress(s.pct);
        setStatusText(s.txt);
      }, s.t);
    });

    // Final overlay
    setTimeout(() => {
      setIsDone(true);
    }, 5100);
  }, []);

  const handleLogin = () => {
    setAuthStatus('pending');
    setTimeout(() => {
      setAuthStatus('success');
      setTimeout(onComplete, 800);
    }, 1800);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#030e12', zIndex: 999999,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: "'Space Grotesk', 'Courier New', monospace",
      color: '#00e5cc', padding: '40px 20px', overflow: 'hidden'
    }}>
      {/* Grid and Scan Beam */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(0,200,180,0.03) 1px,transparent 1px), linear-gradient(90deg,rgba(0,200,180,0.03) 1px,transparent 1px)',
        backgroundSize: '40px 40px', pointerEvents: 'none'
      }} />
      <motion.div
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,rgba(0,229,204,0.3),transparent)', zIndex: 1 }}
      />

      {/* Header */}
      <div style={{
        width: '80px', height: '80px',
        border: '2px solid #00e5cc', borderRadius: '16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '20px', boxShadow: '0 0 20px rgba(0,229,204,0.2)', flexShrink: 0
      }}>
        <SetiLogo size={50} />
      </div>

      <div style={{ fontSize: '14px', letterSpacing: '6px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '4px' }}>ЗАГРУЗКА ИНТЕРФЕЙСА SETI</div>
      <div style={{ fontSize: '10px', letterSpacing: '2px', color: '#005f58', marginBottom: '24px' }}>PROTOC_V.2.0.47 / SYSTEM_STABLE</div>

      {/* Waveform Section */}
      <div style={{
        width: '100%', maxWidth: '520px',
        border: '1px solid rgba(0,229,204,0.15)', background: 'rgba(0,229,204,0.03)',
        borderRadius: '6px', padding: '10px 15px', marginBottom: '15px', flexShrink: 0
      }}>
        <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#005f58', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={10} /> SIGNAL_WAVEFORM — 1420.405 MHz
        </div>
        <Waveform />
      </div>

      {/* Terminal Section */}
      <div className="glass-panel" style={{
        width: '100%', maxWidth: '520px', padding: '15px',
        border: '1px solid rgba(0,229,204,0.15)', background: 'rgba(0,5,5,0.8)',
        flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative',
        display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ fontSize: '9px', letterSpacing: '2px', color: '#005f58', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={12} /> ANALYSIS_SCRIPT — RUNNING
        </div>
        
        <div style={{ flex: 1, overflow: 'hidden', fontSize: '12px', lineHeight: '1.8', fontFamily: 'monospace' }}>
          {logs.map((log, i) => (
            <div key={i} style={{ 
              whiteSpace: 'nowrap', 
              color: log.cls === 'green' ? '#00e5cc' : log.cls === 'white' ? '#008c7a' : log.cls === 'dim' ? '#005f58' : log.cls === 'warn' ? '#e5a000' : log.cls === 'err' ? '#ff4466' : '#00e5cc' 
            }}>
              {log.text}
            </div>
          ))}
          <div style={{ marginTop: '2px' }}>
            <span style={{ color: '#00e5cc' }}>&gt;</span> <motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.7, repeat: Infinity }} style={{ display: 'inline-block', width: '8px', height: '14px', background: '#00e5cc', verticalAlign: 'middle' }} />
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div style={{ width: '100%', maxWidth: '520px', marginTop: '20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#005f58', letterSpacing: '1px', marginBottom: '6px' }}>
          <span>{statusText}</span>
          <span>{progress}%</span>
        </div>
        <div style={{ height: '3px', background: 'rgba(0,229,204,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
          <motion.div 
            animate={{ width: `${progress}%` }}
            transition={{ type: 'tween', ease: 'linear' }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #003d38, #00e5cc)', boxShadow: '0 0 10px rgba(0,229,204,0.5)' }} 
          />
        </div>
      </div>

      {/* Done Overlay */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'fixed', inset: 0, zHydrated: 1000000,
              background: 'rgba(3, 14, 18, 0.96)', backdropFilter: 'blur(10px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              zIndex: 1000000, padding: '20px'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: '18px', letterSpacing: '8px', fontWeight: '900', color: '#00e5cc', textTransform: 'uppercase', marginBottom: '24px' }}>
                ■ АНАЛИЗ ЗАВЕРШЁН
              </div>
              
              <div style={{ fontSize: '12px', lineHeight: '2.2', color: '#00a896', marginBottom: '40px', fontFamily: 'monospace' }}>
                FREQ SCANNED: <span style={{ color: '#00e5cc' }}>1420.405 MHz</span><br />
                PACKETS PROCESSED: <span style={{ color: '#00e5cc' }}>84 291</span><br />
                SIGNAL PATTERNS: <span style={{ color: '#00e5cc' }}>17</span><br />
                ANOMALIES DETECTED: <span style={{ color: '#ff4466' }}>2</span><br />
                ENTROPY: <span style={{ color: '#00e5cc' }}>6.82 bits — ВЫШЕ НОРМЫ</span><br />
                SOURCE: <span style={{ color: '#00e5cc' }}>RA 19h25m12s / Dec +31°</span>
              </div>

              <button 
                onClick={authStatus === 'none' ? handleLogin : undefined}
                style={{
                  background: 'transparent',
                  border: '1px solid #00a896',
                  color: '#00e5cc',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  letterSpacing: '0.4em',
                  padding: '16px 48px',
                  cursor: authStatus === 'none' ? 'pointer' : 'default',
                  textTransform: 'uppercase',
                  borderRadius: '4px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s'
                }}
              >
                {authStatus === 'none' && '▶ ВОЙТИ В СИСТЕМУ'}
                {authStatus === 'pending' && 'АВТОРИЗАЦИЯ...'}
                {authStatus === 'success' && '✓ ДОСТУП РАЗРЕШЁН'}
                
                {authStatus === 'none' && (
                  <motion.div
                    animate={{ left: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    style={{ position: 'absolute', top: 0, height: '100%', width: '100%', background: 'linear-gradient(90deg, transparent, rgba(0,229,204,0.2), transparent)' }}
                  />
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ position: 'absolute', bottom: '20px', fontSize: '8px', color: 'rgba(0,229,204,0.15)', letterSpacing: '4px', textTransform: 'uppercase' }}>
        SETI SIGNAL ANALYSIS PROTOCOL ACTIVE // ENCRYPTION AES-256
      </div>
    </div>
  );
};
