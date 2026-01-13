import React from 'react';

export default function Logo({ size = 'medium', variant = 'dark' }) {
  const sizes = {
    small: { icon: 32, text: 14, gap: 6 },
    medium: { icon: 40, text: 18, gap: 8 },
    large: { icon: 56, text: 24, gap: 10 },
  };

  const colors = {
    dark: { icon: '#111111', text: '#111111', border: '#D1D5DB' },
    light: { icon: '#FDFBF7', text: '#FDFBF7', border: 'rgba(255,255,255,0.3)' },
  };

  const s = sizes[size];
  const c = colors[variant];

  const styles = {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: s.gap,
      textDecoration: 'none',
      cursor: 'pointer',
    },
    iconBox: {
      width: s.icon,
      height: s.icon,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      //border: `2px solid ${c.border}`,
      borderRadius: '6px',
    },
    text: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
    },
    brand: {
      fontSize: s.text,
      fontWeight: 700,
      color: c.text,
      margin: 0,
      lineHeight: 1.2,
    },
    tagline: {
      fontSize: s.text * 0.55,
      fontWeight: 500,
      color: variant === 'dark' ? '#6B7280' : 'rgba(253,251,247,0.8)',
      textTransform: 'uppercase',
      letterSpacing: '0.3px',
      margin: 0,
    },
  };

  return (
    <a href="#" style={styles.container}>
      <div style={styles.iconBox}>
        <svg
          width={s.icon * 0.75}
          height={s.icon * 0.75}
          viewBox="0 0 64 64"
          fill="none"
          stroke={c.icon}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Exact open-book outline */}
          <path d="M6 10L26 18V50L6 42Z" />
          <path d="M58 10L38 18V50L58 42Z" />
          <path d="M26 18C30 16 34 16 38 18" />
        </svg>
      </div>

      <div style={styles.text}>
        <p style={styles.brand}>MHT CET</p>
        <p style={styles.tagline}>PYQ Master</p>
      </div>
    </a>
  );
}
