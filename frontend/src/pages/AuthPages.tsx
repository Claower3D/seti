import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, LogIn, Smartphone, Globe, Download, Fingerprint, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import SetiLogo from '../components/SetiLogo';

// KZ number validation
// Kazakhstan mobile: +7 6xx xxxxxxx or +7 7xx xxxxxxx
const isValidKZNumber = (digits: string): boolean => {
  // digits = full number without +, e.g. 77001234567
  if (digits.length !== 11) return false;
  if (!digits.startsWith('7')) return false;
  const prefix = digits.slice(1, 3); // e.g. "70", "71", "76", "77"
  // KZ mobile prefixes: 700-709, 710-719, 720-729, 747, 750-758, 760-769, 770-779, 780-789
  const validPrefixes = [
    '70','71','72','73','74','75','76','77','78'
  ];
  return validPrefixes.some(p => prefix.startsWith(p[0]) && (p.length === 1 || prefix[1] === p[1] || true));
};

const formatKZPhone = (raw: string): string => {
  // raw = digits only after country code, max 10 digits
  if (raw.length <= 3) return raw;
  if (raw.length <= 6) return `${raw.slice(0,3)} ${raw.slice(3)}`;
  if (raw.length <= 8) return `${raw.slice(0,3)} ${raw.slice(3,6)} ${raw.slice(6)}`;
  return `${raw.slice(0,3)} ${raw.slice(3,6)} ${raw.slice(6,8)} ${raw.slice(8,10)}`;
};

