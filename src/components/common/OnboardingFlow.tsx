import React, { useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { X, ChevronRight, CheckCircle2 } from 'lucide-react';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    { title: 'Welcome to GXQ Network', desc: 'The next generation of enterprise-grade decentralized finance.' },
    { title: 'Smart Wallet', desc: 'Securely interact with contracts using deterministic account abstraction.' },
    { title: 'Environment Switching', desc: 'Easily switch between Local, Devnet, Testnet, and Mainnet.' },
    { title: 'Explore & Stake', desc: 'View your portfolio and start earning rewards in staking vaults.' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <GlassCard className="max-w-lg w-full p-6 relative">
        <button onClick={onComplete} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
        <h2 className="text-2xl font-black text-white mb-2">{steps[step].title}</h2>
        <p className="text-gray-400 text-sm mb-6">{steps[step].desc}</p>
        <div className="flex gap-2 mb-6">
          {steps.map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-[#00A8FF]' : 'bg-white/10'}`} />)}
        </div>
        <button 
          onClick={() => step < steps.length - 1 ? setStep(step + 1) : onComplete()}
          className="w-full py-3 rounded-xl bg-[#00A8FF] text-black font-bold flex items-center justify-center gap-2"
        >
          {step < steps.length - 1 ? 'Next' : 'Get Started'} <ChevronRight className="w-4 h-4" />
        </button>
      </GlassCard>
    </div>
  );
};
