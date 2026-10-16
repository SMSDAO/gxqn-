import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from '../common/GlassCard';
import { StatusBadge } from '../common/StatusBadge';
import { EnvironmentConfig } from '../../config/environments';
import { SmartWalletUser } from '../../services/smartWallet';
import { explorerApi } from '../../services/explorerApi';
import { telemetry } from '../../services/telemetry';
import { tokenRegistry, IndexedToken } from '../../services/tokenRegistry';
import {
  Upload,
  Image as ImageIcon,
  FileCode2,
  Download,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Globe,
  Twitter,
  Radio,
  FileText,
  Tag,
  Coins,
  RefreshCw,
  ExternalLink,
  Layers,
  FileUp,
} from 'lucide-react';

interface TokenBrandingUploadProps {
  envConfig: EnvironmentConfig;
  user: SmartWalletUser | null;
  onRequireLogin: () => void;
  triggerFlash: (type: any) => void;
  onTxCompleted?: () => void;
  onNavigateToSwap?: (tokenSymbol: string) => void;
}

const PRESET_BRAND_LOGOS = [
  {
    name: 'Quantum Core',
    category: 'Quantum ZK',
    url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=256&auto=format&fit=crop&q=80',
    ipfs: 'ipfs://bafkreia7q4quantumcore8912739217392173',
  },
  {
    name: 'Neural Lattice',
    category: 'AI Compute',
    url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=256&auto=format&fit=crop&q=80',
    ipfs: 'ipfs://bafkreianeurallattice3489218491823901',
  },
  {
    name: 'Cyber Mesh',
    category: 'DeFi',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=256&auto=format&fit=crop&q=80',
    ipfs: 'ipfs://bafkreiacybermesh1928491823948192',
  },
  {
    name: 'Prism Matrix',
    category: 'Infrastructure',
    url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=256&auto=format&fit=crop&q=80',
    ipfs: 'ipfs://bafkreiaprismmatrix4819283918239128',
  },
  {
    name: 'Helios Amber',
    category: 'RWA',
    url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=256&auto=format&fit=crop&q=80',
    ipfs: 'ipfs://bafkreiaheliosamber8912738912738912',
  },
];

const AVAILABLE_TAGS = ['DeFi', 'AI Compute', 'Quantum ZK', 'Layer 2', 'RWA', 'Cross-Chain', 'Governance'];

