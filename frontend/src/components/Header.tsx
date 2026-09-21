import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ShieldAlert, KeyRound, RefreshCw, History, ShieldCheck } from 'lucide-react';
import logoImg from '../KaySwap.png';

interface HeaderProps {
  isConnected: boolean;
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  onSignIn: () => void;
  isSigning: boolean;
  onLogoClick: () => void;
  txCount: number;
  pendingCount: number;
  onOpenHistory: () => void;
  onOpenAdmin: () => void;
  isDeployer: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  isAuthenticated,
  isSessionExpired,
  onSignIn,
  isSigning,
  onLogoClick,
  txCount,
  pendingCount,
  onOpenHistory,
  onOpenAdmin,
  isDeployer,
}) => {
  return (
    <header className="sharp-card" style={{ padding: '16px 24px', marginBottom: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        {/* Branding & Logo - Click redirects to Home/Landing page */}
        <div
          onClick={onLogoClick}
          title="Click to go to KaySwap Home"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <img 
            src={logoImg} 
            alt="KaySwap Logo" 
            style={{ width: '48px', height: '48px', objectFit: 'contain', border: '2px solid #450C3F' }} 
          />
          <div>
            <h1 style={{ fontSize: '1.75rem', lineHeight: '1', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              KAY<span style={{ color: '#165823' }}>SWAP</span>
            </h1>
            <span className="mono" style={{ fontSize: '0.75rem', color: '#450C3F', fontWeight: 600 }}>
              Sepolia KAV / ETH Exchange
            </span>
          </div>
        </div>

        {/* Action Buttons & Wallet Connection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Transactions History Button */}
          <button
            className="sharp-button-outline"
            onClick={onOpenHistory}
            title="View Transaction History"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              padding: '8px 12px',
              borderColor: '#450C3F',
              backgroundColor: '#ffffff',
              color: '#450C3F',
            }}
          >
            <History size={16} />
            <span>TRANSACTIONS</span>
            {txCount > 0 && (
              <span
                style={{
                  backgroundColor: pendingCount > 0 ? '#b06000' : '#165823',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '2px',
                  marginLeft: '2px',
                }}
              >
                {pendingCount > 0 ? `${pendingCount} PENDING` : txCount}
              </span>
            )}
          </button>

          {/* Admin Audit Logs Button - STRICTLY SHOWN ONLY TO CONTRACT DEPLOYER */}
          {isDeployer && (
            <button
              className="sharp-button-outline"
              onClick={onOpenAdmin}
              title="Contract Deployer Feedback Audit Logs"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                padding: '8px 12px',
                borderColor: '#165823',
                backgroundColor: '#165823',
                color: '#ffffff',
              }}
            >
              <ShieldCheck size={16} />
              <span>ADMIN LOGS</span>
            </button>
          )}

          {/* SIWE Session Button - ONLY shown when wallet IS connected AND unauthenticated or session expired */}
          {isConnected && !isAuthenticated && (
            <button
              className="sharp-button-outline"
              onClick={onSignIn}
              disabled={isSigning}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderColor: '#450C3F',
                backgroundColor: isSessionExpired ? '#450C3F' : '#165823',
                color: '#ffffff',
                fontSize: '0.85rem',
                padding: '8px 14px'
              }}
            >
              {isSigning ? (
                <RefreshCw size={16} className="spin" />
              ) : isSessionExpired ? (
                <ShieldAlert size={16} />
              ) : (
                <KeyRound size={16} />
              )}
              <span>
                {isSigning
                  ? 'SIGNING...'
                  : isSessionExpired
                  ? 'SESSION EXPIRED - RE-SIGN SIWE'
                  : 'SIGN SIWE MESSAGE'}
              </span>
            </button>
          )}

          {/* RainbowKit Wallet Connect Button */}
          <ConnectButton showBalance={true} chainStatus="none" accountStatus="full" />
        </div>
      </div>
    </header>
  );
};
