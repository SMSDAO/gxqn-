import React from 'react';
import { ScoreDetails } from '../../services/aiIntelligence';
import { GlassCard } from './GlassCard';
import { X, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ScoreBreakdownModalProps {
  score: ScoreDetails | null;
  onClose: () => void;
}

export const ScoreBreakdownModal: React.FC<ScoreBreakdownModalProps> = ({ score, onClose }) => {
  if (!score) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <GlassCard level={4} glow="blue" className="w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#00A8FF]/20 border border-[#00A8FF]/40 flex items-center justify-center text-[#00A8FF]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">{score.title}</h3>
            <p className="text-xs text-[#9AA6B2]">{score.summary}</p>
          </div>
        </div>

        {/* Big Score Indicator */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between mb-6">
          <div>
            <span className="text-3xl font-extrabold font-mono text-[#00A8FF]">
              {score.totalScore}
            </span>
            <span className="text-sm font-mono text-gray-400">/{score.maxScore}</span>
            <span className="ml-3 text-xs px-2 py-0.5 rounded-full bg-[#00A8FF]/20 text-[#00A8FF] border border-[#00A8FF]/30 font-mono">
              GRADE: {score.grade}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-gray-400 uppercase tracking-wider block">Methodology</span>
            <span className="text-xs font-semibold text-gray-200">Algorithmic Heuristic</span>
          </div>
        </div>

        {/* Transparent Breakdown items */}
        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
          Mathematical Factor Breakdown
        </h4>
        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
          {score.breakdown.map((item, index) => {
            const isPositive = item.points >= 0;
            return (
              <div
                key={index}
                className="p-3 rounded-lg bg-[#070B12]/80 border border-white/5 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2.5">
                  {isPositive ? (
                    <CheckCircle2 className="w-4 h-4 text-[#10B981] mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-[#FF304F] mt-0.5 shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-semibold text-white">{item.label}</div>
                    <div className="text-[11px] text-gray-400 leading-relaxed">{item.description}</div>
                  </div>
                </div>
                <span
                  className={`font-mono text-xs font-bold shrink-0 ${
                    isPositive ? 'text-[#10B981]' : 'text-[#FF304F]'
                  }`}
                >
                  {isPositive ? `+${item.points}` : item.points}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
          <span>Formula: ∑(positive weights) - penalties</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#00A8FF] text-black font-semibold text-xs hover:bg-[#008CFF] transition-colors"
          >
            Acknowledge
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