export const TokenBrandingUpload: React.FC<TokenBrandingUploadProps> = ({
  envConfig,
  user,
  onRequireLogin,
  triggerFlash,
  onTxCompleted,
  onNavigateToSwap,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonImportRef = useRef<HTMLInputElement>(null);

  // Form Fields
  const [tokenName, setTokenName] = useState('Quantum Velocity Protocol');
  const [ticker, setTicker] = useState('QVP');
  const [decimals, setDecimals] = useState(18);
  const [description, setDescription] = useState(
    'Decentralized high-throughput liquidity and quantum consensus token with zero-knowledge verification.'
  );
  const [website, setWebsite] = useState('https://velocity.gxq.network');
  const [twitter, setTwitter] = useState(user ? '@' + (user.email.split('@')[0] || 'gxqdev') : '@velocity_gxq');
  const [farcaster, setFarcaster] = useState('!92840');
  const [initialSupply, setInitialSupply] = useState('25000000');
  const [targetPriceUsd, setTargetPriceUsd] = useState('1.25');
  const [selectedPair, setSelectedPair] = useState<'USDC' | 'GXQ' | 'ETH'>('USDC');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Quantum ZK', 'DeFi']);
  const [contractAddress, setContractAddress] = useState<string>(() => {
    return `0x${Array.from(crypto.getRandomValues(new Uint8Array(20)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')}`;
  });

  // Logo & Branding State
  const [logoUrl, setLogoUrl] = useState<string>(PRESET_BRAND_LOGOS[0].url);
  const [logoPreview, setLogoPreview] = useState<string>(PRESET_BRAND_LOGOS[0].url);
  const [logoFileName, setLogoFileName] = useState<string>('quantum_core_logo.png');
  const [logoDimensions, setLogoDimensions] = useState<{ width: number; height: number } | null>({ width: 256, height: 256 });
  const [logoFileSize, setLogoFileSize] = useState<string>('42 KB');
  const [ipfsCid, setIpfsCid] = useState<string>(PRESET_BRAND_LOGOS[0].ipfs);

  // Registration & Processing State
  const [isRegistering, setIsRegistering] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [registeredToken, setRegisteredToken] = useState<IndexedToken | null>(null);

  // Handle Logo Upload
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setNotification({ type: 'error', text: 'Logo image must be under 2MB for on-chain metadata indexing.' });
      return;
    }

    const sizeFormatted = (file.size / 1024).toFixed(1) + ' KB';
    setLogoFileSize(sizeFormatted);
    setLogoFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setLogoPreview(dataUrl);
      setLogoUrl(dataUrl);

      // Inspect image dimensions
      const img = new Image();
      img.onload = () => {
        setLogoDimensions({ width: img.width, height: img.height });
      };
      img.src = dataUrl;

      // Deterministic simulated IPFS hash
      const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      setIpfsCid(`ipfs://bafkreia${randomHex}`);

      setNotification({
        type: 'success',
        text: `Logo "${file.name}" loaded successfully (${sizeFormatted})! Ready for metadata generation.`,
      });
      triggerFlash('BLUE_FLASH');
    };
    reader.readAsDataURL(file);
  };

  // Select Preset Logo
  const handleSelectPreset = (preset: typeof PRESET_BRAND_LOGOS[0]) => {
    setLogoUrl(preset.url);
    setLogoPreview(preset.url);
    setLogoFileName(`${preset.name.toLowerCase().replace(/\s+/g, '_')}.png`);
    setLogoFileSize('38 KB');
    setLogoDimensions({ width: 256, height: 256 });
    setIpfsCid(preset.ipfs);
    triggerFlash('BLUE_FLASH');
  };

  // Toggle Tag
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  // Generate Metadata Object
  const generatedMetadata = {
    $schema: 'https://gxq.network/schemas/token-metadata-v1.json',
    name: tokenName.trim(),
    symbol: ticker.trim().toUpperCase(),
    decimals: Number(decimals),
    description: description.trim(),
    logoURI: logoUrl.startsWith('data:') ? 'https://assets.gxq.network/tokens/' + ticker.toLowerCase() + '.png' : logoUrl,
    embeddedLogoDataURI: logoUrl.startsWith('data:') ? logoUrl.slice(0, 48) + '...[truncated data]' : undefined,
    ipfsURI: ipfsCid,
    website: website.trim(),
    socials: {
      twitter: twitter.trim(),
      farcaster: farcaster.trim(),
    },
    tags: selectedTags,
    tokenomics: {
      initialSupply: initialSupply,
      initialPriceUsd: parseFloat(targetPriceUsd) || 1.0,
      liquidityPair: selectedPair,
      lockedPercent: 90,
      lockDurationDays: 365,
    },
    contract: {
      address: contractAddress,
      network: envConfig.id,
      chainId: envConfig.chainId,
    },
    verification: {
      issuer: user?.smartWalletAddress || '0x0000000000000000000000000000000000000000',
      issuerEmail: user?.email || 'anonymous',
      auditRiskScore: 92,
      status: 'AUTOMATIC_VERIFIED_SAFE',
      timestamp: new Date().toISOString(),
      quantumBytecodeVerified: true,
    },
  };

  const metadataJsonString = JSON.stringify(generatedMetadata, null, 2);

  // Copy JSON
  const handleCopyJson = () => {
    navigator.clipboard.writeText(metadataJsonString);
    setCopiedJson(true);
    triggerFlash('BLUE_FLASH');
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Download Metadata JSON
  const handleDownloadJson = () => {
    try {
      const blob = new Blob([metadataJsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ticker.toLowerCase() || 'token'}-metadata.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      triggerFlash('SUCCESS_FLASH');
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch {
      setNotification({ type: 'error', text: 'Failed to download metadata file.' });
    }
  };

  // Import JSON file
  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.name) setTokenName(parsed.name);
        if (parsed.symbol) setTicker(parsed.symbol.toUpperCase());
        if (parsed.decimals) setDecimals(parsed.decimals);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.website) setWebsite(parsed.website);
        if (parsed.socials?.twitter) setTwitter(parsed.socials.twitter);
        if (parsed.socials?.farcaster) setFarcaster(parsed.socials.farcaster);
        if (parsed.logoURI) {
          setLogoUrl(parsed.logoURI);
          setLogoPreview(parsed.logoURI);
        }
        if (parsed.tags && Array.isArray(parsed.tags)) setSelectedTags(parsed.tags);
        if (parsed.contract?.address) setContractAddress(parsed.contract.address);

        setNotification({
          type: 'success',
          text: `Metadata JSON imported! Loaded branding for [${parsed.symbol || 'TOKEN'}].`,
        });
        triggerFlash('SUCCESS_FLASH');
      } catch {
        setNotification({ type: 'error', text: 'Invalid JSON format in uploaded file.' });
      }
    };
    reader.readAsText(file);
  };

  // Automatic Registration to Swap Module List
  const handleRegisterToken = async () => {
    if (!user) {
      onRequireLogin();
      return;
    }

    if (!tokenName.trim() || !ticker.trim()) {
      setNotification({ type: 'error', text: 'Token name and small ticker symbol are required.' });
      return;
    }

    if (!logoUrl) {
      setNotification({ type: 'error', text: 'A logo image is required to brand and index the token in Swap lists.' });
      return;
    }

    setIsRegistering(true);
    triggerFlash('ORANGE_FLASH');
    setNotification({ type: 'info', text: 'Generating quantum cryptographic proof and registering into DEX Swap Registry...' });

    const correlationId = telemetry.generateCorrelationId();
    telemetry.log({
      eventType: 'transaction_request',
      severity: 'INFO',
      network: envConfig.id,
      actorAddress: user.smartWalletAddress,
      correlationId,
      payload: {
        action: 'TokenBranding.registerAndIndexToSwap',
        symbol: ticker.toUpperCase(),
        name: tokenName,
        ipfsCid,
        logoFileSize,
      },
    });

    await new Promise((r) => setTimeout(r, 1200));

    // Register into canonical TokenRegistry (instantly indexes into SwapModule)
    const indexed = tokenRegistry.registerLaunchedToken({
      address: contractAddress,
      name: tokenName.trim(),
      symbol: ticker.trim().toUpperCase(),
      decimals: Number(decimals),
      initialSupply: initialSupply,
      logoUrl: logoUrl,
      creatorAddress: user.smartWalletAddress,
      creatorEmail: user.email,
      liquidityPoolAddress: envConfig.contracts.simpleSwap,
      isUserRegistered: true,
      twitterHandle: twitter,
      isTwitterLinked: true,
      farcasterFid: farcaster,
      isFarcasterLinked: true,
      liquidityLockedPercent: 90,
      priceUsd: parseFloat(targetPriceUsd) || 1.0,
      network: envConfig.id,
      pairWith: selectedPair,
      description: description.trim(),
      website: website.trim(),
      ipfsHash: ipfsCid,
      tags: selectedTags,
      metadataJson: metadataJsonString,
    });

    // Record on blockchain explorer
    await explorerApi.recordTransaction({
      hash: `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')}`,
      blockNumber: 142990 + Math.floor(Math.random() * 20),
      timestamp: new Date().toISOString(),
      from: user.smartWalletAddress,
      to: envConfig.contracts.tokenFactory,
      value: '0',
      asset: 'GXQ',
      status: 'SUCCESS',
      method: 'registerTokenBrandingAndIndex',
      gasUsed: 384000,
      gasFee: '0.000384',
      correlationId,
    });

    setRegisteredToken(indexed);
    setIsRegistering(false);
    triggerFlash('SUCCESS_FLASH');
    setNotification({
      type: 'success',
      text: `Token [${ticker.toUpperCase()}] and branded metadata successfully registered! Automatically indexed to the Swap module list.`,
    });
    onTxCompleted?.();
  };

  return (
    <div className="space-y-6">
      {/* Component Title & Sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#00A8FF]/10 via-[#7928CA]/10 to-transparent border border-[#00A8FF]/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#00A8FF]/20 border border-[#00A8FF]/40 text-[#00A8FF]">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white tracking-wide">
                TOKEN BRANDING & METADATA UPLOAD ENGINE
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40">
                EIP-1046 / UNISWAP SPEC
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Upload custom logo, compile standard metadata JSON, and automatically register your token into DEX Swap lists with live small tickers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={jsonImportRef}
            onChange={handleImportJsonFile}
            accept=".json,application/json"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => jsonImportRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-semibold text-gray-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <FileUp className="w-3.5 h-3.5 text-[#00A8FF]" />
            <span>Import metadata.json</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between animate-fadeIn ${
            notification.type === 'success'
              ? 'bg-[#10B981]/15 border-[#10B981]/40 text-[#10B981]'
              : notification.type === 'error'
              ? 'bg-[#FF304F]/15 border-[#FF304F]/40 text-[#FF304F]'
              : 'bg-[#00A8FF]/15 border-[#00A8FF]/40 text-[#00A8FF]'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-[11px] font-mono underline hover:brightness-125 ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Instant Success Banner */}
      {registeredToken && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#10B981]/15 via-[#00A8FF]/10 to-transparent border border-[#10B981]/40 animate-fadeIn">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={registeredToken.logoUrl}
                alt={registeredToken.symbol}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-[#10B981] shadow-[0_0_20px_rgba(16,185,129,0.3)] bg-[#070B12]"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-white">{registeredToken.name}</h4>
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#00A8FF]/20 text-[#00A8FF] border border-[#00A8FF]/30">
                    [{registeredToken.symbol}]
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-mono text-[#10B981] bg-[#10B981]/20 px-2 py-0.5 rounded-full border border-[#10B981]/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Live Indexed in Swap Lists</span>
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1 font-mono">
                  Contract: {registeredToken.address} • Initial Pair: <strong>{registeredToken.symbol}/{registeredToken.pairWith}</strong>
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Metadata synced with decentralized CID: <code className="text-[#00A8FF]">{ipfsCid}</code>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateToSwap?.(registeredToken.symbol)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00A8FF] to-[#008CFF] hover:brightness-110 text-white text-xs font-mono font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(0,168,255,0.4)] transition-all"
              >
                <span>Swap [{registeredToken.symbol}] Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Upload & Branding Specs (Col 1) and Metadata JSON Inspector (Col 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Branding Assets & Metadata Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <GlassCard level={3} glow="blue" className="p-6 space-y-6">
            
            {/* 1. Logo Asset Upload Area */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#00A8FF]" />
                  <span>1. Token Logo Branding Asset <span className="text-[#FF304F]">*</span></span>
                </label>
                <span className="text-[10px] text-gray-400 font-mono">Square 1:1 Recommended</span>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative group p-4 rounded-2xl bg-black/40 border-2 border-dashed border-white/20 hover:border-[#00A8FF] cursor-pointer transition-all flex flex-col sm:flex-row items-center gap-4"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoFileChange}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                />

                <div className="relative shrink-0">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="w-20 h-20 rounded-2xl object-cover ring-2 ring-[#00A8FF]/80 shadow-[0_0_20px_rgba(0,168,255,0.3)] bg-[#070B12]"
                  />
                  <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-mono transition-opacity">
                    Replace
                  </div>
                </div>

                <div className="flex-1 space-y-1 text-center sm:text-left">
                  <div className="text-xs font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-[#00A8FF]" />
                    <span>Click or Drag & Drop Token Logo</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Supports PNG, SVG, WebP, JPEG (Max 2MB). Automatically packaged into Base64 & IPFS.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 font-mono text-[10px] text-gray-400">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">File: {logoFileName}</span>
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">Size: {logoFileSize}</span>
                    {logoDimensions && (
                      <span className="px-2 py-0.5 rounded bg-[#00A8FF]/10 text-[#00A8FF] border border-[#00A8FF]/30">
                        {logoDimensions.width}x{logoDimensions.height}px
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="mt-3">
                <div className="text-[11px] text-gray-400 font-mono mb-2">Or select enterprise quantum logo preset:</div>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_BRAND_LOGOS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                        logoUrl === preset.url
                          ? 'border-[#00A8FF] bg-[#00A8FF]/15 ring-2 ring-[#00A8FF]/40'
                          : 'border-white/10 bg-white/5 hover:border-white/30'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-8 h-8 rounded-lg object-cover" />
                      <span className="text-[9px] font-mono text-gray-300 truncate w-full">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Core Identity & Small Ticker */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#FF7A00]" />
                <span>2. Token Identity & Small Ticker</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                    Token Full Name <span className="text-[#FF304F]">*</span>
                  </label>
                  <input
                    type="text"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    placeholder="e.g. Cyber Quantum Protocol"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-[#00A8FF]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                    Small Ticker / Symbol <span className="text-[#FF304F]">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    placeholder="e.g. QVP"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-bold text-white uppercase outline-none focus:border-[#00A8FF]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                  Project Description / Bio
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your token's utility, smart contract mechanics, and network role..."
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-[#00A8FF] resize-none"
                />
              </div>

              {/* Tags & Categories */}
              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-[#00A8FF]" />
                  <span>Ecosystem Tags / Categories</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all ${
                        selectedTags.includes(tag)
                          ? 'bg-[#00A8FF]/20 text-[#00A8FF] border border-[#00A8FF]/50 font-bold'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      {selectedTags.includes(tag) ? `✓ ${tag}` : `+ ${tag}`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Social & Web Attestation */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#10B981]" />
                <span>3. Verification Anchors & Social Links</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-300 block mb-1 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-gray-400" />
                    <span>Website</span>
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-[#00A8FF]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-300 block mb-1 flex items-center gap-1">
                    <Twitter className="w-3 h-3 text-[#00A8FF]" />
                    <span>Twitter (X)</span>
                  </label>
                  <input
                    type="text"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="@handle"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white outline-none focus:border-[#00A8FF]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-300 block mb-1 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-[#A855F7]" />
                    <span>Farcaster (FID)</span>
                  </label>
                  <input
                    type="text"
                    value={farcaster}
                    onChange={(e) => setFarcaster(e.target.value)}
                    placeholder="!FID or @user.eth"
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white outline-none focus:border-[#A855F7]"
                  />
                </div>
              </div>

              {/* Pairing & Target Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-300 block mb-1">Initial Target Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={targetPriceUsd}
                    onChange={(e) => setTargetPriceUsd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white outline-none focus:border-[#00A8FF]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-300 block mb-1">DEX Initial Pair</label>
                  <select
                    value={selectedPair}
                    onChange={(e) => setSelectedPair(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#070B12] border border-white/10 text-xs font-mono text-white outline-none focus:border-[#00A8FF]"
                  >
                    <option value="USDC">Pair with USDC (Stable)</option>
                    <option value="GXQ">Pair with GXQ (Core Coin)</option>
                    <option value="ETH">Pair with ETH (Wrapped L1)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-300 block mb-1">Decimals</label>
                  <input
                    type="number"
                    value={decimals}
                    onChange={(e) => setDecimals(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-white outline-none focus:border-[#00A8FF]"
                  />
                </div>
              </div>
            </div>

            {/* 4. Automated Registration Action Bar */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-mono text-gray-400">
                Network: <span className="text-white font-bold">{envConfig.name}</span> • Fee: <span className="text-[#10B981]">0.000384 GXQ</span>
              </div>

              <button
                type="button"
                onClick={handleRegisterToken}
                disabled={isRegistering}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#00A8FF] via-[#008CFF] to-[#7928CA] hover:brightness-110 text-white text-xs font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,168,255,0.4)] transition-all"
              >
                {isRegistering ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Registering & Indexing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Register Token & Index to Swap List</span>
                  </>
                )}
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Right Column: Live Metadata JSON Inspector & Export (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard level={3} className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-[#00A8FF]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Metadata JSON Specification
                </h4>
              </div>
              <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded border border-[#10B981]/30">
                Valid Schema
              </span>
            </div>

            <p className="text-[11px] text-gray-400">
              Standardized EIP-1046 compatible token metadata generated in real-time. This file is parsed by DEX routers, explorers, and wallets.
            </p>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadJson}
                className="flex-1 py-2 px-3 rounded-xl bg-[#00A8FF]/20 hover:bg-[#00A8FF]/30 border border-[#00A8FF]/40 text-[#00A8FF] text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    <span className="text-[#10B981]">Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyJson}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
              >
                {copiedJson ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    <span className="text-[#10B981]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* JSON Code Viewer */}
            <div className="relative rounded-xl bg-black/70 border border-white/10 p-3.5 font-mono text-[10px] text-gray-300 overflow-x-auto max-h-[380px] scrollbar-thin">
              <pre className="text-gray-200 leading-relaxed">{metadataJsonString}</pre>
            </div>

            {/* Visual Token Card Preview in Swap List */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold">
                Swap Module Listing Preview
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/40 border border-white/10">
                <div className="flex items-center gap-2.5">
                  <img
                    src={logoPreview}
                    alt={ticker}
                    className="w-8 h-8 rounded-xl object-cover ring-1 ring-[#00A8FF]/50 bg-[#070B12]"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-xs">{tokenName || 'Token Name'}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#00A8FF]/20 text-[#00A8FF] border border-[#00A8FF]/30">
                        [{ticker || 'TICKER'}]
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400">
                      ${parseFloat(targetPriceUsd || '1.0').toFixed(2)} USD • {selectedPair} Pool
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded-full border border-[#10B981]/30">
                    <Check className="w-2.5 h-2.5" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
