import React, { useRef, useState, useCallback, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { NeonAccentColor } from './ReorderableModuleCard';

export interface SectionItem {
  id: string;
  title: string;
  subtitle?: string;
  neonColor?: NeonAccentColor;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

export interface ReorderableCardSectionProps {
  storageKey: string;
  items: SectionItem[];
  defaultOrder?: string[];
  className?: string;
  onOrderChange?: (newOrder: string[]) => void;
}

const COLOR_FLASH_LINES: Record<NeonAccentColor, { lineClass: string; badgeClass: string; glowClass: string }> = {
  blue: {
    lineClass: 'flash-line-blue',
    badgeClass: 'text-[#00A8FF] bg-[#00A8FF]/15 border-[#00A8FF]/40 shadow-[0_0_10px_rgba(0,168,255,0.3)]',
    glowClass: 'glow-card-blue hover:border-[#00A8FF]/50',
  },
  purple: {
    lineClass: 'flash-line-purple',
    badgeClass: 'text-[#A855F7] bg-[#A855F7]/15 border-[#A855F7]/40 shadow-[0_0_10px_rgba(168,85,247,0.3)]',
    glowClass: 'glow-card-purple hover:border-[#A855F7]/50',
  },
  orange: {
    lineClass: 'flash-line-orange',
    badgeClass: 'text-[#FF7A00] bg-[#FF7A00]/15 border-[#FF7A00]/40 shadow-[0_0_10px_rgba(255,122,0,0.3)]',
    glowClass: 'glow-card-orange hover:border-[#FF7A00]/50',
  },
  green: {
    lineClass: 'flash-line-green',
    badgeClass: 'text-[#10B981] bg-[#10B981]/15 border-[#10B981]/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
    glowClass: 'glow-card-green hover:border-[#10B981]/50',
  },
  yellow: {
    lineClass: 'flash-line-yellow',
    badgeClass: 'text-[#FFD400] bg-[#FFD400]/15 border-[#FFD400]/40 shadow-[0_0_10px_rgba(255,212,0,0.3)]',
    glowClass: 'glow-card-yellow hover:border-[#FFD400]/50',
  },
  red: {
    lineClass: 'flash-line-red',
    badgeClass: 'text-[#FF304F] bg-[#FF304F]/15 border-[#FF304F]/40 shadow-[0_0_10px_rgba(255,48,79,0.3)]',
    glowClass: 'glow-card-red hover:border-[#FF304F]/50',
  },
};

export const ReorderableCardSection: React.FC<ReorderableCardSectionProps> = ({
  storageKey,
  items,
  defaultOrder,
  className = '',
  onOrderChange,
}) => {
  const initialOrder = defaultOrder || items.map((i) => i.id);

  const [order, setOrder] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter((id) => items.some((item) => item.id === id));
          items.forEach((item) => {
            if (!valid.includes(item.id)) valid.push(item.id);
          });
          return valid;
        }
      }
    } catch {
      // ignore
    }
    return initialOrder;
  });

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const dropTargetRef = useRef<string | null>(null);
  dropTargetRef.current = dropTargetId;

  const saveOrder = useCallback(
    (newOrder: string[]) => {
      setOrder(newOrder);
      try {
        localStorage.setItem(storageKey, JSON.stringify(newOrder));
      } catch {
        // ignore
      }
      onOrderChange?.(newOrder);
    },
    [storageKey, onOrderChange]
  );

  // Sync across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setOrder(parsed);
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [storageKey]);

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= order.length) return;
    const next = [...order];
    const [removed] = next.splice(index, 1);
    next.splice(targetIdx, 0, removed);
    saveOrder(next);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(12);
    }
  };

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();

    setDraggedId(id);
    setDropTargetId(null);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const el = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
      const cardEl = el?.closest('[data-reorder-section-id]') as HTMLElement | null;
      if (cardEl) {
        const targetId = cardEl.getAttribute('data-reorder-section-id');
        if (targetId && targetId !== id) {
          setDropTargetId(targetId);
        }
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      const finalTarget = dropTargetRef.current;
      if (finalTarget && finalTarget !== id) {
        setOrder((prev) => {
          const fromIdx = prev.indexOf(id);
          const toIdx = prev.indexOf(finalTarget);
          if (fromIdx !== -1 && toIdx !== -1) {
            const next = [...prev];
            const [item] = next.splice(fromIdx, 1);
            next.splice(toIdx, 0, item);
            try {
              localStorage.setItem(storageKey, JSON.stringify(next));
            } catch {
              // ignore
            }
            onOrderChange?.(next);
            return next;
          }
          return prev;
        });

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([15, 30]);
        }
      }

      setDraggedId(null);
      setDropTargetId(null);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
  };

  const orderedItems = order
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is SectionItem => Boolean(item));

  return (
    <div className={`space-y-5 ${className}`}>
      {orderedItems.map((item, idx) => {
        const color = item.neonColor || 'blue';
        const colorStyle = COLOR_FLASH_LINES[color];
        const isDragging = draggedId === item.id;
        const isTarget = dropTargetId === item.id;

        return (
          <div
            key={item.id}
            data-reorder-section-id={item.id}
            className={`relative transition-all duration-200 ${
              isDragging ? 'opacity-40 scale-[0.98] blur-[1px]' : isTarget ? 'scale-[1.01]' : ''
            }`}
          >
            {/* Target Insertion Indicator */}
            {isTarget && !isDragging && (
              <div className="absolute -top-2.5 left-0 right-0 h-1.5 rounded-full bg-gradient-to-r from-transparent via-[#00A8FF] to-transparent shadow-[0_0_15px_#00A8FF] animate-pulse z-30" />
            )}

            <GlassCard
              level={2}
              className={`relative rounded-3xl overflow-hidden border transition-all duration-200 ${
                isTarget
                  ? 'border-[#00A8FF] ring-2 ring-[#00A8FF]/60 shadow-[0_0_30px_rgba(0,168,255,0.35)]'
                  : `border-white/10 ${colorStyle.glowClass}`
              }`}
            >
              {/* Top Cyber Flash Line with Blur */}
              <div className={`h-[3px] w-full ${colorStyle.lineClass} opacity-100 rounded-t-3xl`} />

              {/* Module Header Bar with Touch Drag Handle */}
              <div className="px-4 py-3 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    onPointerDown={(e) => handlePointerDown(e, item.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Drag handle for ${item.title}`}
                    title="Touch & drag to reorder module"
                    className="p-2 -ml-1 rounded-xl cursor-grab active:cursor-grabbing touch-none select-none text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <GripVertical className="w-4 h-4 shrink-0" />
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    {item.icon && <div className="shrink-0">{item.icon}</div>}
                    <div className="truncate">
                      <span className="text-xs font-bold font-mono tracking-wider text-white uppercase block truncate">
                        {item.title}
                      </span>
                      {item.subtitle && (
                        <span className="text-[10px] text-gray-400 font-mono block truncate">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Accessible Quick Up/Down Buttons */}
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${colorStyle.badgeClass}`}>
                    #{idx + 1}
                  </span>
                  <button
                    onClick={() => moveItem(idx, 'up')}
                    disabled={idx === 0}
                    aria-label={`Move ${item.title} up`}
                    title="Move up"
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      idx === 0
                        ? 'text-gray-600 opacity-40 cursor-not-allowed'
                        : 'text-gray-400 hover:text-white hover:bg-white/10 active:bg-[#00A8FF]/20 active:text-[#00A8FF]'
                    }`}
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveItem(idx, 'down')}
                    disabled={idx === orderedItems.length - 1}
                    aria-label={`Move ${item.title} down`}
                    title="Move down"
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      idx === orderedItems.length - 1
                        ? 'text-gray-600 opacity-40 cursor-not-allowed'
                        : 'text-gray-400 hover:text-white hover:bg-white/10 active:bg-[#00A8FF]/20 active:text-[#00A8FF]'
                    }`}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5">{item.content}</div>
            </GlassCard>
          </div>
        );
      })}
    </div>
  );
};
