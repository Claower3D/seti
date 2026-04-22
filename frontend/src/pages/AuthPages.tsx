import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, LogIn, Smartphone, Globe, Download, Fingerprint, Phone, ChevronDown } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import SetiLogo from '../components/SetiLogo';

// Country codes list
const COUNTRY_CODES = [
  { code: '+7', flag: '🇷🇺', name: 'Россия' },
  { code: '+7', flag: '🇰🇿', name: 'Казахстан' },
  { code: '+375', flag: '🇧🇾', name: 'Беларусь' },
  { code: '+380', flag: '🇺🇦', name: 'Украина' },
  { code: '+1', flag: '🇺🇸', name: 'США' },
  { code: '+44', flag: '🇬🇧', name: 'Великобритания' },
  { code: '+49', flag: '🇩🇪', name: 'Германия' },
  { code: '+33', flag: '🇫🇷', name: 'Франция' },
  { code: '+86', flag: '🇨🇳', name: 'Китай' },
  { code: '+90', flag: '🇹🇷', name: 'Турция' },
  { code: '+971', flag: '🇦🇪', name: 'ОАЭ' },
  { code: '+998', flag: '🇺🇿', name: 'Узбекистан' },
  { code: '+992', flag: '🇹🇯', name: 'Таджикистан' },
  { code: '+996', flag: '🇰🇬', name: 'Кыргызстан' },
  { code: '+994', flag: '🇦🇿', name: 'Азербайджан' },
  { code: '+374', flag: '🇦🇲', name: 'Армения' },
  { code: '+995', flag: '🇬🇪', name: 'Грузия' },
];

