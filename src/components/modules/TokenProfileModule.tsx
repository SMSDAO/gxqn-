import React, { useState, useMemo } from 'react';
import { GlassCard } from '../common/GlassCard';
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { HistoricalDataPoint } from './MarketsModule';
import { alertService } from '../../services/alertService';
import { tokenRegistry } from '../../services/tokenRegistry';

interface TokenProfileModuleProps {
  tokenSymbol: string;
}

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

export const TokenProfileModule: React.FC<TokenProfileModuleProps> = ({ tokenSymbol }) => {
  const [timeframe, setTimeframe] = useState<string>('1D');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [alerts, setAlerts] = useState(() => alertService.getAlerts(tokenSymbol));
  const [metadataJson, setMetadataJson] = useState(tokenRegistry.getTokenByAddress(tokenSymbol)?.metadataJson || '');

  const handleSetAlert = () => {
    if (!targetPrice) return;
    alertService.addAlert({
      tokenSymbol,
      targetPrice: parseFloat(targetPrice),
      condition,
    });
    setAlerts(alertService.getAlerts(tokenSymbol));
    setTargetPrice('');
  };

  const handleUpdateMetadata = () => {
    tokenRegistry.updateToken(tokenSymbol, { metadataJson });
  };
  
  const historicalData = useMemo(() => {
    const data: HistoricalDataPoint[] = [];
    const now = Date.now();
    for (let i = 0; i < 50; i++) {
      const open = 1 + Math.random();
      const close = 1 + Math.random();
      data.push({
        timestamp: new Date(now - i * 3600000).toISOString(),
        timeLabel: `${i}h`,
        open,
        high: Math.max(open, close) + 0.1,
        low: Math.min(open, close) - 0.1,
        close,
        price: close,
        upperBand: 0, lowerBand: 0, volatility: 0,
        volume: Math.random() * 1000,
        isBullish: close >= open,
        changePercent: 0,
      });
    }
    return data.reverse();
  }, [tokenSymbol, timeframe]);

  return (
    <div className="space-y-6">
      <GlassCard level={2} className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-white">{tokenSymbol} Profile</h2>
          <div className="flex gap-2">
            {['1H', '12H', '1D', '1W', '1M', '1Y', 'ALL'].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-xs font-mono rounded ${timeframe === tf ? 'bg-[#00A8FF] text-white' : 'bg-white/5 text-gray-400'}`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={historicalData}>
            <XAxis dataKey="timeLabel" hide />
            <YAxis yAxisId="price" domain={['auto', 'auto']} hide />
            <YAxis yAxisId="volume" domain={[0, (max: number) => max * 4]} hide />
            <Tooltip contentStyle={{ backgroundColor: '#070B12', border: '1px solid rgba(255,255,255,0.1)' }} />
            <Bar yAxisId="volume" dataKey="volume" fill="rgba(255,255,255,0.05)" />
            <Bar yAxisId="price" dataKey="close" shape={<CandlestickShape />} />
          </ComposedChart>
        </ResponsiveContainer>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <GlassCard level={2} className="p-6 col-span-3">
            <h3 className="text-sm font-bold text-gray-400 mb-4">Set Price Alert & Edit Metadata</h3>
            <div className="flex gap-2 mb-4">
                <input 
                    type="number" 
                    value={targetPrice} 
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="Target Price"
                    className="bg-[#070B12] border border-white/10 rounded px-3 py-1.5 text-white text-sm"
                />
                <select value={condition} onChange={(e) => setCondition(e.target.value as any)} className="bg-[#070B12] border border-white/10 rounded px-2 text-white text-sm">
                    <option value="above">Above</option>
                    <option value="below">Below</option>
                </select>
                <button onClick={handleSetAlert} className="bg-[#00A8FF] text-white px-4 py-1.5 rounded text-sm font-bold">Set Alert</button>
            </div>
            <textarea 
                value={metadataJson}
                onChange={(e) => setMetadataJson(e.target.value)}
                className="w-full bg-[#070B12] border border-white/10 rounded px-3 py-2 text-white text-sm font-mono h-24"
                placeholder='{"description": "...", "website": "..."}'
            />
            <button onClick={handleUpdateMetadata} className="mt-3 bg-[#00A8FF] text-white px-4 py-1.5 rounded text-sm font-bold">Update Metadata</button>
        </GlassCard>
        <div className="space-y-6">
            <GlassCard level={2} className="p-6">
                <h3 className="text-sm font-bold text-gray-400 mb-4">Liquidity</h3>
                <p className="text-2xl font-bold text-white">$1.2M</p>
            </GlassCard>
            <GlassCard level={2} className="p-6">
                <h3 className="text-sm font-bold text-gray-400 mb-4">Safety Score</h3>
                <p className="text-2xl font-bold text-[#10B981]">98/100</p>
            </GlassCard>
        </div>
      </div>
    </div>
  );
};
