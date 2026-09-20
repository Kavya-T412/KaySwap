import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ShieldAlert, KeyRound, RefreshCw } from 'lucide-react';
import logoImg from '../KaySwap.png';

interface HeaderProps {
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  onSignIn: () => void;
  isSigning: boolean;
  onLogoClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAuthenticated,
  isSessionExpired,
  onSignIn,
  isSigning,
  onLogoClick,
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

        {/* Status Bar & Wallet Connect */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
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
