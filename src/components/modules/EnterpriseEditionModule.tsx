import React, { useState } from 'react';
import { GlassCard } from '../common/GlassCard';
import { StatusBadge } from '../common/StatusBadge';
import { SmartWalletUser } from '../../services/smartWallet';
import { telemetry } from '../../services/telemetry';
import { 
  Building2, 
  ShieldCheck, 
  Server, 
  Lock, 
  Zap, 
  CheckCircle2, 
  FileCode2, 
  Award, 
  Clock, 
  ChevronRight,
  Flame
} from 'lucide-react';
import { ReorderableCardSection, SectionItem } from '../common/ReorderableCardSection';

interface EnterpriseEditionProps {
  currentUser: SmartWalletUser | null;
  triggerFlash: (type: any) => void;
}

export const EnterpriseEditionModule: React.FC<EnterpriseEditionProps> = ({
  currentUser,
  triggerFlash,
}) => {
  const [subnetName, setSubnetName] = useState('Apex Institutional Subnet');
  const [dedicatedNodes, setDedicatedNodes] = useState(5);
  const [privacyLevel, setPrivacyLevel] = useState<'zk_confidential' | 'semi_private' | 'public_audit'>('zk_confidential');
  const [selectedSla, setSelectedSla] = useState<'sovereign' | 'enterprise'>('sovereign');
  const [isDeployingSubnet, setIsDeployingSubnet] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<string | null>(null);

  const handleDeploySubnet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeployingSubnet(true);
    triggerFlash('ORANGE_FLASH');

    const correlationId = telemetry.generateCorrelationId();
    telemetry.log({
      eventType: 'transaction_request',
      severity: 'INFO',
      actorAddress: currentUser?.smartWalletAddress,
      correlationId,
      payload: {
        action: 'provision_enterprise_subnet',
        subnetName,
        dedicatedNodes,
        privacyLevel,
        slaTier: selectedSla,
      }
    });

    await new Promise(r => setTimeout(r, 1400));
    setIsDeployingSubnet(false);
    setDeploymentResult(`Subnet "${subnetName}" successfully initialized with ${dedicatedNodes} dedicated validator nodes and ${selectedSla.toUpperCase()} 99.999% SLA!`);
    triggerFlash('SUCCESS_FLASH');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white tracking-wide flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#FF7A00]" />
            <span>EXCLUSIVE ENTERPRISE EDITION PORTAL</span>
          </h2>
          <p className="text-xs text-gray-400">
            Dedicated private execution subnets, institutional zero-knowledge privacy rollups, and 99.999% SLA infrastructure
          </p>
        </div>
        <StatusBadge status="ENTERPRISE" />
      </div>

      {/* Touch-Optimized Drag-and-Drop Reorderable Enterprise Modules */}
      <ReorderableCardSection
        storageKey="gxq_enterprise_layout"
        items={[
          {
            id: 'enterprise_sla',
            title: 'Institutional SLA Guarantee Tiers',
            subtitle: 'High-availability sequencer subnets, 99.9% to 99.999% sovereign uptime',
            neonColor: 'orange',
            icon: <Award className="w-4 h-4 text-[#FF7A00]" />,
            content: (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 glow-card-blue">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-white font-mono">Standard Enterprise</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-gray-300">99.9% Uptime</span>
                  </div>
                  <div className="text-xl font-black font-mono text-white">$2,500 <span className="text-xs text-gray-400">/ mo</span></div>
                  <div className="text-[11px] text-gray-400 mt-2 space-y-1 font-mono">
                    <div>• 3 Dedicated Sequencer Nodes</div>
                    <div>• 1-hour engineering response</div>
                    <div>• Standard EVM compatibility</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/50 border border-[#FF7A00]/40 shadow-[0_0_20px_-3px_rgba(255,122,0,0.3)] glow-card-orange">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-[#FF7A00] font-mono flex items-center gap-1">
                      <Award className="w-4 h-4" /> Sovereign Institutional
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF7A00]/20 text-[#FFD400] font-bold">99.999% SLA</span>
                  </div>
                  <div className="text-xl font-black font-mono text-white">$8,500 <span className="text-xs text-gray-400">/ mo</span></div>
                  <div className="text-[11px] text-gray-300 mt-2 space-y-1 font-mono">
                    <div>• Up to 20 Isolated Validator Nodes</div>
                    <div>• 10-minute SLA dedicated War Room</div>
                    <div>• zk-SNARK confidential balances</div>
                    <div>• Custom gas token settlement</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/10 glow-card-purple">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-white font-mono">Government & Consortium</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#A855F7]/20 text-[#A855F7]">Custom SLA</span>
                  </div>
                  <div className="text-xl font-black font-mono text-white">Custom Quorum</div>
                  <div className="text-[11px] text-gray-400 mt-2 space-y-1 font-mono">
                    <div>• Sovereign on-premise hardware</div>
                    <div>• Post-quantum SPHINCS+ enclave</div>
                    <div>• Regulatory auditor view-keys</div>
                  </div>
                </div>
              </div>
            ),
          },
          {
            id: 'enterprise_deployer',
            title: 'Provision Dedicated Enterprise Subnet',
            subtitle: 'Zero-knowledge privacy levels, dedicated validator nodes and custom SLA',
            neonColor: 'blue',
            icon: <Server className="w-4 h-4 text-[#00A8FF]" />,
            content: (
              <form onSubmit={handleDeploySubnet} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1.5 font-mono">Subnet Designation</label>
                    <input
                      type="text"
                      value={subnetName}
                      onChange={(e) => setSubnetName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white outline-none focus:border-[#FF7A00]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1.5 font-mono">Dedicated Validator Nodes</label>
                    <select
                      value={dedicatedNodes}
                      onChange={(e) => setDedicatedNodes(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B12] border border-white/10 text-xs font-mono text-white outline-none"
                    >
                      <option value={3}>3 Nodes (Basic Fault Tolerance)</option>
                      <option value={5}>5 Nodes (High Performance - Recommended)</option>
                      <option value={10}>10 Nodes (High Security Multi-Region)</option>
                      <option value={20}>20 Nodes (Institutional Consensus Quorum)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1.5 font-mono">Zero-Knowledge Privacy Level</label>
                    <select
                      value={privacyLevel}
                      onChange={(e) => setPrivacyLevel(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B12] border border-white/10 text-xs font-mono text-white outline-none"
                    >
                      <option value="zk_confidential">zk-SNARK Confidential Balances (Shielded)</option>
                      <option value="semi_private">Semi-Private (Auditor View-Key Enabled)</option>
                      <option value="public_audit">Public Audit (Fully Transparent EVM)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-1.5 font-mono">Service Level Agreement Tier</label>
                    <select
                      value={selectedSla}
                      onChange={(e) => setSelectedSla(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B12] border border-white/10 text-xs font-mono text-white outline-none"
                    >
                      <option value="sovereign">Sovereign Institutional (99.999% SLA)</option>
                      <option value="enterprise">Standard Enterprise (99.9% SLA)</option>
                    </select>
                  </div>
                </div>

                {deploymentResult && (
                  <div className="p-3.5 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-xs text-[#10B981] font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{deploymentResult}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isDeployingSubnet}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF7A00] via-[#FF5500] to-[#FF7A00] text-black font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all shadow-[0_0_20px_rgba(255,122,0,0.3)]"
                >
                  {isDeployingSubnet ? 'Provisioning Dedicated Subnet...' : 'Request & Provision Enterprise Subnet'}
                </button>
              </form>
            ),
          },
          {
            id: 'enterprise_templates',
            title: 'Audited Enterprise Smart Contract Templates',
            subtitle: 'ERC-3643 compliant security tokens, compliant DeFi vaults, consortium multicall',
            neonColor: 'purple',
            icon: <FileCode2 className="w-4 h-4 text-[#A855F7]" />,
            content: (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="font-bold text-white mb-1">Asset Tokenization</div>
                  <p className="text-[11px] text-gray-400">ERC-3643 compliant security tokens with automated permission transfers.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="font-bold text-white mb-1">Compliant DeFi Vault</div>
                  <p className="text-[11px] text-gray-400">Yield strategy contract with on-chain KYC/AML verification gates.</p>
                </div>
                <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="font-bold text-white mb-1">Consortium Multicall</div>
                  <p className="text-[11px] text-gray-400">Batched cross-shard settlement with threshold signature approvals.</p>
                </div>
              </div>
            ),
          },
        ]}
        defaultOrder={['enterprise_sla', 'enterprise_deployer', 'enterprise_templates']}
      />

    </div>
  );
};
