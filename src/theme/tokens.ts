/**
 * GXQ Network V3.0.0 — Enterprise Design System Tokens
 * Master Theme Contract: Cyber-Futuristic Enterprise Glass
 */

export const THEME_TOKENS = {
  colors: {
    bgPrimary: '#030507',
    bgSecondary: '#070B12',
    surfaceGlass: 'rgba(255, 255, 255, 0.055)',
    surfaceGlassElevated: 'rgba(255, 255, 255, 0.08)',
    surfaceGlassActive: 'rgba(0, 168, 255, 0.12)',
    borderGlass: 'rgba(255, 255, 255, 0.10)',
    borderGlassBright: 'rgba(0, 168, 255, 0.40)',
    
    // Core Accent Illuminations
    bluePrimary: '#00A8FF',
    blueGlow: '#008CFF',
    purplePrimary: '#A855F7',
    purpleGlow: '#9333EA',
    orangePrimary: '#FF7A00',
    orangeGlow: '#FF5500',
    redPrimary: '#FF304F',
    redGlow: '#FF1744',
    yellowPrimary: '#FFD400',
    yellowGlow: '#EAB308',
    greenPrimary: '#10B981',
    greenGlow: '#059669',
    
    // High-Contrast Typography
    textPrimary: '#F5F7FA',
    textSecondary: '#9AA6B2',
    textMuted: '#66717D',
  },
  glassLevels: {
    level1: 'bg-[#070B12]/60 backdrop-blur-md border border-white/5 shadow-sm',
    level2: 'bg-[#070B12]/80 backdrop-blur-lg border border-white/10 shadow-lg shadow-black/40',
    level3: 'bg-[#0B132B]/70 backdrop-blur-xl border border-[#00A8FF]/20 shadow-xl shadow-[#00A8FF]/5',
    level4: 'bg-[#0E1A38]/90 backdrop-blur-2xl border border-[#00A8FF]/40 shadow-2xl shadow-[#00A8FF]/15',
  },
  animations: {
    transitionFast: '150ms cubic-bezier(0.16, 1, 0.3, 1)',
    transitionNormal: '250ms cubic-bezier(0.16, 1, 0.3, 1)',
  }
} as const;

export type FlashType = 
  | 'BLUE_FLASH' 
  | 'ORANGE_FLASH' 
  | 'RED_FLASH' 
  | 'YELLOW_FLASH' 
  | 'SUCCESS_FLASH' 
  | 'ERROR_FLASH' 
  | 'WALLET_FLASH' 
  | 'LIVE_UPDATE_FLASH' 
  | 'AI_INSIGHT_FLASH';
