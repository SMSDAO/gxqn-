import React from 'react';

export type StatusVariant = 
  | 'LIVE' 
  | 'DELAYED' 
  | 'OFFLINE' 
  | 'SYNCING' 
  | 'STALE'
  | 'LOCAL'
  | 'DEVNET'
  | 'TESTNET'
  | 'MAINNET'
  | 'SUCCESS'
  | 'PENDING'
  | 'REVERTED'
  | 'ADMIN'
  | 'WARNING';

interface StatusBadgeProps {
  status: StatusVariant | string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const normalized = status.toUpperCase();

  let colors = 'bg-white/5 text-gray-300 border-white/10';
  let dotColor = 'bg-gray-400';

  if (normalized === 'LIVE' || normalized === 'SUCCESS') {
    colors = 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
    dotColor = 'bg-[#10B981] animate-pulse';
  } else if (normalized === 'DEVNET' || normalized === 'LOCAL') {
    colors = 'bg-[#00A8FF]/15 text-[#00A8FF] border-[#00A8FF]/30 shadow-[0_0_10px_rgba(0,168,255,0.2)]';
    dotColor = 'bg-[#00A8FF]';
  } else if (normalized === 'TESTNET') {
    colors = 'bg-[#A855F7]/15 text-[#A855F7] border-[#A855F7]/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]';
    dotColor = 'bg-[#A855F7]';
  } else if (normalized === 'MAINNET') {
    colors = 'bg-[#FF7A00]/15 text-[#FF7A00] border-[#FF7A00]/40 shadow-[0_0_12px_rgba(255,122,0,0.25)]';
    dotColor = 'bg-[#FF7A00]';
  } else if (normalized === 'ADMIN') {
    colors = 'bg-gradient-to-r from-[#FF7A00]/20 to-[#FF304F]/20 text-[#FFD400] border-[#FF7A00]/50 font-bold shadow-[0_0_12px_rgba(255,122,0,0.3)]';
    dotColor = 'bg-[#FFD400] animate-ping';
  } else if (normalized === 'STALE' || normalized === 'DELAYED' || normalized === 'WARNING' || normalized === 'PENDING') {
    colors = 'bg-[#FFD400]/15 text-[#FFD400] border-[#FFD400]/30 shadow-[0_0_10px_rgba(255,212,0,0.2)]';
    dotColor = 'bg-[#FFD400]';
  } else if (normalized === 'OFFLINE' || normalized === 'REVERTED' || normalized === 'CRITICAL') {
    colors = 'bg-[#FF304F]/15 text-[#FF304F] border-[#FF304F]/30 shadow-[0_0_10px_rgba(255,48,79,0.2)]';
    dotColor = 'bg-[#FF304F]';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono uppercase tracking-wider font-medium ${sizeClasses} ${colors} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {status}
    </span>
  );
};
