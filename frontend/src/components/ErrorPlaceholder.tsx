import { motion } from 'framer-motion';
import { WifiOff, MapPinOff, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  type: '404' | 'offline' | 'error';
  message?: string;
  onRetry?: () => void;
}

const ErrorPlaceholder: React.FC<Props> = ({ type, message, onRetry }) => {
  const navigate = useNavigate();

  const config = {
    '404': {
      icon: MapPinOff,
      title: 'СИГНАЛ ПОТЕРЯН',
      subtitle: 'Координаты не найдены в этой звездной системе.',
      buttonText: 'Вернуться на базу',
      action: () => navigate('/')
    },
    'offline': {
      icon: WifiOff,
      title: 'РАЗРЫВ СВЯЗИ',
      subtitle: 'Ваш терминал находится вне зоны покрытия SETI.',
      buttonText: 'Повторить сканирование',
      action: onRetry || (() => window.location.reload())
    },
    'error': {
      icon: AlertCircle,
      title: 'КРИТИЧЕСКИЙ СБОЙ',
      subtitle: 'Обнаружена аномалия в основном потоке данных.',
      buttonText: 'Перезагрузить систему',
      action: () => window.location.reload()
    }
  };

  const { icon: Icon, title, subtitle, buttonText, action } = config[type];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '40px 20px',
      textAlign: 'center',
      color: '#00f5ff',
      fontFamily: "'Space Grotesk', sans-serif"
    }}>
      <motion.div
        animate={{ 
          y: [0, -15, 0],
          opacity: [1, 0.8, 1],
          filter: [
            'drop-shadow(0 0 10px rgba(0, 245, 255, 0.4))',
            'drop-shadow(0 0 30px rgba(0, 245, 255, 0.2))',
            'drop-shadow(0 0 10px rgba(0, 245, 255, 0.4))'
          ]
        }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        style={{ marginBottom: '32px' }}
      >
        <div style={{
          position: 'relative',
          padding: '40px',
          background: 'rgba(0, 245, 255, 0.03)',
          border: '1px solid rgba(0, 245, 255, 0.1)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon size={80} strokeWidth={1.5} />
          {/* Glitch circles */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0, 0.2, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ position: 'absolute', inset: -10, border: '1px solid #00f5ff', borderRadius: '50%' }}
          />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          fontSize: '2rem',
          fontWeight: '900',
          letterSpacing: '4px',
          marginBottom: '12px',
          textShadow: '0 0 15px rgba(0, 245, 255, 0.5)'
        }}
      >
        {title}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          fontSize: '1rem',
          color: 'rgba(200, 210, 255, 0.6)',
          maxWidth: '300px',
          lineHeight: '1.6',
          marginBottom: '40px'
        }}
      >
        {message || subtitle}
      </motion.p>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={action}
        style={{
          background: 'linear-gradient(135deg, rgba(0, 245, 255, 0.1), rgba(180, 0, 255, 0.1))',
          border: '1px solid #00f5ff',
          padding: '14px 28px',
          borderRadius: '14px',
          color: '#00f5ff',
          fontSize: '0.9rem',
          fontWeight: '900',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 0 20px rgba(0, 245, 255, 0.2)',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}
      >
        {type === '404' ? <ArrowLeft size={18} /> : <RefreshCw size={18} />}
        {buttonText}
      </motion.button>

      {/* Decorative telemetry */}
      <div style={{
        marginTop: '60px',
        fontSize: '0.65rem',
        fontFamily: 'monospace',
        opacity: 0.3,
        letterSpacing: '2px'
      }}>
        ERROR_CODE_X00_{type.toUpperCase()} // STATUS: UNRESOLVED
      </div>
    </div>
  );
};

export default ErrorPlaceholder;
