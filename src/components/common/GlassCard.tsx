import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: 1 | 2 | 3 | 4;
  glow?: 'blue' | 'orange' | 'red' | 'yellow' | 'none';
  interactive?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  level = 2,
  glow = 'none',
  interactive = false,
  className = '',
  children,
  ...props
}) => {
  const levelClasses = {
    1: 'bg-[#070B12]/60 backdrop-blur-md border border-white/5',
    2: 'bg-[#070B12]/80 backdrop-blur-lg border border-white/10 shadow-lg shadow-black/50',
    3: 'bg-[#0B132B]/75 backdrop-blur-xl border border-[#00A8FF]/20 shadow-xl shadow-[#00A8FF]/5',
    4: 'bg-[#0E1A38]/90 backdrop-blur-2xl border border-[#00A8FF]/40 shadow-2xl shadow-[#00A8FF]/15',
  }[level];

  const glowClasses = {
    blue: 'border-[#00A8FF]/40 shadow-[0_0_20px_-3px_rgba(0,168,255,0.25)]',
    orange: 'border-[#FF7A00]/40 shadow-[0_0_20px_-3px_rgba(255,122,0,0.25)]',
    red: 'border-[#FF304F]/40 shadow-[0_0_20px_-3px_rgba(255,48,79,0.3)]',
    yellow: 'border-[#FFD400]/40 shadow-[0_0_20px_-3px_rgba(255,212,0,0.25)]',
    none: '',
  }[glow];

  const interactiveClasses = interactive
    ? 'transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00A8FF]/50 hover:shadow-[0_8px_25px_-5px_rgba(0,168,255,0.2)] cursor-pointer active:scale-[0.99]'
    : '';

  return (
    <div
      className={`rounded-2xl relative overflow-hidden ${levelClasses} ${glowClasses} ${interactiveClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
