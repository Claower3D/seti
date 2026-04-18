import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, LogIn, Smartphone, Globe, Download } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAppPrompt, setShowAppPrompt] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Only detect mobile devices
    if (window.innerWidth <= 768) {
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
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="glass-panel" 
          style={{ width: '100%', maxWidth: '440px', padding: '3rem 2rem', border: '1px solid rgba(0, 242, 255, 0.4)', boxShadow: '0 0 50px rgba(0, 242, 255, 0.1)', textAlign: 'center' }}
        >
          <div className="pulse" style={{ background: 'color-mix(in srgb, var(--primary), transparent 85%)', border: '1px solid var(--primary)', padding: '20px', borderRadius: '50%', display: 'inline-block', marginBottom: '24px', boxShadow: 'var(--glow-strong)' }}>
            <Smartphone size={56} style={{ color: 'var(--primary)', filter: 'var(--glow)' }} />
          </div>
          
          <h1 className="neon-text" style={{ fontSize: '2.2rem', marginBottom: '16px' }}>SETI Mobile</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '32px', lineHeight: '1.5' }}>
            Обнаружено мобильное устройство. Установите официальное Android-приложение для максимальной скорости и безопасности.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <a href="https://github.com/Claower3D/seti/releases/download/latest/seti-app.apk" style={{ textDecoration: 'none' }}>
              <button style={{ 
                  background: 'var(--primary)', color: 'black', width: '100%', padding: '16px', borderRadius: '12px', border: 'none', fontWeight: '900', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: 'var(--glow)'
              }}>
                <Download size={22} /> Скачать Приложение
              </button>
            </a>

            <button 
              onClick={() => setShowAppPrompt(false)}
              style={{ 
                background: 'rgba(255,255,255,0.05)', color: 'white', width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontWeight: '600', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <Globe size={20} style={{ opacity: 0.7 }} /> Продолжить в браузере
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel" 
        style={{ width: '100%', maxWidth: '440px', padding: '3rem 2.5rem', border: '1px solid rgba(0, 242, 255, 0.2)', boxShadow: '0 0 40px rgba(0, 0, 0, 0.5)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-2px', marginBottom: '8px' }} className="neon-text">SETI</h1>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px', color: 'white' }}>Идентификация</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Введите ключи доступа для входа в сеть</p>
        </div>
        
        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ color: '#ff4d4d', marginBottom: '1.5rem', textAlign: 'center', padding: '10px', background: 'rgba(255, 77, 77, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 77, 77, 0.2)', fontSize: '0.9rem' }}
          >
            {error}
          </motion.div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="email" 
              className="input-field" 
              placeholder="Системный Email" 
              style={{ paddingLeft: '48px', height: '52px' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="password" 
              className="input-field" 
              placeholder="Пароль доступа" 
              style={{ paddingLeft: '48px', height: '52px' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
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
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError('');
      try {
        const res = await api.post('/register', { username, email, password });
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
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel" 
          style={{ width: '100%', maxWidth: '440px', padding: '3rem 2.5rem', border: '1px solid rgba(189, 0, 255, 0.2)', boxShadow: '0 0 40px rgba(0, 0, 0, 0.5)' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h1 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-2px', marginBottom: '8px' }} className="neon-text-purple">SETI</h1>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px', color: 'white' }}>Новая Сущность</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Создайте свой цифровой отпечаток</p>
          </div>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ color: '#ff4d4d', marginBottom: '1.5rem', textAlign: 'center', padding: '10px', background: 'rgba(255, 77, 77, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 77, 77, 0.2)', fontSize: '0.9rem' }}
            >
              {error}
            </motion.div>
          )}
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                className="input-field" 
                placeholder="Цифровое имя (Username)" 
                style={{ paddingLeft: '48px', height: '52px' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="email" 
                className="input-field" 
                placeholder="Email для синхронизации" 
                style={{ paddingLeft: '48px', height: '52px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                className="input-field" 
                placeholder="Криптографический пароль" 
                style={{ paddingLeft: '48px', height: '52px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button className="btn-primary" type="submit" disabled={isSubmitting} style={{ height: '52px', justifyContent: 'center', fontSize: '1rem', background: 'linear-gradient(135deg, var(--secondary-color), var(--accent-pink))', boxShadow: '0 0 15px rgba(189, 0, 255, 0.4)' }}>
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

