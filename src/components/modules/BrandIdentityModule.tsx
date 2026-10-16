import React, { useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { StatusBadge } from '../common/StatusBadge';
import { Palette, Copy, Check, Download, Layers, ShieldCheck, Sparkles } from 'lucide-react';

export const BrandIdentityModule: React.FC = () => {
  const [copiedSvg, setCopiedSvg] = useState(false);

  const rawSvgCode = `<svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Quantum Hexagonal Outer Matrix -->
  <polygon points="120,20 206,70 206,170 120,220 34,170 34,70" stroke="url(#quantum_grad)" stroke-width="4" stroke-dasharray="6 4" opacity="0.6"/>
  <!-- Energy Nodes -->
  <circle cx="120" cy="20" r="7" fill="#00A8FF" filter="url(#glow)"/>
  <circle cx="206" cy="70" r="7" fill="#FF7A00" filter="url(#glow)"/>
  <circle cx="206" cy="170" r="7" fill="#A855F7" filter="url(#glow)"/>
  <circle cx="120" cy="220" r="7" fill="#10B981" filter="url(#glow)"/>
  <circle cx="34" cy="170" r="7" fill="#00A8FF" filter="url(#glow)"/>
  <circle cx="34" cy="70" r="7" fill="#FF7A00" filter="url(#glow)"/>
  <!-- Quantum Core Nexus -->
  <rect x="70" y="70" width="100" height="100" rx="28" fill="#070B12" stroke="url(#core_grad)" stroke-width="4"/>
  <text x="120" y="130" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="36" font-weight="900" fill="#F5F7FA" letter-spacing="-2">GXQ</text>
  <!-- Gradients & Glow -->
  <defs>
    <linearGradient id="quantum_grad" x1="34" y1="20" x2="206" y2="220" gradientUnits="userSpaceOnUse">
      <stop stop-color="#00A8FF"/>
      <stop offset="0.5" stop-color="#A855F7"/>
      <stop offset="1" stop-color="#FF7A00"/>
    </linearGradient>
    <linearGradient id="core_grad" x1="70" y1="70" x2="170" y2="170" gradientUnits="userSpaceOnUse">
      <stop stop-color="#00A8FF"/>
      <stop offset="1" stop-color="#008CFF"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
</svg>`;

  const handleCopySvg = () => {
    navigator.clipboard.writeText(rawSvgCode);
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#00A8FF]" />
            <span>GXQ BRAND IDENTITY & VECTOR LOGO SYSTEM</span>
          </h2>
          <p className="text-xs text-gray-400">
            Quantum energy lattice, post-quantum cryptographic security, and enterprise color tokens
          </p>
        </div>

        <button
          onClick={handleCopySvg}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-mono font-bold text-white transition-colors"
        >
          {copiedSvg ? <Check className="w-4 h-4 text-[#10B981]" /> : <Copy className="w-4 h-4" />}
          <span>{copiedSvg ? 'Copied Raw SVG!' : 'Copy Vector SVG Code'}</span>
        </button>
      </div>

      {/* Vector Logo Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Variant 1: Cyber-Futuristic Primary Logo */}
        <GlassCard level={3} glow="blue" className="p-6 text-center flex flex-col items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-[#00A8FF] font-bold block mb-4">
              Primary Quantum Identity
            </span>
            <div className="relative w-44 h-44 mx-auto my-3 flex items-center justify-center">
              {/* Rendered SVG */}
              <svg width="160" height="160" viewBox="0 0 240 240" fill="none" className="hover:scale-105 transition-transform duration-300">
                <polygon points="120,20 206,70 206,170 120,220 34,170 34,70" stroke="url(#showcase_grad)" strokeWidth="4" strokeDasharray="6 4" opacity="0.7"/>
                <circle cx="120" cy="20" r="8" fill="#00A8FF"/>
                <circle cx="206" cy="70" r="8" fill="#FF7A00"/>
                <circle cx="206" cy="170" r="8" fill="#A855F7"/>
                <circle cx="120" cy="220" r="8" fill="#10B981"/>
                <circle cx="34" cy="170" r="8" fill="#00A8FF"/>
                <circle cx="34" cy="70" r="8" fill="#FF7A00"/>
                
                <rect x="70" y="70" width="100" height="100" rx="26" fill="#070B12" stroke="#00A8FF" strokeWidth="4"/>
                <text x="120" y="132" textAnchor="middle" fontFamily="'JetBrains Mono', monospace" fontSize="34" fontWeight="900" fill="#F5F7FA" letterSpacing="-2">GXQ</text>

                <defs>
                  <linearGradient id="showcase_grad" x1="34" y1="20" x2="206" y2="220" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00A8FF"/>
                    <stop offset="0.5" stopColor="#A855F7"/>
                    <stop offset="1" stopColor="#FF7A00"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <div className="text-xs font-mono text-gray-400 mt-2">
            Usage: Hero headers, app favicon, mobile icon
          </div>
        </GlassCard>

        {/* Variant 2: Enterprise Monolith Horizontal */}
        <GlassCard level={2} className="p-6 text-center flex flex-col items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block mb-4">
              Horizontal Enterprise Logotype
            </span>
            <div className="my-8 p-4 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00A8FF] to-[#FF7A00] p-0.5">
                <div className="w-full h-full bg-[#070B12] rounded-[10px] flex items-center justify-center text-xs font-black font-mono text-white">
                  GXQ
                </div>
              </div>
              <div className="text-left font-mono">
                <div className="font-extrabold text-sm text-white tracking-wider">GXQ NETWORK</div>
                <div className="text-[10px] text-gray-400">V3.0.0 ENTERPRISE</div>
              </div>
            </div>
          </div>
          <div className="text-xs font-mono text-gray-400 mt-2">
            Usage: Whitepapers, investor decks, press releases
          </div>
        </GlassCard>

        {/* Variant 3: Monochrome Clean Variant */}
        <GlassCard level={2} className="p-6 text-center flex flex-col items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase text-gray-400 font-bold block mb-4">
              Monochrome Technical Variant
            </span>
            <div className="my-8 p-4 rounded-xl bg-white text-black flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white font-mono font-black text-xs">
                GXQ
              </div>
              <div className="text-left font-mono">
                <div className="font-extrabold text-sm tracking-wider">GXQ NETWORK</div>
                <div className="text-[10px] text-gray-600">POST-QUANTUM CORE</div>
              </div>
            </div>
          </div>
          <div className="text-xs font-mono text-gray-400 mt-2">
            Usage: High-contrast prints, physical badges
          </div>
        </GlassCard>

      </div>

      {/* Brand Color Token Palette */}
      <GlassCard level={2} className="p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
          Enterprise Color Palette Tokens
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
            <div className="w-full h-10 rounded-lg bg-[#030507] border border-white/20 mb-2" />
            <div className="font-bold text-white">Deep Obsidian</div>
            <div className="text-[10px] text-gray-400">#030507 (Base)</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
            <div className="w-full h-10 rounded-lg bg-[#00A8FF] mb-2 shadow-[0_0_10px_rgba(0,168,255,0.4)]" />
            <div className="font-bold text-white">Quantum Blue</div>
            <div className="text-[10px] text-gray-400">#00A8FF (Primary)</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
            <div className="w-full h-10 rounded-lg bg-[#FF7A00] mb-2 shadow-[0_0_10px_rgba(255,122,0,0.4)]" />
            <div className="font-bold text-white">Hazard Orange</div>
            <div className="text-[10px] text-gray-400">#FF7A00 (Action)</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
            <div className="w-full h-10 rounded-lg bg-[#A855F7] mb-2 shadow-[0_0_10px_rgba(168,85,247,0.4)]" />
            <div className="font-bold text-white">Ultraviolet</div>
            <div className="text-[10px] text-gray-400">#A855F7 (Consensus)</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
            <div className="w-full h-10 rounded-lg bg-[#10B981] mb-2 shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
            <div className="font-bold text-white">Emerald Finality</div>
            <div className="text-[10px] text-gray-400">#10B981 (Verified)</div>
          </div>
        </div>
      </GlassCard>

    </div>
  );
};