const PhoneInput = ({ onChange }: { onChange: (phone: string) => void }) => {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[1]); // Kazakhstan default
  const [showDropdown, setShowDropdown] = useState(false);
  const [localNumber, setLocalNumber] = useState('');

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setLocalNumber(raw);
    onChange(selectedCountry.code + raw);
  };

  const handleCountrySelect = (country: typeof COUNTRY_CODES[0]) => {
    setSelectedCountry(country);
    setShowDropdown(false);
    onChange(country.code + localNumber);
  };

  // Format number as user types: 701 234 56 78
  const formatDisplay = (num: string) => {
    if (num.length <= 3) return num;
    if (num.length <= 6) return `${num.slice(0, 3)} ${num.slice(3)}`;
    if (num.length <= 8) return `${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`;
    return `${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6, 8)} ${num.slice(8)}`;
  };

  return (
    <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
      {/* Country code selector */}
      <div style={{ position: 'relative' }}>
        <button type="button" onClick={() => setShowDropdown(d => !d)}
          style={{ height: '52px', padding: '0 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '0.95rem', whiteSpace: 'nowrap', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
        >
          <span style={{ fontSize: '1.2rem' }}>{selectedCountry.flag}</span>
          <span style={{ color: 'var(--primary)' }}>{selectedCountry.code}</span>
          <ChevronDown size={14} style={{ opacity: 0.5, transform: showDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {showDropdown && (
          <div style={{ position: 'absolute', top: '56px', left: 0, zIndex: 100, background: '#0d1117', border: '1px solid rgba(0,242,255,0.2)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.8)', width: '220px', maxHeight: '260px', overflowY: 'auto' }}>
            {COUNTRY_CODES.map((c, i) => (
              <button key={i} type="button" onClick={() => handleCountrySelect(c)}
                style={{ width: '100%', background: selectedCountry.code === c.code && selectedCountry.name === c.name ? 'rgba(0,242,255,0.08)' : 'none', border: 'none', color: 'white', padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', textAlign: 'left', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = selectedCountry.name === c.name ? 'rgba(0,242,255,0.08)' : 'none'}
              >
                <span style={{ fontSize: '1.2rem' }}>{c.flag}</span>
                <span style={{ flex: 1, fontWeight: '600' }}>{c.name}</span>
                <span style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem' }}>{c.code}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Number input */}
      <div style={{ position: 'relative', flex: 1 }}>
        <Phone size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
        <input
          type="tel"
          className="input-field"
          placeholder="700 000 00 00"
          style={{ paddingLeft: '44px', height: '52px', width: '100%', letterSpacing: '0.05em' }}
          value={formatDisplay(localNumber)}
          onChange={handleNumberChange}
          required
        />
      </div>
    </div>
  );
};

export const LoginPage = () => {
  const [email, setEmail] = useState('');
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
      const res = await api.post('/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showAppPrompt) {
    return (
      <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-panel"
          style={{ width: '100%', maxWidth: '440px', padding: '3rem 2rem', border: '1px solid rgba(0, 242, 255, 0.4)', boxShadow: '0 0 50px rgba(0, 242, 255, 0.1)', textAlign: 'center' }}>
          <div className="pulse" style={{ background: 'color-mix(in srgb, var(--primary), transparent 85%)', border: '1px solid var(--primary)', padding: '20px', borderRadius: '50%', display: 'inline-block', marginBottom: '24px', boxShadow: 'var(--glow-strong)' }}>
            <Smartphone size={56} style={{ color: 'var(--primary)', filter: 'var(--glow)' }} />
          </div>
          <h1 className="neon-text" style={{ fontSize: '2.2rem', marginBottom: '16px' }}>SETI Mobile</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '32px', lineHeight: '1.5' }}>
            Обнаружено мобильное устройство. Установите официальное Android-приложение для максимальной скорости и безопасности.
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
        style={{ width: '100%', maxWidth: '440px', padding: '3rem 2.5rem', border: '1px solid rgba(0, 242, 255, 0.2)', boxShadow: '0 0 40px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <SetiLogo size={80} style={{ marginBottom: '16px' }} />
          <h1 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-2px', marginBottom: '8px' }} className="neon-text">SETI</h1>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px', color: 'white' }}>Идентификация</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Введите ключи доступа для входа в сеть</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            style={{ color: '#ff4d4d', marginBottom: '1.5rem', textAlign: 'center', padding: '10px', background: 'rgba(255, 77, 77, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 77, 77, 0.2)', fontSize: '0.9rem' }}>
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input type="email" className="input-field" placeholder="Системный Email"
              style={{ paddingLeft: '48px', height: '52px' }}
              value={email} onChange={(e) => setEmail(e.target.value)} required />
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

export const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [iin, setIin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Validate phone
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Введите корректный номер телефона');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await api.post('/register', { username, email, phone, iin, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="glass-panel"
        style={{ width: '100%', maxWidth: '440px', padding: '3rem 2.5rem', border: '1px solid rgba(189, 0, 255, 0.2)', boxShadow: '0 0 40px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <SetiLogo size={80} style={{ marginBottom: '16px' }} />
          <h1 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-2px', marginBottom: '8px' }} className="neon-text-purple">SETI</h1>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px', color: 'white' }}>Новая Сущность</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Создайте свой цифровой отпечаток</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            style={{ color: '#ff4d4d', marginBottom: '1.5rem', textAlign: 'center', padding: '10px', background: 'rgba(255, 77, 77, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 77, 77, 0.2)', fontSize: '0.9rem' }}>
            {error}
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

          {/* Phone — main field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              📱 Номер телефона
            </label>
            <PhoneInput value={phone} onChange={setPhone} />
          </div>

          {/* Email */}
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input type="email" className="input-field" placeholder="Email для синхронизации"
              style={{ paddingLeft: '48px', height: '52px' }}
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

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

          <button className="btn-primary" type="submit" disabled={isSubmitting}
            style={{ height: '52px', justifyContent: 'center', fontSize: '1rem', background: 'linear-gradient(135deg, var(--secondary-color), var(--accent-pink))', boxShadow: '0 0 15px rgba(189, 0, 255, 0.4)' }}>
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