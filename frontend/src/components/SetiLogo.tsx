import React from 'react';

interface SetiLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const SetiLogo: React.FC<SetiLogoProps> = ({ size = 40, showText = false, className, style }) => {
  const id = React.useId().replace(/:/g, '');

  return (
    <svg
      width={showText ? size * 3.5 : size}
      height={size}
      viewBox={showText ? '0 0 140 40' : '0 0 40 40'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="SETI Logo"
    >
      <defs>
        {/* Primary glow gradient */}
        <radialGradient id={`glow-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </radialGradient>

        {/* Dish line gradient: primary → secondary */}
        <linearGradient id={`dish-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--secondary)" />
        </linearGradient>

        {/* Signal arc gradient: primary → secondary */}
        <linearGradient id={`arc-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.4" />
        </linearGradient>

        {/* Filter for neon glow effect */}
        <filter id={`neon-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Stronger glow for focal dot */}
        <filter id={`dot-glow-${id}`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ══ ICON (40×40) ══ */}

      {/* Background radial glow */}
      <circle cx="20" cy="20" r="20" fill={`url(#glow-${id})`} />

      {/* Signal arcs — fanning out from dish focal point (14, 26) */}
      {[10, 15, 20].map((r, i) => (
        <path
          key={i}
          d={`M ${14 - r * 0.6} ${26 - r * 0.6} A ${r} ${r} 0 0 1 ${14 + r * 0.85} ${26 - r * 0.85}`}
          stroke={`url(#arc-${id})`}
          strokeWidth={1.4 - i * 0.25}
          strokeLinecap="round"
          fill="none"
          opacity={1 - i * 0.2}
          filter={`url(#neon-${id})`}
        />
      ))}

      {/* Dish body — parabolic arc */}
      <path
        d="M 6 28 Q 14 10 30 16"
        stroke={`url(#dish-${id})`}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        filter={`url(#neon-${id})`}
      />

      {/* Dish rim line — the opening edge */}
      <line
        x1="6" y1="28"
        x2="30" y2="16"
        stroke="var(--primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
        filter={`url(#neon-${id})`}
      />

      {/* Support strut */}
      <line
        x1="14" y1="26"
        x2="18" y2="33"
        stroke="var(--primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <line
        x1="16" y1="33"
        x2="22" y2="33"
        stroke="var(--primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Focal point — bright signal dot */}
      <circle
        cx="14"
        cy="26"
        r="2.5"
        fill="var(--primary)"
        filter={`url(#dot-glow-${id})`}
      />
      {/* Inner bright core */}
      <circle cx="14" cy="26" r="1.2" fill="white" opacity="0.9" />

      {/* ══ TEXT (if showText) ══ */}
      {showText && (
        <>
          {/* "SETI" text */}
          <text
            x="48"
            y="24"
            fontFamily="'Space Grotesk', 'Inter', sans-serif"
            fontSize="20"
            fontWeight="900"
            letterSpacing="3"
            fill="url(#dish-${id})"
          >
            SETI
          </text>
          {/* Tagline */}
          <text
            x="49"
            y="35"
            fontFamily="'Inter', sans-serif"
            fontSize="7"
            fontWeight="500"
            letterSpacing="1.5"
            fill="var(--primary)"
            opacity="0.55"
          >
            SIGNAL NETWORK
          </text>
        </>
      )}
    </svg>
  );
};

export default SetiLogo;
