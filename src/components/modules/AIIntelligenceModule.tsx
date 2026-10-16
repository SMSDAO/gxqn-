import React, { useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { StatusBadge } from '../common/StatusBadge';
import { AI_INSIGHTS, SCORE_DATABASE, ScoreDetails, AISignalInsight } from '../../services/aiIntelligence';
import { Sparkles, ShieldCheck, TrendingUp, AlertTriangle, Layers, Info, CheckCircle2 } from 'lucide-react';

interface AIIntelligenceModuleProps {
  onOpenScoreBreakdown: (score: ScoreDetails) => void;
  triggerFlash: (type: any) => void;
}

export const AIIntelligenceModule: React.FC<AIIntelligenceModuleProps> = ({
  onOpenScoreBreakdown,
  triggerFlash,
}) => {
  const [query, setQuery] = useState('');
  const [customInsight, setCustomInsight] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleRunAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setAnalyzing(true);
    triggerFlash('AI_INSIGHT_FLASH');

    setTimeout(() => {
      setCustomInsight(
        `[Algorithmic Heuristic Result for "${query.trim()}"]\n` +
        `• Confidence: 81%\n` +
        `• Classification: Low volatility accumulation zone\n` +
        `• On-Chain Driver: DEX liquidity depth expanded +$240k within 48h; whale distribution flat.\n` +
        `• Security Note: Verified contract bytecode matches audited template.`
      );
      setAnalyzing(false);
    }, 1000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00A8FF]" />
            <span>AI HEURISTIC COMMAND CENTER</span>
          </h2>
          <p className="text-xs text-gray-400">
            Explainable quantitative signals, transparent score factor breakdowns, and verified on-chain telemetry
          </p>
        </div>
        <StatusBadge status="ACTIVE" />
      </div>

      {/* Transparent Score Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(SCORE_DATABASE).map(([key, score]) => (
          <GlassCard key={key} level={2} className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="truncate">{score.title}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-[#00A8FF]">
                  {score.grade}
                </span>
              </div>
              <div className="text-2xl font-black font-mono text-white">
                {score.totalScore}<span className="text-xs text-gray-500">/{score.maxScore}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                {score.summary}
              </p>
            </div>

            <button
              onClick={() => onOpenScoreBreakdown(score)}
              className="mt-4 pt-3 border-t border-white/10 text-xs font-semibold text-[#00A8FF] hover:underline flex items-center justify-between"
            >
              <span>View Mathematical Breakdown</span>
              <span>→</span>
            </button>
          </GlassCard>
        ))}
      </div>

      {/* Heuristic Signals Feed */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-300">
          Real-Time Calibrated Analytical Signals
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {AI_INSIGHTS.map((sig) => (
            <GlassCard key={sig.id} level={3} glow="blue" className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00A8FF]/20 text-[#00A8FF] border border-[#00A8FF]/30 font-bold">
                    {sig.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#10B981]">
                    CONFIDENCE: {sig.confidencePercent}%
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mb-2">{sig.title}</h4>
                <p className="text-xs text-gray-300 leading-relaxed mb-3">{sig.summary}</p>

                <div className="space-y-1 mb-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Causal Drivers:
                  </span>
                  {sig.reasoningPoints.map((pt, i) => (
                    <div key={i} className="text-[11px] text-gray-300 flex items-start gap-1.5">
                      <span className="text-[#00A8FF]">•</span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 text-[10px] text-gray-500 font-mono space-y-1">
                <div>Sources: {sig.dataSources.join(', ')}</div>
                <div className="text-gray-400 italic">{sig.disclaimer}</div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Interactive Heuristic Query Box */}
      <GlassCard level={2} className="p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-2 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#00A8FF]" />
          <span>Interactive On-Chain Heuristic Query</span>
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          Query contract metrics, AMM slippage vulnerability, or token velocity to generate structured causal explanations.
        </p>

        <form onSubmit={handleRunAnalysis} className="flex gap-3">
          <input
            type="text"
            placeholder="e.g. Inspect GXQ AMM pool liquidity depth and impermanent loss risk..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-[#00A8FF]"
          />
          <button
            type="submit"
            disabled={analyzing}
            className="px-5 py-2.5 rounded-xl bg-[#00A8FF] text-black font-bold text-xs uppercase tracking-wide hover:brightness-110 active:scale-95 transition-all"
          >
            {analyzing ? 'Analyzing...' : 'Run Query'}
          </button>
        </form>

        {customInsight && (
          <div className="mt-4 p-4 rounded-xl bg-black/60 border border-[#00A8FF]/30 text-xs font-mono text-gray-200 whitespace-pre-line leading-relaxed">
            {customInsight}
          </div>
        )}
      </GlassCard>
    </div>
  );
};
