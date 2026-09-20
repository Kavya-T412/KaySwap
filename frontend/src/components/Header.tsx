import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ShieldAlert, KeyRound, RefreshCw, History } from 'lucide-react';
import logoImg from '../KaySwap.png';

interface HeaderProps {
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  onSignIn: () => void;
  isSigning: boolean;
  onLogoClick: () => void;
  txCount: number;
  pendingCount: number;
  onOpenHistory: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAuthenticated,
  isSessionExpired,
  onSignIn,
  isSigning,
  onLogoClick,
  txCount,
  pendingCount,
  onOpenHistory,
}) => {
  return (
    <header className="sharp-card" style={{ padding: '16px 24px', marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        {/* Branding & Logo - Click redirects to Swap page */}
        <div
          onClick={onLogoClick}
          title="Click to go to Swap page"
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

        {/* Status Bar, Transaction History & Wallet Connect */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* History Button with Badge */}
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

          {/* SIWE Session Action - Differentiates New User vs Expired User */}
          {!isAuthenticated && (
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
                  ? 'SESSION EXPIRED - RECONNECT'
                  : 'SIGN IN WITH ETHEREUM'}
              </span>
            </button>
          )}

          {/* RainbowKit Wallet Connect - Hides hardhat/network status, shows ETH balance near address */}
          <ConnectButton showBalance={true} chainStatus="none" accountStatus="full" />
        </div>
      </div>
    </header>
  );
};

