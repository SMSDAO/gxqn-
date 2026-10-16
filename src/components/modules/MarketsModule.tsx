import React, { useState, useMemo } from 'react';
import { GlassCard } from '../common/GlassCard';
import { StatusBadge } from '../common/StatusBadge';
import { MarketSnapshot } from '../../services/marketProvider';
import { 
  TrendingUp, 
  TrendingDown, 
  Radio, 
  Clock, 
  ArrowRightLeft,
  Activity,
  Zap,
  BarChart2,
  Sliders,
  Layers,
  Sparkles,
  Info,
  Maximize2
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Rectangle,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

interface MarketsModuleProps {
  markets: MarketSnapshot[];
  onNavigateToSwap: () => void;
}

import { D3Heatmap } from '../common/D3Heatmap';
import { ReorderableCardSection, SectionItem } from '../common/ReorderableCardSection';

type Timeframe = '1H' | '24H' | '7D' | '30D' | '1Y';
type ChartViewMode = 'candlestick' | 'corridor' | 'volatility' | 'heatmap';

export interface HistoricalDataPoint {
  timestamp: string;
  timeLabel: string;
  open: number;
  high: number;
  low: number;
  close: number;
  price: number; // alias for close
  upperBand: number;
  lowerBand: number;
  volatility: number;
  volume: number;
  isBullish: boolean;
  changePercent: number;
}

export const MarketsModule: React.FC<MarketsModuleProps> = ({ markets, onNavigateToSwap }) => {
  const [selectedPair, setSelectedPair] = useState<string>('GXQ/USD');
  const [timeframe, setTimeframe] = useState<Timeframe>('24H');
  const [viewMode, setChartViewMode] = useState<ChartViewMode>('candlestick');
  const [hoveredCandle, setHoveredCandle] = useState<HistoricalDataPoint | null>(null);

  const activeSnap = markets.find(m => m.symbol === selectedPair) || markets[0];
  const isPositive = activeSnap ? activeSnap.change24h >= 0 : true;

  // Format price helper with appropriate decimals
  const formatPrice = (val: number | undefined): string => {
    if (val === undefined || val === null || isNaN(val)) return '0.00';
    if (val >= 1000) {
      return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (val >= 1) {
      return val.toFixed(2);
    }
    return val.toFixed(4);
  };

  // Generate deterministic realistic historical OHLC price & volatility series based on current snapshot and timeframe
  const historicalData = useMemo<HistoricalDataPoint[]>(() => {
    if (!activeSnap) return [];

    const basePrice = activeSnap.price;
    const isCrypto = basePrice > 100;
    const decimals = isCrypto ? 2 : 4;
    const pointsCount = timeframe === '1H' ? 24 : timeframe === '24H' ? 24 : timeframe === '7D' ? 28 : timeframe === '30D' ? 30 : 52;
    const now = Date.now();

    const data: HistoricalDataPoint[] = [];

    // Pre-calculate trajectory backwards to ensure latest candle matches current live price
    const randomWalk: number[] = [];
    const changeFactor = (activeSnap.change24h / 100);

    for (let i = 0; i < pointsCount; i++) {
      const progress = i / (pointsCount - 1);
      // Overall trend aligning with the 24h/timeframe change
      const trend = (progress - 1) * changeFactor;
      const cycle = Math.sin(i * 0.5) * 0.016 + Math.cos(i * 0.28) * 0.012;
      const noise = Math.sin(i * 2.3 + 1.2) * 0.006;
      const delta = trend + cycle + noise;
      const p = i === pointsCount - 1 ? basePrice : basePrice * (1 + delta);
      randomWalk.push(Number(p.toFixed(decimals)));
    }

    for (let i = 0; i < pointsCount; i++) {
      const revIndex = pointsCount - 1 - i;
      let intervalMs = 1000 * 60 * 2.5; // 2.5 min for 1H
      let timeLabel = '';

      if (timeframe === '1H') {
        intervalMs = 1000 * 60 * 2.5;
        const d = new Date(now - revIndex * intervalMs);
        timeLabel = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      } else if (timeframe === '24H') {
        intervalMs = 1000 * 60 * 60;
        const d = new Date(now - revIndex * intervalMs);
        timeLabel = `${d.getHours().toString().padStart(2, '0')}:00`;
      } else if (timeframe === '7D') {
        intervalMs = 1000 * 60 * 60 * 6;
        const d = new Date(now - revIndex * intervalMs);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        timeLabel = `${days[d.getDay()]} ${d.getHours()}:00`;
      } else if (timeframe === '30D') {
        intervalMs = 1000 * 60 * 60 * 24;
        const d = new Date(now - revIndex * intervalMs);
        timeLabel = `${d.getMonth() + 1}/${d.getDate()}`;
      } else {
        intervalMs = 1000 * 60 * 60 * 24 * 7;
        const d = new Date(now - revIndex * intervalMs);
        timeLabel = `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
      }

      const close = randomWalk[i];
      // Open is previous close, or slight jitter for first candle
      const prevClose = i > 0 ? randomWalk[i - 1] : Number((close * (1 - (Math.sin(i * 1.5) * 0.006))).toFixed(decimals));
      const open = prevClose;
      
      // Intra-candle realistic wick volatility
      const candleVol = Math.abs(Math.sin(i * 1.7 + 0.4)) * 0.012 + 0.003;
      const highCandle = Math.max(open, close) * (1 + candleVol * (0.6 + Math.abs(Math.sin(i * 3.1)) * 0.6));
      const lowCandle = Math.min(open, close) * (1 - candleVol * (0.6 + Math.abs(Math.cos(i * 2.7)) * 0.6));

      const high = Number(highCandle.toFixed(decimals));
      const low = Number(Math.max(0, lowCandle).toFixed(decimals));
      const isBullish = close >= open;
      const changePercent = Number((((close - open) / (open || 1)) * 100).toFixed(2));

      // Dynamic rolling volatility simulation (% annualized / rolling standard deviation)
      const rollingVol = Number((8 + Math.abs(Math.sin(i * 0.6) * 14 + activeSnap.change24h * 0.5)).toFixed(2));
      const bandSpread = close * (rollingVol / 100) * 0.35;
      
      const upperBand = Number((close + bandSpread).toFixed(decimals));
      const lowerBand = Number(Math.max(0, close - bandSpread).toFixed(decimals));
      const volume = Math.round((activeSnap.volume24h / pointsCount) * (0.8 + Math.abs(Math.sin(i * 1.3)) * 0.5));

      data.push({
        timestamp: new Date(now - revIndex * intervalMs).toISOString(),
        timeLabel,
        open,
        high,
        low,
        close,
        price: close,
        upperBand,
        lowerBand,
        volatility: rollingVol,
        volume,
        isBullish,
        changePercent,
      });
    }

    return data;
  }, [activeSnap, timeframe]);

  // Derived Price Bounds & Max Volume for Dual-Axis Scaling
  const { yDomain, maxVolume, avgPrice } = useMemo(() => {
    if (historicalData.length === 0) {
      return { yDomain: [0, 100] as [number, number], maxVolume: 1000, avgPrice: 0 };
    }
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;
    let sum = 0;

    historicalData.forEach(d => {
      if (d.low < min) min = d.low;
      if (d.high > max) max = d.high;
      if (d.volume > maxVol) maxVol = d.volume;
      sum += d.close;
    });

    const isCrypto = max > 100;
    const decimals = isCrypto ? 2 : 4;
    const spread = max - min || max * 0.05 || 1;
    const padding = spread * 0.08;

    const yMin = Number(Math.max(0, min - padding).toFixed(decimals));
    const yMax = Number((max + padding).toFixed(decimals));

    return {
      yDomain: [yMin, yMax] as [number, number],
      maxVolume: maxVol,
      avgPrice: sum / historicalData.length,
    };
  }, [historicalData]);

  const currentVol = historicalData[historicalData.length - 1]?.volatility || 12.4;
  const volRating = currentVol < 9 ? 'LOW' : currentVol < 16 ? 'MODERATE' : currentVol < 24 ? 'ELEVATED' : 'EXTREME';
  const volRatingColor = currentVol < 9 ? 'text-emerald-400' : currentVol < 16 ? 'text-[#00A8FF]' : currentVol < 24 ? 'text-[#FFD400]' : 'text-[#FF304F]';
  const volRatingBorder = currentVol < 9 ? 'border-emerald-500/30 bg-emerald-500/10' : currentVol < 16 ? 'border-[#00A8FF]/30 bg-[#00A8FF]/10' : currentVol < 24 ? 'border-[#FFD400]/30 bg-[#FFD400]/10' : 'border-[#FF304F]/30 bg-[#FF304F]/10';

  // Active Candle for top interactive OHLC display HUD
  const activeCandle = hoveredCandle || historicalData[historicalData.length - 1];

  // Mathematical pixel mapping for razor-sharp SVG candlestick coordinates
  const chartHeight = 330;
  const marginTop = 15;
  const marginBottom = 25;
  const plotHeight = chartHeight - marginTop - marginBottom; // 290px

  const priceToY = (price: number): number => {
    const [yMin, yMax] = yDomain;
    if (yMax <= yMin) return marginTop + plotHeight / 2;
    return marginTop + ((yMax - price) / (yMax - yMin)) * plotHeight;
  };

  // Custom Candlestick Shape Renderer for Recharts
  const CandlestickShape = (props: any) => {
    const { x, y, width, height, open, close } = props;
    const isUp = close >= open;
    const color = isUp ? '#10b981' : '#ef4444';
    return (
      <g>
        <line x1={x + width / 2} y1={y + (open > close ? 0 : height)} x2={x + width / 2} y2={y + (open > close ? height : 0)} stroke={color} strokeWidth={1} />
        <rect x={x} y={y} width={width} height={Math.max(Math.abs(open - close), 1)} fill={color} />
      </g>
    );
  };

  // Custom Cyber-Futuristic Tooltip for Recharts
  const CustomCyberTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point: HistoricalDataPoint = payload[0].payload;
      return (
        <div className="p-3.5 rounded-xl bg-[#070B12]/95 border border-[#00A8FF]/40 shadow-[0_0_24px_rgba(0,168,255,0.3)] backdrop-blur-xl text-xs font-mono min-w-[210px] pointer-events-none">
          <div className="text-[10px] text-gray-400 flex items-center justify-between gap-3 pb-1.5 border-b border-white/10">
            <span>{point.timeLabel}</span>
            <span className="text-[#00A8FF] font-semibold">{activeSnap?.symbol}</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${point.isBullish ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-[#FF304F]/20 text-[#FF304F]'}`}>
              {point.isBullish ? 'BULLISH' : 'BEARISH'}
            </span>
          </div>

          <div className="mt-2.5 space-y-1.5">
            {viewMode === 'candlestick' ? (
              <>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase">Open</span>
                    <span className="text-white font-bold">${formatPrice(point.open)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase">High</span>
                    <span className="text-[#10B981] font-bold">${formatPrice(point.high)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase">Low</span>
                    <span className="text-[#FF304F] font-bold">${formatPrice(point.low)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase">Close</span>
                    <span className="text-white font-bold">${formatPrice(point.close)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 text-[11px] pt-1.5 border-t border-white/10">
                  <span className="text-gray-400">Candle Delta:</span>
                  <span className={`font-bold ${point.isBullish ? 'text-[#10B981]' : 'text-[#FF304F]'}`}>
                    {point.isBullish ? '+' : ''}{point.changePercent}%
                  </span>
                </div>
              </>
            ) : viewMode === 'corridor' ? (
              <>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-white font-bold text-sm">${formatPrice(point.price)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-[11px]">
                  <span className="text-purple-400">Upper Vol Band:</span>
                  <span className="text-gray-200">${formatPrice(point.upperBand)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-[11px]">
                  <span className="text-purple-400">Lower Vol Band:</span>
                  <span className="text-gray-200">${formatPrice(point.lowerBand)}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <span className="text-gray-400">Volatility Index:</span>
                <span className="text-[#FFD400] font-bold text-sm">{point.volatility}%</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-4 text-[10px] text-gray-400 pt-1 border-t border-white/5">
              <span>Interval Volume:</span>
              <span className="text-gray-200 font-mono">${(point.volume / 1000).toFixed(0)}k</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[10px] text-gray-400">
              <span>Rolling Vol:</span>
              <span className="text-[#FFD400] font-mono">{point.volatility}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const marketSections: SectionItem[] = [
    {
      id: 'markets_chart',
      title: `${activeSnap?.symbol} Interactive Candlestick & Corridor`,
      subtitle: `Trading Pair: ${activeSnap?.baseAsset} / ${activeSnap?.quoteAsset} • ${volRating} VOLATILITY (${currentVol}%)`,
      neonColor: 'blue',
      icon: <TrendingUp className="w-4 h-4 text-[#00A8FF]" />,
      content: (
        <div>
        {/* Quick Token Selector Pills */}
        <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-white/10 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-mono uppercase text-gray-500 mr-1 hidden sm:inline">Select Token:</span>
            {markets.map((m) => {
              const isSelected = m.symbol === selectedPair;
              const isPos = m.change24h >= 0;
              return (
                <button
                  key={m.symbol}
                  onClick={() => {
                    setSelectedPair(m.symbol);
                    setHoveredCandle(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                    isSelected
                      ? 'bg-[#00A8FF] text-black shadow-[0_0_14px_rgba(0,168,255,0.45)]'
                      : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  <span>{m.baseAsset}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-black/80 font-bold' : isPos ? 'text-[#10B981]' : 'text-[#FF304F]'}`}>
                    {isPos ? '+' : ''}{m.change24h.toFixed(1)}%
                  </span>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] font-mono text-gray-400 shrink-0 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-gray-500 hidden md:inline">Feed:</span>
            <span className="text-gray-300 font-semibold">{activeSnap?.source}</span>
          </div>
        </div>

        {/* Top Asset Title & Price Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black font-mono text-white">{activeSnap?.symbol}</span>
              <StatusBadge status={activeSnap?.status || 'LIVE'} size="sm" />
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${volRatingBorder} ${volRatingColor}`}>
                {volRating} VOLATILITY ({currentVol}%)
              </span>
            </div>
            <span className="text-xs text-gray-400 font-mono mt-0.5 block">
              Trading Pair: {activeSnap?.baseAsset} / {activeSnap?.quoteAsset}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-3xl font-black font-mono text-white">
                ${formatPrice(activeSnap?.price)}
              </div>
              <div className={`text-xs font-mono font-bold flex items-center justify-end gap-1 ${isPositive ? 'text-[#10B981]' : 'text-[#FF304F]'}`}>
                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                <span>{isPositive ? '+' : ''}{activeSnap?.change24h.toFixed(2)}% (24h)</span>
              </div>
            </div>

            <button
              onClick={onNavigateToSwap}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00A8FF] to-[#008CFF] text-black font-bold text-xs uppercase hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,168,255,0.3)] flex items-center gap-1.5 shrink-0"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Swap</span> {activeSnap?.baseAsset}
            </button>
          </div>
        </div>

        {/* Chart Header Bar: Timeframes + View Mode Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-1.5 bg-[#070B12] p-1 rounded-xl border border-white/10">
            {(['1H', '24H', '7D', '30D', '1Y'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                  timeframe === tf
                    ? 'bg-[#00A8FF] text-black shadow-[0_0_10px_rgba(0,168,255,0.5)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-gray-500 hidden sm:inline">Chart Mode:</span>
            <div className="flex items-center gap-1 bg-[#070B12] p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setChartViewMode('candlestick')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  viewMode === 'candlestick'
                    ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Interactive Japanese Candlestick (OHLC + Volume)"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Candlestick</span>
              </button>
              <button
                onClick={() => setChartViewMode('corridor')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  viewMode === 'corridor'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Continuous price trend and dynamic volatility corridor"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Corridor</span>
              </button>
              <button
                onClick={() => setChartViewMode('volatility')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  viewMode === 'volatility'
                    ? 'bg-[#FFD400]/20 text-[#FFD400] border border-[#FFD400]/40'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Rolling volatility percentage curve"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Vol Index</span>
              </button>
              <button
                onClick={() => setChartViewMode('heatmap')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  viewMode === 'heatmap'
                    ? 'bg-[#00A8FF]/20 text-[#00A8FF] border border-[#00A8FF]/40'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="View market performance heatmap"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Heatmap</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real-Time Interactive OHLC Heads-Up Display (HUD) */}
        {activeCandle && (
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-3 py-2 rounded-xl bg-black/50 border border-white/5 font-mono text-[11px] mb-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">T:</span>
              <span className="text-white font-semibold">{activeCandle.timeLabel}</span>
              {hoveredCandle && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00A8FF]/20 text-[#00A8FF]">
                  Hovered
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <div>
                <span className="text-gray-500">O:</span>{' '}
                <span className="text-gray-200">${formatPrice(activeCandle.open)}</span>
              </div>
              <div>
                <span className="text-gray-500">H:</span>{' '}
                <span className="text-[#10B981] font-semibold">${formatPrice(activeCandle.high)}</span>
              </div>
              <div>
                <span className="text-gray-500">L:</span>{' '}
                <span className="text-[#FF304F] font-semibold">${formatPrice(activeCandle.low)}</span>
              </div>
              <div>
                <span className="text-gray-500">C:</span>{' '}
                <span className="text-white font-bold">${formatPrice(activeCandle.close)}</span>
              </div>
              <div>
                <span className="text-gray-500">Δ:</span>{' '}
                <span className={`font-bold ${activeCandle.isBullish ? 'text-[#10B981]' : 'text-[#FF304F]'}`}>
                  {activeCandle.isBullish ? '+' : ''}{activeCandle.changePercent}%
                </span>
              </div>
              <div className="hidden sm:inline">
                <span className="text-gray-500">Vol:</span>{' '}
                <span className="text-gray-300">${(activeCandle.volume / 1000).toFixed(0)}k</span>
              </div>
            </div>
          </div>
        )}

        {/* RECHARTS CHART CONTAINER */}
        <div className="w-full h-[330px] pt-1 pb-1 relative">
          {viewMode === 'heatmap' ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <D3Heatmap data={markets} onSelect={setSelectedPair} />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={chartHeight}>
              {viewMode === 'candlestick' ? (
                /* INTERACTIVE CANDLESTICK CHART */
                <ComposedChart
                  data={historicalData}
                  margin={{ top: marginTop, right: 65, left: 5, bottom: marginBottom }}
                  onMouseMove={(state: any) => {
                    if (state && state.activePayload && state.activePayload[0]) {
                      setHoveredCandle(state.activePayload[0].payload);
                    }
                  }}
                  onMouseLeave={() => setHoveredCandle(null)}
                >
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                  
                  <XAxis 
                    dataKey="timeLabel" 
                    stroke="#66717D" 
                    tick={{ fontSize: 10, fill: '#9AA6B2' }} 
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    minTickGap={20}
                  />
                  
                  {/* Right-aligned Price Axis */}
                  <YAxis 
                    yAxisId="priceAxis"
                    orientation="right"
                    stroke="#66717D" 
                    tick={{ fontSize: 10, fill: '#9AA6B2' }} 
                    domain={yDomain}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickFormatter={(val) => {
                      if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
                      if (val >= 1) return `$${val.toFixed(2)}`;
                      return `$${val.toFixed(3)}`;
                    }}
                  />

                  {/* Left-aligned Hidden Volume Axis (Pushes volume bars to bottom ~22% of chart) */}
                  <YAxis 
                    yAxisId="volumeAxis" 
                    orientation="left" 
                    domain={[0, maxVolume * 4.5]} 
                    hide 
                  />

                  <Tooltip 
                    content={<CustomCyberTooltip />} 
                    cursor={{ stroke: 'rgba(0,168,255,0.35)', strokeWidth: 1, strokeDasharray: '3 3' }} 
                  />

                  {/* Sub-chart Volume Bars */}
                  <Bar 
                    yAxisId="volumeAxis" 
                    dataKey="volume" 
                    fill="rgba(255, 255, 255, 0.08)" 
                    isAnimationActive={false} 
                  />

                  {/* Real-time Candlesticks via Custom SVG Shape */}
                  <Bar 
                    yAxisId="priceAxis" 
                    dataKey="close" 
                    shape={<CandlestickShape />} 
                    isAnimationActive={false} 
                  />

                  {/* Current Active Price Marker Line */}
                  <ReferenceLine 
                    yAxisId="priceAxis" 
                    y={activeSnap?.price} 
                    stroke="#00A8FF" 
                    strokeDasharray="2 2" 
                    strokeOpacity={0.6}
                    label={{ 
                      value: `$${formatPrice(activeSnap?.price)}`, 
                      fill: '#00A8FF', 
                      fontSize: 10, 
                      position: 'right' 
                    }} 
                  />
                </ComposedChart>
              ) : viewMode === 'corridor' ? (
                /* PRICE & VOLATILITY CORRIDOR CHART */
                <AreaChart 
                  data={historicalData} 
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  onMouseMove={(state: any) => {
                    if (state && state.activePayload && state.activePayload[0]) {
                      setHoveredCandle(state.activePayload[0].payload);
                    }
                  }}
                  onMouseLeave={() => setHoveredCandle(null)}
                >
                  <defs>
                    {/* Price Gradient */}
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? '#00A8FF' : '#FF304F'} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={isPositive ? '#00A8FF' : '#FF304F'} stopOpacity={0.0} />
                    </linearGradient>
                    {/* Volatility Corridor Gradient */}
                    <linearGradient id="colorUpper" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A855F7" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#A855F7" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                  
                  <XAxis 
                    dataKey="timeLabel" 
                    stroke="#66717D" 
                    tick={{ fontSize: 10, fill: '#9AA6B2' }} 
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    minTickGap={20}
                  />
                  
                  <YAxis 
                    stroke="#66717D" 
                    tick={{ fontSize: 10, fill: '#9AA6B2' }} 
                    domain={['auto', 'auto']}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickFormatter={(val) => val > 100 ? `$${(val / 1000).toFixed(0)}k` : `$${val.toFixed(2)}`}
                  />

                  <Tooltip content={<CustomCyberTooltip />} />

                  {/* Volatility Upper Corridor Band */}
                  <Area 
                    type="monotone" 
                    dataKey="upperBand" 
                    stroke="#A855F7" 
                    strokeDasharray="3 3" 
                    strokeWidth={1}
                    fill="url(#colorUpper)" 
                    dot={false}
                    isAnimationActive={true}
                  />

                  {/* Primary Price Area */}
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke={isPositive ? '#00A8FF' : '#FF304F'} 
                    strokeWidth={2.5}
                    fill="url(#colorPrice)" 
                    dot={false}
                    activeDot={{ r: 5, fill: isPositive ? '#00A8FF' : '#FF304F', stroke: '#fff', strokeWidth: 2 }}
                    isAnimationActive={true}
                  />

                  {/* Volatility Lower Corridor Line */}
                  <Area 
                    type="monotone" 
                    dataKey="lowerBand" 
                    stroke="rgba(168, 85, 247, 0.5)" 
                    strokeDasharray="3 3" 
                    strokeWidth={1}
                    fill="transparent" 
                    dot={false}
                    isAnimationActive={true}
                  />

                  {/* Mean Price Line */}
                  <ReferenceLine 
                    y={avgPrice} 
                    stroke="rgba(255, 212, 0, 0.35)" 
                    strokeDasharray="4 4" 
                    label={{ value: 'Avg', fill: '#FFD400', fontSize: 10, position: 'right' }} 
                  />
                </AreaChart>
              ) : (
                /* VOLATILITY OSCILLATOR INDEX CHART */
                <LineChart 
                  data={historicalData} 
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  onMouseMove={(state: any) => {
                    if (state && state.activePayload && state.activePayload[0]) {
                      setHoveredCandle(state.activePayload[0].payload);
                    }
                  }}
                  onMouseLeave={() => setHoveredCandle(null)}
                >
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                  
                  <XAxis 
                    dataKey="timeLabel" 
                    stroke="#66717D" 
                    tick={{ fontSize: 10, fill: '#9AA6B2' }} 
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    minTickGap={20}
                  />
                  
                  <YAxis 
                    stroke="#66717D" 
                    tick={{ fontSize: 10, fill: '#9AA6B2' }} 
                    domain={[0, 'auto']}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                    tickFormatter={(val) => `${val}%`}
                  />

                  <Tooltip content={<CustomCyberTooltip />} />

                  {/* Elevated Volatility Threshold Indicator Line */}
                  <ReferenceLine 
                    y={18} 
                    stroke="#FF304F" 
                    strokeDasharray="3 3" 
                    label={{ value: 'Elevated Risk (18%)', fill: '#FF304F', fontSize: 10, position: 'insideTopRight' }} 
                  />

                  {/* Moderate Volatility Baseline Line */}
                  <ReferenceLine 
                    y={10} 
                    stroke="#00A8FF" 
                    strokeDasharray="3 3" 
                    label={{ value: 'Baseline (10%)', fill: '#00A8FF', fontSize: 10, position: 'insideBottomRight' }} 
                  />

                  {/* Volatility Index Curve */}
                  <Line 
                    type="monotone" 
                    dataKey="volatility" 
                    stroke="#FFD400" 
                    strokeWidth={2.5}
                    dot={{ r: 2, fill: '#FFD400' }}
                    activeDot={{ r: 5, fill: '#FFD400', stroke: '#fff', strokeWidth: 2 }}
                    isAnimationActive={true}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>


        {/* Volatility & Market Microstructure Key Metrics Footer */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10 text-xs font-mono mt-3">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <span className="text-gray-500 block text-[10px]">24h High</span>
            <span className="text-gray-200 font-bold">${formatPrice(activeSnap?.high24h)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <span className="text-gray-500 block text-[10px]">24h Low</span>
            <span className="text-gray-200 font-bold">${formatPrice(activeSnap?.low24h)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <span className="text-gray-500 block text-[10px]">Realized Volatility</span>
            <span className={`font-bold ${volRatingColor}`}>
              {currentVol}% ({volRating})
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
            <span className="text-gray-500 block text-[10px]">24h Volume</span>
            <span className="text-[#00A8FF] font-bold">
              ${activeSnap ? (activeSnap.volume24h / 1e6).toFixed(2) : '0.00'}M
            </span>
          </div>
        </div>
        </div>
      ),
    },
    {
      id: 'markets_pairs',
      title: `All Monitored Pairs Registry (${markets.length})`,
      subtitle: 'Click pair to visualize candlestick price chart & orderbook depth',
      neonColor: 'green',
      icon: <BarChart2 className="w-4 h-4 text-[#10B981]" />,
      content: (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 uppercase text-[10px]">
                <th className="pb-3">Pair</th>
                <th className="pb-3">Price</th>
                <th className="pb-3">24h Change</th>
                <th className="pb-3">24h Volume</th>
                <th className="pb-3">Volatility</th>
                <th className="pb-3">Source Provider</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {markets.map((snap) => {
                const isPos = snap.change24h >= 0;
                const isSelected = snap.symbol === selectedPair;
                const pairVol = Math.round(Math.abs(snap.change24h) * 1.5 + 8);
                return (
                  <tr
                    key={snap.symbol}
                    onClick={() => {
                      setSelectedPair(snap.symbol);
                      setHoveredCandle(null);
                    }}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#00A8FF]/15 border-l-2 border-[#00A8FF]' : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="py-3.5 font-bold text-white flex items-center gap-2 pl-2">
                      <span>{snap.symbol}</span>
                      {isSelected && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#00A8FF]/30 text-[#00A8FF]">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 font-bold text-gray-100">
                      ${formatPrice(snap.price)}
                    </td>
                    <td className={`py-3.5 font-bold ${isPos ? 'text-[#10B981]' : 'text-[#FF304F]'}`}>
                      {isPos ? '+' : ''}{snap.change24h.toFixed(2)}%
                    </td>
                    <td className="py-3.5 text-gray-400">
                      ${(snap.volume24h / 1e6).toFixed(2)}M
                    </td>
                    <td className="py-3.5 text-gray-300">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${pairVol > 16 ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                        {pairVol}%
                      </span>
                    </td>
                    <td className="py-3.5 text-[11px] text-gray-500">
                      {snap.source}
                    </td>
                    <td className="py-3.5 text-right pr-2">
                      <StatusBadge status={snap.status} size="sm" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
            <Radio className="w-5 h-5 text-[#10B981] animate-pulse" />
            <span>REAL LIVE MARKET MONITOR</span>
          </h2>
          <p className="text-xs text-gray-400">
            Real-time public tickers, interactive candlestick price charts, and multi-timeframe volatility analytics
          </p>
        </div>
        <StatusBadge status={activeSnap?.status || 'LIVE'} />
      </div>

      <ReorderableCardSection
        storageKey="gxq_markets_layout"
        items={marketSections}
        defaultOrder={['markets_chart', 'markets_pairs']}
      />
    </div>
  );
};
