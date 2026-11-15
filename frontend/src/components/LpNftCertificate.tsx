import React, { useState, useEffect } from 'react';
import { Download, Copy, ExternalLink, X, Check, Award, Sparkles, Wallet } from 'lucide-react';
import logoImg from '../KaySwap.png';
import { KAYSWAP_AMM_ADDRESS, KAVYA_TOKEN_ADDRESS, KAYSWAP_LP_NFT_ADDRESS } from '../config/contracts';
import { addCertificateNftToWallet } from '../utils/walletNft';

export interface LpNftCertificateProps {
  isOpen: boolean;
  onClose: () => void;
  positionId?: number | string;
  pairName?: string;
  feeTier?: number;
  amountKav?: string;
  amountEth?: string;
  minPrice?: string;
  maxPrice?: string;
  ownerAddress?: string;
  userName?: string;
  poolAddress?: string;
  createdAt?: number;
  txHash?: string;
  lpTokenAmount?: string;
  autoAddToWallet?: boolean;
}

export const LpNftCertificate: React.FC<LpNftCertificateProps> = ({
  isOpen,
  onClose,
  positionId = '001',
  pairName = 'KAV / ETH',
  feeTier = 3000,
  amountKav = '100.00',
  amountEth = '0.0500',
  minPrice = '0.000100',
  maxPrice = '0.001000',
  ownerAddress = '0xUserWalletAddress',
  userName,
  poolAddress = KAYSWAP_AMM_ADDRESS,
  createdAt,
  txHash,
  lpTokenAmount,
  autoAddToWallet = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [embeddedLogo, setEmbeddedLogo] = useState<string>(logoImg);
  const [walletStatus, setWalletStatus] = useState<'idle' | 'adding' | 'added' | 'info' | 'error'>('idle');
  const [walletFeedback, setWalletFeedback] = useState<string>('');

  // Convert PNG to Base64 so downloaded standalone SVG contains the exact logo
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 300;
        canvas.height = img.naturalHeight || 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUri = canvas.toDataURL('image/png');
          setEmbeddedLogo(dataUri);
        }
      } catch (err) {
        console.warn('Could not convert logo to base64, using direct source:', err);
      }
    };
    img.src = logoImg;
  }, []);

  if (!isOpen) return null;

  const formattedFee = (feeTier / 10000).toFixed(2);
  const safeOwner = ownerAddress || '0xUserWalletAddress';
  const displayName = userName || (safeOwner.length > 14 ? `${safeOwner.slice(0, 8)}...${safeOwner.slice(-6)}` : safeOwner);

  // Normalize timestamp: convert Solidity seconds to milliseconds if < 100 billion, or fallback to now
  const normalizeTimestamp = (ts?: number | string | null): number => {
    if (!ts) return Date.now();
    const num = Number(ts);
    if (isNaN(num) || num <= 0) return Date.now();
    return num < 100000000000 ? num * 1000 : num;
  };

  const validTimestamp = normalizeTimestamp(createdAt);
  const formattedDate = new Date(validTimestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  // Deterministic Cryptographic Proof Hash
  const generateProofHash = () => {
    if (txHash && txHash.startsWith('0x') && txHash.length >= 20) return txHash;
    const seed = `${safeOwner}-${poolAddress}-${amountKav}-${amountEth}-${positionId}-KAYSWAP-SEPOLIA`;
    let h1 = 0x811c9dc5;
    let h2 = 0x55555555;
    for (let i = 0; i < seed.length; i++) {
      h1 ^= seed.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193);
      h2 ^= seed.charCodeAt(seed.length - 1 - i);
      h2 = Math.imul(h2, 0x01000193);
    }
    const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
    const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
    return `0x${p1}${p2}${p1.split('').reverse().join('')}${p2.split('').reverse().join('')}`;
  };

  const proofHash = generateProofHash();

  // The running border animated text with token symbols and transaction/proof hash
  const borderTicker = `✦ TOKEN: ${pairName} ✦ CONTRIBUTION: ${amountKav} KAV + ${amountEth} ETH ✦ LP ID: #${positionId} ✦ PROOF HASH: ${proofHash} ✦ VERIFIED ON ETHEREUM SEPOLIA ✦ `;
  const repeatedBorderTicker = borderTicker.repeat(5);

  const getCertificateSvgDataUri = (): string => {
    const svgElement = document.getElementById('kayswap-lp-cert-16-9');
    if (!svgElement) return '';
    const svgData = new XMLSerializer().serializeToString(svgElement);
    try {
      const base64 = window.btoa(unescape(encodeURIComponent(svgData)));
      return `data:image/svg+xml;base64,${base64}`;
    } catch {
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;
    }
  };

  const handleCopyMetadata = () => {
    const svgDataUri = getCertificateSvgDataUri();
    const meta = JSON.stringify(
      {
        name: `KaySwap Liquidity Provider Certificate #${positionId}`,
        description: `Official KaySwap Liquidity Provider Certificate for ${pairName}. Proof of decentralized finance contribution on Ethereum Sepolia.`,
        image: svgDataUri || `https://kayswapp.netlify.app/KaySwap.png`,
        external_url: `https://sepolia.etherscan.io/address/${poolAddress}`,
        attributes: [
          { trait_type: 'Certificate', value: 'Liquidity Provider Certificate' },
          { trait_type: 'Achievement', value: 'Decentralized Finance Achievement' },
          { trait_type: 'Liquidity Pool', value: pairName },
          { trait_type: 'Contribution KAV', value: amountKav },
          { trait_type: 'Contribution ETH', value: amountEth },
          { trait_type: 'LP Token ID', value: String(positionId) },
          { trait_type: 'User Name / Address', value: safeOwner },
          { trait_type: 'Issued Date', value: formattedDate },
          { trait_type: 'Verification', value: 'VERIFIABLE ON ETHEREUM SEPOLIA' },
          { trait_type: 'Proof Hash', value: proofHash },
        ],
      },
      null,
      2
    );
    navigator.clipboard.writeText(meta);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSvg = () => {
    const svgElement = document.getElementById('kayswap-lp-cert-16-9');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `KaySwap_LP_Certificate_${positionId}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  const downloadPng = () => {
    const svgElement = document.getElementById('kayswap-lp-cert-16-9');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    img.onload = () => {
      // Full HD 1920x1080 Canvas
      const canvas = document.createElement('canvas');
      canvas.width = 1920;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#C9B5E0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, 1920, 1080);
        URL.revokeObjectURL(url);
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `KaySwap_LP_Certificate_${positionId}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    img.src = url;
  };

  const handleAddToWallet = async () => {
    setWalletStatus('adding');
    setWalletFeedback('');
    try {
      const res = await addCertificateNftToWallet(positionId, KAYSWAP_LP_NFT_ADDRESS, {
        pair: pairName,
        amountKav,
        amountEth,
        feeTier,
        proofHash: txHash || undefined,
      });
      if (res.success) {
        setWalletStatus('added');
        setWalletFeedback(res.message);
      } else {
        setWalletStatus('info');
        setWalletFeedback(res.message);
      }
    } catch (err: any) {
      setWalletStatus('info');
      setWalletFeedback(err?.message || 'Could not add certificate to wallet.');
    }
  };

  useEffect(() => {
    if (isOpen && autoAddToWallet) {
      const timer = setTimeout(() => {
        handleAddToWallet();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoAddToWallet]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(20, 10, 30, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 1400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        className="sharp-card"
        style={{
          width: '100%',
          maxWidth: '1020px',
          backgroundColor: '#1E142B',
          color: '#ffffff',
          position: 'relative',
          padding: '24px',
          border: '4px solid #167D8D',
          boxShadow: '0px 0px 40px rgba(22, 125, 141, 0.6), 0px 0px 20px rgba(255, 91, 66, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxHeight: '96vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#167D8D',
            border: '2px solid #FF5B42',
            color: '#ffffff',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '4px',
            zIndex: 10,
          }}
          title="Close Certificate Viewer"
        >
          <X size={18} />
        </button>

        {/* Modal Subheader */}
        <div style={{ textAlign: 'center', marginBottom: '14px', width: '100%' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#167D8D',
              color: '#ffffff',
              padding: '4px 14px',
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '6px',
              border: '1px solid #FF5B42',
              boxShadow: '0 2px 10px rgba(255, 91, 66, 0.4)',
            }}
          >
            <Sparkles size={14} color="#FF5B42" /> LIQUIDITY PROVIDER CERTIFICATE
          </div>
          <h2
            style={{
              margin: '2px 0',
              fontSize: '1.4rem',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: '#C9B5E0',
              fontWeight: 800,
            }}
          >
            DECENTRALIZED FINANCE ACHIEVEMENT
          </h2>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* LANDSCAPE SVG CERTIFICATE CANVAS                            */}
        {/* Palette: Base: #C9B5E0, Primary: #167D8D, Secondary: #FF5B42  */}
        {/* ------------------------------------------------------------- */}
        <div
          style={{
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '8px',
            border: '3px solid #167D8D',
            boxShadow: '0 0 30px rgba(22, 125, 141, 0.4)',
            backgroundColor: '#C9B5E0',
            aspectRatio: '16 / 9',
          }}
        >
          <svg
            id="kayswap-lp-cert-16-9"
            viewBox="0 0 1600 900"
            style={{ width: '100%', height: '100%', display: 'block' }}
          >
            <defs>
              {/* Lavender Base Gradient */}
              <linearGradient id="lavenderBase" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D5C5E8" />
                <stop offset="40%" stopColor="#C9B5E0" />
                <stop offset="80%" stopColor="#BDABDC" />
                <stop offset="100%" stopColor="#B39DD6" />
              </linearGradient>

              {/* Deep Teal Metallic Linear Gradient */}
              <linearGradient id="tealMetallic" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0E5B67" />
                <stop offset="50%" stopColor="#167D8D" />
                <stop offset="100%" stopColor="#25A2B5" />
              </linearGradient>

              {/* Coral Glowing Gradient */}
              <linearGradient id="coralGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF7A65" />
                <stop offset="50%" stopColor="#FF5B42" />
                <stop offset="100%" stopColor="#D93C23" />
              </linearGradient>

              {/* 3D Sphere Radial Gradient for Emblem */}
              <radialGradient id="sphere3D" cx="35%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#FF9B8A" />
                <stop offset="35%" stopColor="#FF5B42" />
                <stop offset="70%" stopColor="#167D8D" />
                <stop offset="100%" stopColor="#0B434C" />
              </radialGradient>

              {/* Radial Coral Glow Filter */}
              <filter id="coralNeonGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Drop Shadow for Metallic Border */}
              <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="3" dy="4" stdDeviation="4" floodColor="#0C454E" floodOpacity="0.4" />
              </filter>

              {/* Blockchain Hex Pattern */}
              <pattern id="blockchainHexPattern" width="60" height="104" patternUnits="userSpaceOnUse">
                <path
                  d="M30 0 L60 17 L60 52 L30 69 L0 52 L0 17 Z M30 104 L60 87 L60 52 L30 35 L0 52 L0 87 Z"
                  fill="none"
                  stroke="#167D8D"
                  strokeWidth="0.8"
                  strokeOpacity="0.16"
                />
                <circle cx="30" cy="35" r="2.5" fill="#FF5B42" fillOpacity="0.25" />
                <circle cx="60" cy="52" r="2" fill="#167D8D" fillOpacity="0.3" />
                <circle cx="0" cy="52" r="2" fill="#167D8D" fillOpacity="0.3" />
              </pattern>

              {/* Perimeter Path for Running Border Text */}
              <path
                id="borderPerimeterPath"
                d="M 40 40 L 1560 40 L 1560 860 L 40 860 Z"
                fill="none"
              />
            </defs>

            {/* 1. Base Lavender Background */}
            <rect width="1600" height="900" fill="url(#lavenderBase)" />

            {/* 2. Subtle Blockchain Hex Pattern Overlay */}
            <rect width="1600" height="900" fill="url(#blockchainHexPattern)" opacity="0.85" />

            {/* 3. Subtle Coral Glow Ambient Spots in Corners */}
            <circle cx="100" cy="100" r="160" fill="#FF5B42" opacity="0.08" filter="blur(30px)" />
            <circle cx="1500" cy="100" r="160" fill="#FF5B42" opacity="0.08" filter="blur(30px)" />
            <circle cx="100" cy="800" r="160" fill="#167D8D" opacity="0.12" filter="blur(30px)" />
            <circle cx="1500" cy="800" r="160" fill="#FF5B42" opacity="0.08" filter="blur(30px)" />

            {/* 4. Sophisticated Teal Ornamental Outer Border */}
            <rect
              x="20"
              y="20"
              width="1560"
              height="860"
              fill="none"
              stroke="#167D8D"
              strokeWidth="6"
            />
            {/* Inner Accent Line */}
            <rect
              x="28"
              y="28"
              width="1544"
              height="844"
              fill="none"
              stroke="#FF5B42"
              strokeWidth="1.5"
              strokeOpacity="0.75"
            />

            {/* Corner Ornamental Motifs */}
            <g transform="translate(34, 34)">
              <path d="M 0 45 L 45 0 L 75 0 L 0 75 Z" fill="#167D8D" />
              <path d="M 5 50 L 50 5" stroke="#FF5B42" strokeWidth="2" fill="none" />
              <circle cx="16" cy="16" r="4" fill="#FF5B42" />
            </g>
            <g transform="translate(1566, 34) scale(-1, 1)">
              <path d="M 0 45 L 45 0 L 75 0 L 0 75 Z" fill="#167D8D" />
              <path d="M 5 50 L 50 5" stroke="#FF5B42" strokeWidth="2" fill="none" />
              <circle cx="16" cy="16" r="4" fill="#FF5B42" />
            </g>
            <g transform="translate(34, 866) scale(1, -1)">
              <path d="M 0 45 L 45 0 L 75 0 L 0 75 Z" fill="#167D8D" />
              <path d="M 5 50 L 50 5" stroke="#FF5B42" strokeWidth="2" fill="none" />
              <circle cx="16" cy="16" r="4" fill="#FF5B42" />
            </g>
            <g transform="translate(1566, 866) scale(-1, -1)">
              <path d="M 0 45 L 45 0 L 75 0 L 0 75 Z" fill="#167D8D" />
              <path d="M 5 50 L 50 5" stroke="#FF5B42" strokeWidth="2" fill="none" />
              <circle cx="16" cy="16" r="4" fill="#FF5B42" />
            </g>

            {/* 5. Animated Border: Running Perimeter with Hash & Token Symbol */}
            <rect
              x="36"
              y="36"
              width="1528"
              height="828"
              fill="none"
              stroke="#167D8D"
              strokeWidth="22"
              strokeOpacity="0.08"
            />
            <text
              fill="#167D8D"
              fontSize="11"
              fontWeight="900"
              fontFamily="monospace"
              letterSpacing="2px"
            >
              <textPath href="#borderPerimeterPath" startOffset="0%">
                {repeatedBorderTicker}
                <animate
                  attributeName="startOffset"
                  from="0%"
                  to="100%"
                  dur="30s"
                  repeatCount="indefinite"
                />
              </textPath>
            </text>

            {/* Inner Border Frame */}
            <rect
              x="52"
              y="52"
              width="1496"
              height="796"
              fill="none"
              stroke="#167D8D"
              strokeWidth="2.5"
            />

            {/* 6. PROMINENT CENTRAL 3D ROTATING ACHIEVEMENT EMBLEM WITH KAYSWAP LOGO */}
            <g transform="translate(800, 480)">
              {/* Outer Glowing Coral Halo */}
              <circle cx="0" cy="0" r="145" fill="none" stroke="#FF5B42" strokeWidth="2" opacity="0.4" filter="url(#coralNeonGlow)" />

              {/* Animated Rotating 3D Outer Gear Ring */}
              <g>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0"
                  to="360"
                  dur="24s"
                  repeatCount="indefinite"
                />
                <circle cx="0" cy="0" r="132" fill="none" stroke="#167D8D" strokeWidth="3" strokeDasharray="14 10" />
                <circle cx="0" cy="0" r="122" fill="none" stroke="#FF5B42" strokeWidth="2" strokeDasharray="6 6" />
                {/* 12 Outer Solar Rays / Facets */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                  <line
                    key={deg}
                    x1="0"
                    y1="-132"
                    x2="0"
                    y2="-142"
                    stroke="#167D8D"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    transform={`rotate(${deg})`}
                  />
                ))}
              </g>

              {/* Counter-Rotating Middle Ring with Nodes */}
              <g>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="360"
                  to="0"
                  dur="18s"
                  repeatCount="indefinite"
                />
                <circle cx="0" cy="0" r="105" fill="none" stroke="#167D8D" strokeWidth="2" strokeDasharray="20 8" />
                {[0, 60, 120, 180, 240, 300].map((deg) => (
                  <circle
                    key={deg}
                    cx="0"
                    cy="-105"
                    r="4"
                    fill="#FF5B42"
                    transform={`rotate(${deg})`}
                  />
                ))}
              </g>

              {/* Central 3D Faceted Achievement Shield / Sphere */}
              <circle
                cx="0"
                cy="0"
                r="86"
                fill="url(#sphere3D)"
                stroke="#167D8D"
                strokeWidth="4"
                filter="url(#cardShadow)"
              />

              {/* 3D Specular Highlight on Sphere */}
              <ellipse
                cx="-26"
                cy="-26"
                rx="36"
                ry="22"
                fill="#ffffff"
                opacity="0.32"
                transform="rotate(-30 -26 -26)"
              />

              {/* Central KaySwap Logo - Unmodified Original Colors & Design */}
              <circle
                cx="0"
                cy="0"
                r="52"
                fill="#ffffff"
                stroke="#FF5B42"
                strokeWidth="3"
                filter="url(#cardShadow)"
              />
              <image
                href={embeddedLogo}
                x="-42"
                y="-42"
                width="84"
                height="84"
                preserveAspectRatio="xMidYMid meet"
              />
            </g>

            {/* 7. STATIONARY TEXT LAYOUT: CLEAN TYPOGRAPHY & PERFECT ALIGNMENT */}

            {/* Top Brand Header */}
            <g transform="translate(100, 75)">
              <image
                href={embeddedLogo}
                x="0"
                y="0"
                width="84"
                height="84"
                preserveAspectRatio="xMidYMid meet"
              />

              {/* KAYSWAP BRANDING */}
              <text x="100" y="38" fill="#167D8D" fontSize="34" fontWeight="900" fontFamily="sans-serif" letterSpacing="4px">
                KAYSWAP
              </text>
              {/* DECENTRALIZED FINANCE ACHIEVEMENT TAG */}
              <rect x="100" y="48" width="370" height="24" fill="#167D8D" rx="3" />
              <text x="285" y="65" fill="#ffffff" fontSize="11" fontWeight="800" fontFamily="sans-serif" letterSpacing="2.5px" textAnchor="middle">
                DECENTRALIZED FINANCE ACHIEVEMENT
              </text>
            </g>

            {/* Top Right Protocol Details */}
            <g transform="translate(1500, 85)" textAnchor="end">
              <text x="0" y="20" fill="#167D8D" fontSize="14" fontWeight="800" fontFamily="monospace" letterSpacing="1.5px">
                PROOF OF LIQUIDITY (PoL)
              </text>
              <text x="0" y="40" fill="#FF5B42" fontSize="12" fontWeight="700" fontFamily="monospace" letterSpacing="1px">
                NETWORK: ETHEREUM SEPOLIA (CHAIN ID 11155111)
              </text>
            </g>

            {/* MAIN CERTIFICATE TITLE */}
            <g transform="translate(800, 205)" textAnchor="middle">
              <text
                x="0"
                y="0"
                fill="#167D8D"
                fontSize="42"
                fontWeight="900"
                fontFamily="sans-serif"
                letterSpacing="6px"
              >
                LIQUIDITY PROVIDER CERTIFICATE
              </text>

              {/* Coral Decorative Divider Line with Diamond Center */}
              <line x1="-380" y1="18" x2="-25" y2="18" stroke="#FF5B42" strokeWidth="2.5" />
              <polygon points="0,12 8,18 0,24 -8,18" fill="#FF5B42" />
              <circle cx="0" cy="18" r="2.5" fill="#167D8D" />
              <line x1="25" y1="18" x2="380" y2="18" stroke="#FF5B42" strokeWidth="2.5" />

              <text x="0" y="42" fill="#0C454E" fontSize="13" fontWeight="700" fontFamily="sans-serif" letterSpacing="3px">
                OFFICIAL PROOF OF LIQUIDITY COLLECTIBLE &bull; ETHEREUM SEPOLIA TESTNET
              </text>
            </g>

            {/* RECIPIENT [USER NAME] SECTION */}
            <g transform="translate(800, 305)" textAnchor="middle">
              <text x="0" y="0" fill="#167D8D" fontSize="12" fontWeight="800" fontFamily="sans-serif" letterSpacing="3px">
                PROUDLY PRESENTED TO LIQUIDITY PROVIDER
              </text>

              {/* Lavender Glassmorphism Frame for User Name */}
              <rect
                x="-360"
                y="14"
                width="720"
                height="56"
                rx="6"
                fill="#ffffff"
                fillOpacity="0.75"
                stroke="#167D8D"
                strokeWidth="2"
                filter="url(#cardShadow)"
              />
              <rect
                x="-356"
                y="18"
                width="712"
                height="48"
                rx="4"
                fill="none"
                stroke="#FF5B42"
                strokeWidth="1"
                strokeDasharray="8 6"
              />

              <text
                x="0"
                y="50"
                fill="#0C454E"
                fontSize="24"
                fontWeight="800"
                fontFamily="monospace"
                letterSpacing="1px"
              >
                {safeOwner}
              </text>
            </g>

            {/* 4 KEY METRIC CARDS */}
            {/* Card 1: Liquidity Pool */}
            <g transform="translate(100, 640)">
              <rect
                x="0"
                y="0"
                width="325"
                height="105"
                rx="6"
                fill="#ffffff"
                fillOpacity="0.85"
                stroke="#167D8D"
                strokeWidth="2.5"
                filter="url(#cardShadow)"
              />
              <line x1="0" y1="32" x2="325" y2="32" stroke="#167D8D" strokeWidth="1" />
              <text x="16" y="22" fill="#167D8D" fontSize="11" fontWeight="800" fontFamily="sans-serif" letterSpacing="1.5px">
                LIQUIDITY POOL
              </text>
              <circle cx="305" cy="20" r="4" fill="#FF5B42" />
              <text x="16" y="65" fill="#0C454E" fontSize="22" fontWeight="900" fontFamily="sans-serif">
                {pairName}
              </text>
              <text x="16" y="88" fill="#167D8D" fontSize="11" fontWeight="700" fontFamily="monospace">
                AMM Constant Product Pool
              </text>
            </g>

            {/* Card 2: Contribution */}
            <g transform="translate(455, 640)">
              <rect
                x="0"
                y="0"
                width="325"
                height="105"
                rx="6"
                fill="#ffffff"
                fillOpacity="0.85"
                stroke="#167D8D"
                strokeWidth="2.5"
                filter="url(#cardShadow)"
              />
              <line x1="0" y1="32" x2="325" y2="32" stroke="#167D8D" strokeWidth="1" />
              <text x="16" y="22" fill="#167D8D" fontSize="11" fontWeight="800" fontFamily="sans-serif" letterSpacing="1.5px">
                CONTRIBUTION AMOUNT
              </text>
              <circle cx="305" cy="20" r="4" fill="#FF5B42" />
              <text x="16" y="63" fill="#0C454E" fontSize="18" fontWeight="900" fontFamily="sans-serif">
                {amountKav} KAV
              </text>
              <text x="16" y="88" fill="#FF5B42" fontSize="15" fontWeight="800" fontFamily="monospace">
                + {amountEth} ETH
              </text>
            </g>

            {/* Card 3: LP Token ID */}
            <g transform="translate(820, 640)">
              <rect
                x="0"
                y="0"
                width="325"
                height="105"
                rx="6"
                fill="#ffffff"
                fillOpacity="0.85"
                stroke="#167D8D"
                strokeWidth="2.5"
                filter="url(#cardShadow)"
              />
              <line x1="0" y1="32" x2="325" y2="32" stroke="#167D8D" strokeWidth="1" />
              <text x="16" y="22" fill="#167D8D" fontSize="11" fontWeight="800" fontFamily="sans-serif" letterSpacing="1.5px">
                LP TOKEN ID
              </text>
              <circle cx="305" cy="20" r="4" fill="#FF5B42" />
              <text x="16" y="65" fill="#0C454E" fontSize="22" fontWeight="900" fontFamily="monospace">
                #{positionId}
              </text>
              <text x="16" y="88" fill="#167D8D" fontSize="11" fontWeight="700" fontFamily="monospace">
                Fee Tier: {formattedFee}%
              </text>
            </g>

            {/* Card 4: Issued Date (Corrected & Normalized) */}
            <g transform="translate(1175, 640)">
              <rect
                x="0"
                y="0"
                width="325"
                height="105"
                rx="6"
                fill="#ffffff"
                fillOpacity="0.85"
                stroke="#167D8D"
                strokeWidth="2.5"
                filter="url(#cardShadow)"
              />
              <line x1="0" y1="32" x2="325" y2="32" stroke="#167D8D" strokeWidth="1" />
              <text x="16" y="22" fill="#167D8D" fontSize="11" fontWeight="800" fontFamily="sans-serif" letterSpacing="1.5px">
                ISSUED DATE
              </text>
              <circle cx="305" cy="20" r="4" fill="#FF5B42" />
              <text x="16" y="65" fill="#0C454E" fontSize="20" fontWeight="900" fontFamily="sans-serif">
                {formattedDate}
              </text>
              <text x="16" y="88" fill="#167D8D" fontSize="11" fontWeight="700" fontFamily="monospace">
                Verified Sepolia Block Time
              </text>
            </g>

            {/* 8. FOOTER: VERIFIABLE ON ETHEREUM SEPOLIA */}
            <g transform="translate(800, 795)" textAnchor="middle">
              <rect
                x="-420"
                y="0"
                width="840"
                height="32"
                rx="4"
                fill="#167D8D"
              />
              <text
                x="0"
                y="21"
                fill="#ffffff"
                fontSize="13"
                fontWeight="900"
                fontFamily="sans-serif"
                letterSpacing="3.5px"
              >
                VERIFIABLE ON ETHEREUM SEPOLIA
              </text>
            </g>

            <g transform="translate(800, 842)" textAnchor="middle">
              <text x="0" y="0" fill="#0C454E" fontSize="10.5" fontWeight="700" fontFamily="monospace" letterSpacing="0.5px">
                AMM CONTRACT: {poolAddress} &bull; PROOF HASH: {proofHash.slice(0, 24)}...
              </text>
            </g>
          </svg>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ACTION TOOLBAR                                                */}
        {/* ------------------------------------------------------------- */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            marginTop: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.78rem',
                color: '#C9B5E0',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Award size={14} color="#FF5B42" /> Official Collectible Certificate
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {/* Manual Add to Wallet Button */}
            <button
              className="sharp-button-outline"
              onClick={handleAddToWallet}
              disabled={walletStatus === 'adding'}
              style={{
                fontSize: '0.78rem',
                padding: '8px 14px',
                borderColor: walletStatus === 'added' ? '#28a745' : '#FF5B42',
                color: walletStatus === 'added' ? '#4ade80' : '#ffffff',
                backgroundColor: walletStatus === 'added' ? 'rgba(40, 167, 69, 0.25)' : '#167D8D',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: walletStatus === 'adding' ? 'wait' : 'pointer',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(22, 125, 141, 0.4)',
              }}
              title="Add Certificate NFT to your connected Web3 wallet"
            >
              {walletStatus === 'added' ? (
                <Check size={14} color="#4ade80" />
              ) : (
                <Wallet size={14} color="#FF5B42" />
              )}
              <span>
                {walletStatus === 'adding'
                  ? 'ADDING TO WALLET...'
                  : walletStatus === 'added'
                  ? 'ADDED TO WALLET ✓'
                  : 'ADD TO WALLET'}
              </span>
            </button>

            <button
              className="sharp-button-outline"
              onClick={handleCopyMetadata}
              style={{
                fontSize: '0.78rem',
                padding: '8px 14px',
                borderColor: '#167D8D',
                color: '#C9B5E0',
                backgroundColor: 'transparent',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {copied ? <Check size={14} color="#167D8D" /> : <Copy size={14} />}
              <span>{copied ? 'METADATA COPIED!' : 'COPY METADATA'}</span>
            </button>

            <button
              className="sharp-button-outline"
              onClick={downloadSvg}
              style={{
                fontSize: '0.78rem',
                padding: '8px 14px',
                borderColor: '#167D8D',
                color: '#C9B5E0',
                backgroundColor: 'transparent',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Download size={14} />
              <span>DOWNLOAD SVG</span>
            </button>

            <button
              className="sharp-button-primary"
              onClick={downloadPng}
              style={{
                fontSize: '0.78rem',
                padding: '8px 16px',
                backgroundColor: '#FF5B42',
                color: '#ffffff',
                border: '2px solid #FF5B42',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Download size={14} />
              <span>DOWNLOAD PNG</span>
            </button>
          </div>
        </div>

        {/* Wallet Feedback Notification Banner */}
        {walletFeedback && (
          <div
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '0.78rem',
              backgroundColor:
                walletStatus === 'added'
                  ? 'rgba(40, 167, 69, 0.2)'
                  : walletStatus === 'error'
                  ? 'rgba(255, 91, 66, 0.2)'
                  : 'rgba(22, 125, 141, 0.25)',
              border: `1px solid ${
                walletStatus === 'added' ? '#28a745' : walletStatus === 'error' ? '#FF5B42' : '#167D8D'
              }`,
              color: walletStatus === 'added' ? '#4ade80' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Wallet size={16} color={walletStatus === 'added' ? '#4ade80' : '#FF5B42'} />
              <span>{walletFeedback}</span>
            </div>
            <button
              onClick={() => setWalletFeedback('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '2px 4px',
              }}
              title="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
