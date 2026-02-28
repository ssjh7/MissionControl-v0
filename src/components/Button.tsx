import React from 'react';

export type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'success';
export type ButtonSize    = 'sm' | 'md';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?:    ButtonSize;
}

const BASE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  borderRadius: 9999,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'transform 150ms ease, opacity 150ms ease, filter 150ms ease',
  letterSpacing: '0.2px',
  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
};

const VARIANT: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg,#f59e0b,#d97706)',
    color: '#000',
    border: 'none',
    boxShadow: '0 2px 10px rgba(245,158,11,0.3)',
  },
  ghost: {
    background: 'rgba(255,255,255,0.06)',
    color: '#94a3b8',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  danger: {
    background: 'rgba(239,68,68,0.12)',
    color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.25)',
  },
  success: {
    background: 'rgba(16,185,129,0.12)',
    color: '#10b981',
    border: '1px solid rgba(16,185,129,0.25)',
  },
};

const SIZE: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '4px 14px',  fontSize: 12 },
  md: { padding: '7px 20px',  fontSize: 13 },
};

export function Button({
  variant = 'ghost',
  size    = 'md',
  style,
  children,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  ...props
}: Props) {
  return (
    <button
      {...props}
      style={{ ...BASE, ...VARIANT[variant], ...SIZE[size], ...style }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; onMouseEnter?.(e); }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';    onMouseLeave?.(e); }}
      onMouseDown={e  => { e.currentTarget.style.transform = 'scale(0.97)'; onMouseDown?.(e);  }}
      onMouseUp={e    => { e.currentTarget.style.transform = 'scale(1.03)'; onMouseUp?.(e);    }}
    >
      {children}
    </button>
  );
}
