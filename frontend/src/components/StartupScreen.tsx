import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Activity, Zap, Cpu, Satellite, ShieldCheck, ChevronRight } from 'lucide-react';
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

const Waveform = ({ isMobile }: { isMobile: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const start = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Cache the primary color once — reading CSS vars on every frame is expensive
    const primary = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary').trim() || '#00f5ff';

    let wt = 0;
    let animationId: number;
    let lastTime = 0;
    // Throttle: 30fps on mobile (saves ~50% GPU on phones), 60fps on desktop
    const targetFps = isMobile ? 30 : 60;
    const frameInterval = 1000 / targetFps;
    // Step: skip every other pixel on mobile — visually identical, 2x fewer ops
    const step = isMobile ? 2 : 1;

    const render = (timestamp: number) => {
      animationId = requestAnimationFrame(render);
      const delta = timestamp - lastTime;
      if (delta < frameInterval) return; // throttle
      lastTime = timestamp - (delta % frameInterval);

      const W = canvas.width;
      const H = canvas.height;
      const elapsed = Date.now() - start.current;
      const anomaly = elapsed > 3300;

      // Fill background (canvas context is opaque for performance)
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.clearRect(0, 0, W, H);

      ctx.strokeStyle = primary;
      ctx.lineWidth = isMobile ? 1.5 : 2;
      ctx.shadowColor = primary;
      ctx.shadowBlur = anomaly ? 12 : 4;
      ctx.beginPath();
      for (let x = 0; x < W; x += step) {
        const p = x / W;
        const s1 = Math.sin(p * (isMobile ? 6 : 12) + wt * 4) * 0.5;
        const s2 = Math.sin(p * 5 + wt * 2) * 0.2;
        const s3 = Math.sin(p * 2 + wt * 3) * 0.1;
        const noise = (Math.random() - 0.5) * (anomaly ? 0.18 : 0.03);
        const spike = anomaly ? Math.sin(p * 50 + wt * 10) * 0.3 * Math.sin(wt) : 0;
        const y = H / 2 + (s1 + s2 + s3 + noise + spike) * H * 0.35;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      wt += isMobile ? 0.06 : 0.08;
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [isMobile]);

  return <canvas ref={canvasRef} width={800} height={isMobile ? 80 : 100} style={{ width: '100%', height: isMobile ? '36px' : '56px', display: 'block' }} />;
};

export const StartupScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('ИНИЦИАЛИЗАЦИЯ...');
  const [isDone, setIsDone] = useState(false);
  const [authStatus, setAuthStatus] = useState<'none' | 'pending' | 'success'>('none');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isVerySmall, setIsVerySmall] = useState(window.innerWidth <= 380);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsVerySmall(window.innerWidth <= 380);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const logLimit = isVerySmall ? 5 : (isMobile ? 7 : 12);
    SCRIPT.forEach(s => {
      setTimeout(() => {
        setLogs(prev => [...prev, s].slice(-logLimit));
      }, s.t);
    });

    PROG_STEPS.forEach(s => {
      setTimeout(() => {
        setProgress(s.pct);
        setStatusText(s.txt);
      }, s.t);
    });

    setTimeout(() => setIsDone(true), 5100);
  }, [isMobile, isVerySmall]);

  const handleLogin = () => {
    // Attempt haptic feedback if available (Capacitor or Web API)
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    setAuthStatus('pending');
    setTimeout(() => {
      setAuthStatus('success');
      setTimeout(onComplete, 800);
    }, 1500);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--bg)', zIndex: 999999,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: "'Space Grotesk', sans-serif",
      color: 'var(--primary)', 
      padding: isMobile ? '12px 16px' : '20px', 
      paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
      overflow: 'hidden',
      touchAction: 'none'
    }}>
      {/* Animated Hologram Grid Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: isMobile ? '25px 25px' : '50px 50px', pointerEvents: 'none', opacity: 0.15
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at center, transparent 30%, var(--bg) 100%)',
        pointerEvents: 'none', zIndex: 1
      }} />

      {/* Moving Scan Beam */}
      <motion.div
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
        style={{ 
          position: 'absolute', left: 0, right: 0, height: '1.5px', 
          background: 'linear-gradient(90deg, transparent, var(--primary), transparent)', 
          boxShadow: '0 0 15px var(--primary)', zIndex: 2, opacity: 0.4 
        }}
      />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '20px', marginBottom: isMobile ? '12px' : '25px' }}>
          <motion.div 
            animate={{ rotateY: 360 }} 
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            style={{ width: isMobile ? '45px' : '80px', height: isMobile ? '45px' : '80px', flexShrink: 0 }}
          >
            <SetiLogo size={isMobile ? 45 : 80} />
          </motion.div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="neon-text" style={{ fontSize: isMobile ? '1rem' : '1.4rem', fontWeight: '900', letterSpacing: isMobile ? '2px' : '4px', textTransform: 'uppercase', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>SETI ANALYZER</h1>
            <div style={{ fontSize: '0.55rem', letterSpacing: '1px', color: 'var(--secondary)', opacity: 0.8 }}>SYSTEM_INIT // PROTOCOL_V.2.0.47</div>
          </div>
          {!isMobile && (
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>LOCATION</div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700' }}>SECTOR-7G</div>
            </div>
          )}
        </div>

        {/* Top Info Cards - Responsive Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isMobile ? '8px' : '12px', marginBottom: isMobile ? '12px' : '20px' }}>
          {[
            { icon: <Zap size={isMobile ? 12 : 14} />, label: 'NRG', val: '98%' },
            { icon: <Cpu size={isMobile ? 12 : 14} />, label: 'CPU', val: '12%' },
            { icon: <Satellite size={isMobile ? 12 : 14} />, label: 'SIG', val: 'LOCK' }
          ].map((item, i) => (
            <div key={i} className="glass-panel" style={{ 
              padding: isMobile ? '8px' : '12px', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '4px',
              border: '1px solid var(--border)', 
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div style={{ color: 'var(--primary)', opacity: 0.8 }}>{item.icon}</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.5rem', opacity: 0.5, fontWeight: '700', letterSpacing: '1px' }}>{item.label}</div>
                <div style={{ fontSize: isMobile ? '0.7rem' : '0.85rem', fontWeight: '900' }}>{item.val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Waveform Section */}
        <div className="glass-panel" style={{ padding: isMobile ? '8px 12px' : '15px', marginBottom: isMobile ? '10px' : '15px', border: '1px solid var(--border)', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '4px' : '10px' }}>
            <div style={{ fontSize: isMobile ? '0.55rem' : '0.7rem', fontWeight: '800', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={10} /> WAVEFORM_LIVE
            </div>
            <div style={{ fontSize: '0.5rem', opacity: 0.6, fontFamily: 'monospace' }}>1.42GHz</div>
          </div>
          <Waveform isMobile={isMobile} />
        </div>

        {/* Terminal Section - Fills remaining space */}
        <div className="glass-panel" style={{ 
          flex: 1, padding: isMobile ? '12px' : '20px', overflow: 'hidden', minHeight: 0,
          border: '1px solid var(--border)', background: 'rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column', borderRadius: '14px'
        }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--secondary)', marginBottom: isMobile ? '8px' : '15px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
            <Terminal size={12} /> EXECUTING_KERN_INIT...
          </div>
          <div style={{ flex: 1, overflow: 'hidden', fontFamily: 'monospace', fontSize: isMobile ? '0.7rem' : '0.85rem', lineHeight: isMobile ? '1.5' : '1.8' }}>
            {logs.map((log, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -5 }} 
                animate={{ opacity: 1, x: 0 }} 
                key={i} 
                style={{ 
                  color: log.cls === 'green' ? 'var(--primary)' : 
                         log.cls === 'white' ? 'var(--text)' : 
                         log.cls === 'dim' ? 'var(--text-secondary)' : 
                         log.cls === 'warn' ? '#ffcc00' : 
                         log.cls === 'err' ? 'var(--accent)' : 'var(--primary)',
                  textShadow: log.cls === 'green' ? 'var(--glow)' : 'none',
                  whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden',
                  marginBottom: isVerySmall ? '2px' : '4px'
                }}
              >
                {log.text}
              </motion.div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ color: 'var(--primary)' }}>&gt;</span>
              <motion.div animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} style={{ width: '6px', height: '12px', background: 'var(--primary)', boxShadow: 'var(--glow)' }} />
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div style={{ marginTop: isMobile ? '12px' : '20px', paddingBottom: isMobile ? '10px' : '0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? '0.6rem' : '0.75rem', fontWeight: '900', marginBottom: '6px' }}>
            <span style={{ letterSpacing: '1px', color: 'var(--text-secondary)' }}>{statusText}</span>
            <span style={{ color: 'var(--secondary)' }}>{progress}%</span>
          </div>
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <motion.div 
              animate={{ width: `${progress}%` }} 
              style={{ 
                height: '100%', 
                background: 'linear-gradient(90deg, var(--secondary), var(--primary))', 
                boxShadow: '0 0 10px var(--primary)' 
              }} 
            />
          </div>
        </div>
      </div>

      {/* Final Analysis Report Overlay - Ultra Optimized for Mobile */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000000,
              background: 'rgba(3, 3, 12, 0.98)',
              backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              padding: isMobile ? '12px' : '20px'
            }}
          >
            <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              style={{ width: '100%', maxWidth: '380px', position: 'relative', zIndex: 10 }}
            >
              <div className="glass-panel" style={{ padding: isMobile ? '25px 20px' : '40px', border: '1px solid var(--border-bright)', boxShadow: 'var(--glow-strong)', borderRadius: '24px' }}>
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }} 
                  transition={{ repeat: Infinity, duration: 4 }}
                  style={{ marginBottom: isMobile ? '15px' : '30px', display: 'flex', justifyContent: 'center' }}
                >
                  <SetiLogo size={isMobile ? 65 : 100} />
                </motion.div>

                <h2 className="neon-text" style={{ fontSize: isMobile ? '1.1rem' : '1.5rem', fontWeight: '900', letterSpacing: isMobile ? '4px' : '8px', marginBottom: '8px', textAlign: 'center' }}>ANALYSIS_COMPLETE</h2>
                <div style={{ fontSize: '0.55rem', letterSpacing: '3px', color: 'var(--secondary)', marginBottom: isMobile ? '15px' : '25px', opacity: 0.8, textAlign: 'center' }}>SIGNAL_INTEGRITY: 99.8% ✓</div>
                
                <div style={{ 
                  textAlign: 'left', background: 'rgba(255,255,255,0.03)', 
                  padding: isMobile ? '14px' : '20px', borderRadius: '16px', 
                  border: '1px solid rgba(255,255,255,0.06)', marginBottom: isMobile ? '20px' : '30px', 
                  fontSize: isMobile ? '0.7rem' : '0.8rem', fontFamily: 'monospace', lineHeight: '1.8' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.6 }}>FREQ:</span> <span style={{ color: 'var(--primary)', fontWeight: '700' }}>1420.4 MHz</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.6 }}>PKTS:</span> <span style={{ color: 'var(--primary)', fontWeight: '700' }}>84,291</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.6 }}>PTRNS:</span> <span style={{ color: 'var(--primary)', fontWeight: '700' }}>17 ID'd</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.6 }}>ANMLY:</span> <span style={{ color: 'var(--accent)', fontWeight: '700' }}>2 DETECTED</span></div>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.6 }}>ORIGIN:</span> <span style={{ color: 'var(--secondary)', fontWeight: '700' }}>GC-S7G</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ opacity: 0.6 }}>STATUS:</span> <span style={{ color: '#00ff88', fontWeight: '900' }}>AUTHORIZED</span></div>
                </div>

                <motion.button 
                  whileTap={{ scale: 0.97 }}
                  onClick={authStatus === 'none' ? handleLogin : undefined}
                  className="btn-primary"
                  style={{ 
                    width: '100%', height: isMobile ? '52px' : '60px', 
                    fontSize: isMobile ? '0.85rem' : '1rem', letterSpacing: '4px', 
                    position: 'relative', borderRadius: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                  }}
                >
                  {authStatus === 'none' && <><ShieldCheck size={isMobile ? 18 : 20} /> ENTER_SYSTEM <ChevronRight size={16} /></>}
                  {authStatus === 'pending' && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Satellite size={18} /></motion.div>}
                  {authStatus === 'pending' && ' AUTHORIZING...'}
                  {authStatus === 'success' && '✓ ACCESS_GRANTED'}
                  
                  {authStatus === 'none' && (
                    <motion.div 
                      animate={{ left: ['-100%', '100%'] }} 
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      style={{ position: 'absolute', top: 0, bottom: 0, width: '30%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} 
                    />
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle Bottom Watermark - Mobile optimized */}
      <div style={{ 
        position: 'absolute', bottom: isMobile ? 'calc(env(safe-area-inset-bottom) + 5px)' : '15px', 
        fontSize: '0.45rem', letterSpacing: isMobile ? '2px' : '4px', 
        opacity: 0.15, fontWeight: '700', textTransform: 'uppercase' 
      }}>
        SECURE_CONNECTION_STABLISHED_//_SETI_OS
      </div>
    </div>
  );
};