const KZPhoneInput = ({ onChange }: { onChange: (phone: string, valid: boolean) => void; error?: string }) => {
  const [localNumber, setLocalNumber] = useState('');
  const [touched, setTouched] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setLocalNumber(raw);
    const fullDigits = '7' + raw;
    const valid = raw.length === 10 && isValidKZNumber(fullDigits);
    onChange('+7' + raw, valid);
  };

  const fullDigits = '7' + localNumber;
  const isValid = localNumber.length === 10 && isValidKZNumber(fullDigits);
  const showError = touched && localNumber.length > 0 && !isValid;
  const showSuccess = isValid;

  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        📱 Номер телефона
      </label>

      {/* Only KZ badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,242,255,0.08)', border: '1px solid rgba(0,242,255,0.2)', borderRadius: '20px', padding: '4px 12px' }}>
          <span style={{ fontSize: '1rem' }}>🇰🇿</span>
          <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--primary)' }}>Только казахстанские номера</span>
        </div>
      </div>

      <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
        {/* Fixed KZ code */}
        <div style={{ height: '52px', padding: '0 14px', background: 'rgba(0,242,255,0.06)', border: '1px solid rgba(0,242,255,0.3)', borderRadius: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '1rem', flexShrink: 0 }}>
          <span style={{ fontSize: '1.1rem' }}>🇰🇿</span>
          <span>+7</span>
        </div>

        {/* Number input */}
        <div style={{ position: 'relative', flex: 1 }}>
          <Phone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: showError ? '#ff4d4d' : showSuccess ? '#00c853' : 'var(--text-secondary)', pointerEvents: 'none', transition: 'color 0.2s' }} />
          <input
            type="tel"
            className="input-field"
            placeholder="700 000 00 00"
            style={{
              paddingLeft: '44px',
              paddingRight: '44px',
              height: '52px',
              width: '100%',
              letterSpacing: '0.05em',
              border: showError ? '1px solid rgba(255,77,77,0.5)' : showSuccess ? '1px solid rgba(0,200,83,0.5)' : undefined,
              transition: 'border-color 0.2s',
            }}
            value={formatKZPhone(localNumber)}
            onChange={handleChange}
            onBlur={() => setTouched(true)}
            required
          />
          {/* Status icon */}
          {showSuccess && (
            <CheckCircle size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#00c853' }} />
          )}
          {showError && (
            <AlertCircle size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#ff4d4d' }} />
          )}
        </div>
      </div>

      {/* Hint / error */}
      <AnimatePresence>
        {showError && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: '#ff4d4d', fontSize: '0.8rem', fontWeight: '600' }}>
            <AlertCircle size={13} />
            Введите корректный казахстанский номер (70x, 71x, 72x, 75x, 76x, 77x, 78x)
          </motion.div>
        )}
        {showSuccess && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: '#00c853', fontSize: '0.8rem', fontWeight: '600' }}>
            <CheckCircle size={13} />
            Номер подтверждён ✓
          </motion.div>
        )}
        {!showError && !showSuccess && localNumber.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Формат: +7 700 000 00 00
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Login Page ───────────────────────────────────────────────────────────────
export const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAppPrompt, setShowAppPrompt] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (window.innerWidth <= 768 && !Capacitor.isNativePlatform()) {
      setShowAppPrompt(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.post('/login', { identifier, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Неверный логин (телефон/ник) или пароль');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showAppPrompt) {
    return (
      <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-panel"
          style={{ width: '100%', maxWidth: '440px', padding: '3rem 2rem', border: '1px solid rgba(0,242,255,0.4)', boxShadow: '0 0 50px rgba(0,242,255,0.1)', textAlign: 'center' }}>
          <div className="pulse" style={{ background: 'color-mix(in srgb, var(--primary), transparent 85%)', border: '1px solid var(--primary)', padding: '20px', borderRadius: '50%', display: 'inline-block', marginBottom: '24px' }}>
            <Smartphone size={56} style={{ color: 'var(--primary)' }} />
          </div>
          <h1 className="neon-text" style={{ fontSize: '2.2rem', marginBottom: '16px' }}>SETI Mobile</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '32px', lineHeight: '1.5' }}>
            Обнаружено мобильное устройство. Установите официальное Android-приложение.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <a href="https://github.com/Claower3D/seti/releases/latest/download/SETI.apk" download style={{ textDecoration: 'none' }}>
              <button style={{ background: 'var(--primary)', color: 'black', width: '100%', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: 'var(--glow)' }}>
                <Download size={22} /> Скачать Приложение
              </button>
            </a>
            <button onClick={() => setShowAppPrompt(false)}
              style={{ background: 'rgba(255,255,255,0.05)', color: 'white', width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <Globe size={20} style={{ opacity: 0.7 }} /> Продолжить в браузере
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="glass-panel"
        style={{ width: '100%', maxWidth: '440px', padding: '3rem 2.5rem', border: '1px solid rgba(0,242,255,0.2)', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <SetiLogo size={80} style={{ marginBottom: '16px' }} />
          <h1 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-2px', marginBottom: '8px' }} className="neon-text">SETI</h1>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px', color: 'white' }}>Идентификация</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Введите ключи доступа для входа в сеть</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            style={{ color: '#ff4d4d', marginBottom: '1.5rem', textAlign: 'center', padding: '10px', background: 'rgba(255,77,77,0.05)', borderRadius: '12px', border: '1px solid rgba(255,77,77,0.2)', fontSize: '0.9rem' }}>
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input type="text" className="input-field" placeholder="Логин (Телефон или Username)"
              style={{ paddingLeft: '48px', height: '52px' }}
              value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input type="password" className="input-field" placeholder="Пароль доступа"
              style={{ paddingLeft: '48px', height: '52px' }}
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn-primary" type="submit" disabled={isSubmitting} style={{ height: '52px', justifyContent: 'center', fontSize: '1rem' }}>
            {isSubmitting ? 'Авторизация...' : <><LogIn size={20} /> Войти в SETI</>}
          </button>
        </form>

        <p style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Нет доступа? <Link to="/register" style={{ fontWeight: '800', color: 'var(--primary-color)', textDecoration: 'none' }} className="neon-text">Регистрация в матрице</Link>
        </p>
      </motion.div>
    </div>
  );
};

// ─── Register Page ────────────────────────────────────────────────────────────
export const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneValid, setPhoneValid] = useState(false);
  const [iin, setIin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handlePhoneChange = (value: string, valid: boolean) => {
    setPhone(value);
    setPhoneValid(valid);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phoneValid) {
      setError('Введите корректный казахстанский номер телефона (+7 7xx или +7 6xx)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/register', { username, phone, iin, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="glass-panel"
        style={{ width: '100%', maxWidth: '440px', padding: '3rem 2.5rem', border: '1px solid rgba(189,0,255,0.2)', boxShadow: '0 0 40px rgba(0,0,0,0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <SetiLogo size={80} style={{ marginBottom: '16px' }} />
          <h1 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-2px', marginBottom: '8px' }} className="neon-text-purple">SETI</h1>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px', color: 'white' }}>Новая Сущность</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Создайте свой цифровой отпечаток</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            style={{ color: '#ff4d4d', marginBottom: '1.5rem', textAlign: 'center', padding: '10px', background: 'rgba(255,77,77,0.05)', borderRadius: '12px', border: '1px solid rgba(255,77,77,0.2)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <AlertCircle size={16} /> {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Username */}
          <div style={{ position: 'relative' }}>
            <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input type="text" className="input-field" placeholder="Цифровое имя (Username)"
              style={{ paddingLeft: '48px', height: '52px' }}
              value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>

          {/* KZ Phone */}
          <KZPhoneInput onChange={handlePhoneChange} />



          {/* IIN */}
          <div style={{ position: 'relative' }}>
            <Fingerprint size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input type="text" className="input-field" placeholder="ИИН (12 цифр)"
              style={{ paddingLeft: '48px', height: '52px' }}
              value={iin}
              onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 12); setIin(val); }}
              required pattern="[0-9]{12}" title="ИИН должен состоять из 12 цифр" />
          </div>

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input type="password" className="input-field" placeholder="Криптографический пароль"
              style={{ paddingLeft: '48px', height: '52px' }}
              value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>

          <button className="btn-primary" type="submit"
            disabled={isSubmitting || !phoneValid}
            style={{ height: '52px', justifyContent: 'center', fontSize: '1rem', background: 'linear-gradient(135deg, var(--secondary-color), var(--accent-pink))', boxShadow: '0 0 15px rgba(189,0,255,0.4)', opacity: (!phoneValid) ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            {isSubmitting ? 'Генерация...' : <><LogIn size={20} /> Создать сущность</>}
          </button>
        </form>

        <p style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Уже в системе? <Link to="/login" style={{ fontWeight: '800', color: 'var(--secondary-color)', textDecoration: 'none' }} className="neon-text-purple">Идентификация</Link>
        </p>
      </motion.div>
    </div>
  );
};
