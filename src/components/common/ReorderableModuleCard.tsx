import React, { useRef } from 'react';
import { GlassCard } from './GlassCard';
import { GripVertical, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';

export type NeonAccentColor = 'blue' | 'purple' | 'orange' | 'green' | 'yellow' | 'red';

export interface ReorderableModuleCardProps {
  id: string;
  index: number;
  total: number;
  title: string;
  icon?: React.ReactNode;
  subtitle?: string;
  neonColor?: NeonAccentColor;
  isDragging?: boolean;
  isDropTarget?: boolean;
  isCustomizing?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onPointerStartDrag?: (e: React.PointerEvent<HTMLDivElement>, id: string) => void;
  children: React.ReactNode;
  className?: string;
}

const NEON_COLOR_STYLES: Record<NeonAccentColor, {
  borderGlow: string;
  flashLine: string;
  handleBadge: string;
  textAccent: string;
}> = {
  blue: {
    borderGlow: 'hover:border-[#00A8FF]/60 border-[#00A8FF]/40 glow-card-blue',
    flashLine: 'flash-line-blue',
    handleBadge: 'text-[#00A8FF] bg-[#00A8FF]/15 border-[#00A8FF]/40 shadow-[0_0_10px_rgba(0,168,255,0.3)]',
    textAccent: 'text-[#00A8FF]',
  },
  purple: {
    borderGlow: 'hover:border-[#A855F7]/60 border-[#A855F7]/40 glow-card-purple',
    flashLine: 'flash-line-purple',
    handleBadge: 'text-[#A855F7] bg-[#A855F7]/15 border-[#A855F7]/40 shadow-[0_0_10px_rgba(168,85,247,0.3)]',
    textAccent: 'text-[#A855F7]',
  },
  orange: {
    borderGlow: 'hover:border-[#FF7A00]/60 border-[#FF7A00]/40 glow-card-orange',
    flashLine: 'flash-line-orange',
    handleBadge: 'text-[#FF7A00] bg-[#FF7A00]/15 border-[#FF7A00]/40 shadow-[0_0_10px_rgba(255,122,0,0.3)]',
    textAccent: 'text-[#FF7A00]',
  },
  green: {
    borderGlow: 'hover:border-[#10B981]/60 border-[#10B981]/40 glow-card-green',
    flashLine: 'flash-line-green',
    handleBadge: 'text-[#10B981] bg-[#10B981]/15 border-[#10B981]/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
    textAccent: 'text-[#10B981]',
  },
  yellow: {
    borderGlow: 'hover:border-[#FFD400]/60 border-[#FFD400]/40 glow-card-yellow',
    flashLine: 'flash-line-yellow',
    handleBadge: 'text-[#FFD400] bg-[#FFD400]/15 border-[#FFD400]/40 shadow-[0_0_10px_rgba(255,212,0,0.3)]',
    textAccent: 'text-[#FFD400]',
  },
  red: {
    borderGlow: 'hover:border-[#FF304F]/60 border-[#FF304F]/40 glow-card-red',
    flashLine: 'flash-line-red',
    handleBadge: 'text-[#FF304F] bg-[#FF304F]/15 border-[#FF304F]/40 shadow-[0_0_10px_rgba(255,48,79,0.3)]',
    textAccent: 'text-[#FF304F]',
  },
};

export const ReorderableModuleCard: React.FC<ReorderableModuleCardProps> = ({
  id,
  index,
  total,
  title,
  icon,
  subtitle,
  neonColor = 'blue',
  isDragging = false,
  isDropTarget = false,
  isCustomizing = false,
  onMoveUp,
  onMoveDown,
  onPointerStartDrag,
  children,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const colorStyle = NEON_COLOR_STYLES[neonColor];

  return (
    <div
      ref={containerRef}
      data-module-id={id}
      data-module-index={index}
      className={`relative transition-all duration-200 ${
        isDragging
          ? 'opacity-40 scale-[0.98] blur-[1px]'
          : isDropTarget
          ? 'scale-[1.01] transform'
          : ''
      } ${className}`}
    >
      {/* Target Insertion Glow Indicator when dragged over */}
      {isDropTarget && !isDragging && (
        <div className="absolute -top-3 left-0 right-0 h-1.5 rounded-full bg-gradient-to-r from-transparent via-[#00A8FF] to-transparent animate-pulse shadow-[0_0_15px_#00A8FF] z-30" />
      )}

      <GlassCard
        level={3}
        className={`relative transition-all duration-200 border ${
          isDropTarget && !isDragging
            ? 'border-[#00A8FF] shadow-[0_0_25px_rgba(0,168,255,0.35)] ring-1 ring-[#00A8FF]/60'
            : isCustomizing
            ? `${colorStyle.borderGlow} ring-1 ring-white/10`
            : 'border-white/10 hover:border-white/20'
        }`}
      >
        {/* Cyber-futuristic Top Neon Flash Line Blur */}
        <div className={`h-[3px] w-full ${colorStyle.flashLine} opacity-100 rounded-t-2xl`} />

        {/* Modular Header / Reorder Handle Bar */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/5 bg-black/30 backdrop-blur-md">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Touch-Optimized Drag Handle */}
            <div
              onPointerDown={(e) => onPointerStartDrag?.(e, id)}
              tabIndex={0}
              role="button"
              aria-label={`Drag handle for ${title}`}
              title="Touch & drag to reorder module"
              className={`p-2 -ml-1 rounded-xl cursor-grab active:cursor-grabbing touch-none select-none flex items-center justify-center transition-all ${
                isCustomizing
                  ? 'bg-white/10 text-white hover:bg-[#00A8FF]/20 hover:text-[#00A8FF] shadow-inner ring-1 ring-white/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <GripVertical className="w-4 h-4 shrink-0" />
            </div>

            {/* Icon & Title */}
            <div className="flex items-center gap-2 min-w-0">
              {icon && (
                <div className={`shrink-0 ${colorStyle.textAccent}`}>
                  {icon}
                </div>
              )}
              <div className="truncate">
                <span className="text-xs font-bold font-mono tracking-wider text-white uppercase block truncate">
                  {title}
                </span>
                {subtitle && (
                  <span className="text-[10px] text-gray-400 font-mono block truncate">
                    {subtitle}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Module Controls: Order Indicator & Accessible Touch Up/Down buttons */}
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="text-[10px] font-mono text-gray-500 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
              #{index + 1}
            </span>

            {/* Accessible Mobile One-Tap Bump Buttons */}
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              aria-label={`Move ${title} up`}
              title="Move up"
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                index === 0
                  ? 'text-gray-600 opacity-40 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-white/10 active:bg-[#00A8FF]/20 active:text-[#00A8FF]'
              }`}
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onMoveDown}
              disabled={index === total - 1}
              aria-label={`Move ${title} down`}
              title="Move down"
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                index === total - 1
                  ? 'text-gray-600 opacity-40 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-white/10 active:bg-[#00A8FF]/20 active:text-[#00A8FF]'
              }`}
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5">
          {children}
        </div>
      </GlassCard>
    </div>
  );
};
