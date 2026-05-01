import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Activity, Zap, Cpu, Satellite, ShieldCheck } from 'lucide-react';
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
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let wt = 0;
    let animationId: number;

    const render = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const elapsed = Date.now() - start.current;
      const anomaly = elapsed > 3300;

      const primary = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#00f5ff';
      
      ctx.strokeStyle = primary;
      ctx.lineWidth = isMobile ? 1.5 : 2;
      ctx.shadowColor = primary;
      ctx.shadowBlur = anomaly ? 15 : 5;
      ctx.beginPath();
      for (let x = 0; x < W; x++) {
        const p = x / W;
        const s1 = Math.sin(p * (isMobile ? 8 : 12) + wt * 4) * 0.5;
        const s2 = Math.sin(p * 5 + wt * 2) * 0.2;
        const s3 = Math.sin(p * 2 + wt * 3) * 0.1;
        const noise = (Math.random() - 0.5) * (anomaly ? 0.2 : 0.04);
        const spike = anomaly ? Math.sin(p * 50 + wt * 10) * 0.3 * Math.sin(wt) : 0;
        const y = H / 2 + (s1 + s2 + s3 + noise + spike) * H * 0.35;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      wt += 0.08;
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isMobile]);

  return <canvas ref={canvasRef} width={800} height={isMobile ? 120 : 100} style={{ width: '100%', height: isMobile ? '50px' : '60px' }} />;
};

export const StartupScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('ИНИЦИАЛИЗАЦИЯ...');
  const [isDone, setIsDone] = useState(false);
  const [authStatus, setAuthStatus] = useState<'none' | 'pending' | 'success'>('none');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    SCRIPT.forEach(s => {
      setTimeout(() => {
        setLogs(prev => [...prev, s].slice(isMobile ? -8 : -12));
      }, s.t);
    });

    PROG_STEPS.forEach(s => {
      setTimeout(() => {
        setProgress(s.pct);
        setStatusText(s.txt);
      }, s.t);
    });

    setTimeout(() => setIsDone(true), 5100);
  }, [isMobile]);

  const handleLogin = () => {
    setAuthStatus('pending');
    setTimeout(() => {
      setAuthStatus('success');
      setTimeout(onComplete, 1000);
    }, 2000);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--bg)', zIndex: 999999,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: "'Space Grotesk', sans-serif",
      color: 'var(--primary)', padding: isMobile ? '12px' : '20px', overflow: 'hidden'
    }}>
      {/* Animated Hologram Grid Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
        backgroundSize: isMobile ? '30px 30px' : '50px 50px', pointerEvents: 'none', opacity: 0.2
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at center, transparent 30%, var(--bg) 100%)',
        pointerEvents: 'none', zIndex: 1
      }} />

      {/* Moving Scan Beam */}
      <motion.div
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        style={{ 
          position: 'absolute', left: 0, right: 0, height: '2px', 
          background: 'linear-gradient(90deg, transparent, var(--primary), transparent)', 
          boxShadow: '0 0 20px var(--primary)', zIndex: 2, opacity: 0.4 
        }}
      />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '20px', marginBottom: isMobile ? '15px' : '30px', marginTop: isMobile ? '10px' : '20px' }}>
          <motion.div 
            animate={{ rotateY: 360 }} 
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            style={{ width: isMobile ? '50px' : '80px', height: isMobile ? '50px' : '80px', flexShrink: 0 }}
          >
            <SetiLogo size={isMobile ? 50 : 80} />
          </motion.div>
          <div style={{ flex: 1 }}>
            <h1 className="neon-text" style={{ fontSize: isMobile ? '1.1rem' : '1.4rem', fontWeight: '900', letterSpacing: isMobile ? '2px' : '4px', textTransform: 'uppercase', margin: 0 }}>SETI ANALYZER</h1>
            <div style={{ fontSize: '0.6rem', letterSpacing: '1px', color: 'var(--secondary)', opacity: 0.8 }}>SYSTEM_INIT // V.2.0.47</div>
          </div>
          {!isMobile && (
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>LOCATION</div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700' }}>SECTOR-7G</div>
            </div>
          )}
        </div>

        {/* Top Info Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: isMobile ? '6px' : '10px', marginBottom: isMobile ? '10px' : '15px' }}>
          {[
            { icon: <Zap size={isMobile ? 12 : 14} />, label: 'ENERGY', val: '98%' },
            { icon: <Cpu size={isMobile ? 12 : 14} />, label: 'LOAD', val: '12%' },
            { icon: <Satellite size={isMobile ? 12 : 14} />, label: 'SIGNAL', val: 'STABLE' }
          ].map((item, i) => (
            <div key={i} className="glass-panel" style={{ padding: isMobile ? '6px 8px' : '10px', display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px', border: '1px solid var(--border)' }}>
              <div style={{ color: 'var(--secondary)', flexShrink: 0 }}>{item.icon}</div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '0.45rem', opacity: 0.5, textTransform: 'uppercase' }}>{item.label}</div>
                <div style={{ fontSize: isMobile ? '0.65rem' : '0.8rem', fontWeight: '700' }}>{item.val}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Waveform Visualization */}
        <div className="glass-panel" style={{ padding: isMobile ? '10px' : '15px', marginBottom: isMobile ? '10px' : '15px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '6px' : '10px' }}>
            <div style={{ fontSize: isMobile ? '0.6rem' : '0.7rem', fontWeight: '700', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={10} /> SIGNAL WAVEFORM
            </div>
            <div style={{ fontSize: '0.55rem', opacity: 0.6 }}>1420.405 MHz</div>
          </div>
          <Waveform isMobile={isMobile} />
        </div>

        {/* Terminal Section */}
        <div className="glass-panel" style={{ 
          flex: 1, padding: isMobile ? '12px' : '20px', overflow: 'hidden', minHeight: 0,
          border: '1px solid var(--border)', background: 'rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--secondary)', marginBottom: isMobile ? '8px' : '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={12} /> KERNEL_EXECUTING...
          </div>
          <div style={{ flex: 1, overflow: 'hidden', fontFamily: 'monospace', fontSize: isMobile ? '0.75rem' : '0.85rem', lineHeight: '1.6' }}>
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
                  whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'
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

        {/* Progress Footer */}
        <div style={{ marginTop: isMobile ? '15px' : '20px', marginBottom: isMobile ? '10px' : '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? '0.65rem' : '0.75rem', fontWeight: '700', marginBottom: '6px' }}>
            <span style={{ letterSpacing: '1px' }}>{statusText}</span>
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

      {/* Final Analysis Report Overlay */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000000,
              background: 'rgba(5, 5, 16, 0.98)',
              backdropFilter: 'blur(15px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
            }}
          >
            <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 10, textAlign: 'center' }}
            >
              <div className="glass-panel" style={{ padding: isMobile ? '25px 20px' : '40px', border: '1px solid var(--border-bright)', boxShadow: 'var(--glow-strong)' }}>
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }} 
                  transition={{ repeat: Infinity, duration: 3 }}
                  style={{ marginBottom: isMobile ? '20px' : '30px' }}
                >
                  <SetiLogo size={isMobile ? 70 : 100} />
                </motion.div>

                <h2 className="neon-text" style={{ fontSize: isMobile ? '1.2rem' : '1.6rem', fontWeight: '900', letterSpacing: isMobile ? '4px' : '8px', marginBottom: '10px' }}>ANALYSIS COMPLETE</h2>
                <div style={{ fontSize: '0.6rem', letterSpacing: '3px', color: 'var(--secondary)', marginBottom: isMobile ? '20px' : '30px', opacity: 0.8 }}>INTEGRITY_VERIFIED_✓</div>
                
                <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', padding: isMobile ? '15px' : '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: isMobile ? '25px' : '30px', fontSize: isMobile ? '0.75rem' : '0.85rem', fontFamily: 'monospace', lineHeight: '1.8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SCANNED:</span> <span style={{ color: 'var(--primary)' }}>1420.4 MHz</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>PACKETS:</span> <span style={{ color: 'var(--primary)' }}>84,291</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>PATTERNS:</span> <span style={{ color: 'var(--primary)' }}>17 ID'd</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>ANOMALIES:</span> <span style={{ color: 'var(--accent)' }}>2 DETECTED</span></div>
                  <div style={{ height: '1px', background: 'var(--border)', margin: '8px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SOURCE:</span> <span style={{ color: 'var(--secondary)' }}>GC-SECTOR</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>STATUS:</span> <span style={{ color: '#00ff88' }}>GRANTED</span></div>
                </div>

                <button 
                  onClick={authStatus === 'none' ? handleLogin : undefined}
                  className="btn-primary"
                  style={{ width: '100%', height: isMobile ? '48px' : '56px', fontSize: isMobile ? '0.8rem' : '1rem', letterSpacing: '3px', position: 'relative' }}
                >
                  {authStatus === 'none' && <><ShieldCheck size={isMobile ? 16 : 18} /> ENTER_SYSTEM</>}
                  {authStatus === 'pending' && 'AUTHORIZING...'}
                  {authStatus === 'success' && '✓ ACCESS_GRANTED'}
                  
                  {authStatus === 'none' && (
                    <motion.div 
                      animate={{ left: ['-100%', '100%'] }} 
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      style={{ position: 'absolute', top: 0, bottom: 0, width: '40%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} 
                    />
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle Bottom Watermark */}
      {!isMobile && (
        <div style={{ position: 'absolute', bottom: '20px', fontSize: '0.5rem', letterSpacing: '4px', opacity: 0.2, fontWeight: '700' }}>
          SECURE_CONNECTION_STABLISHED_//_SETI_HOLOGRAPHIC_INTERFACE
        </div>
      )}
    </div>
  );
};
