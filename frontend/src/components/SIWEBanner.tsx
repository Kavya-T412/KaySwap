import React from 'react';
import { ShieldAlert, ArrowRight, Lock, KeyRound } from 'lucide-react';

interface SIWEBannerProps {
  isConnected: boolean;
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  onSignIn: () => void;
  isSigning: boolean;
}

export const SIWEBanner: React.FC<SIWEBannerProps> = ({
  isConnected,
  isAuthenticated,
  isSessionExpired,
  onSignIn,
  isSigning,
}) => {
  if (!isConnected || isAuthenticated) return null;

  return (
    <div
      className="sharp-card"
      style={{
        backgroundColor: '#450C3F',
        color: '#FCECD8',
        border: '3px solid #450C3F',
        marginBottom: '24px',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: isSessionExpired ? '6px 6px 0px #165823' : '6px 6px 0px #450C3F'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            backgroundColor: '#165823',
            color: '#ffffff',
            padding: '12px',
            border: '2px solid #FCECD8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isSessionExpired ? <Lock size={28} /> : <KeyRound size={28} />}
        </div>
        <div>
          <h3 style={{ color: '#FCECD8', fontSize: '1.2rem', marginBottom: '4px', textTransform: 'uppercase' }}>
            {isSessionExpired ? 'SIWE Session Expired (15 Min Limit)' : 'Sign In With Ethereum Required'}
          </h3>
          <p style={{ color: '#FCECD8', opacity: 0.9, fontSize: '0.9rem' }}>
            {isSessionExpired
              ? 'Your 15-minute SIWE security verification has expired. Please re-sign to continue trading on Sepolia.'
              : 'Please sign the SIWE message with your connected wallet to authenticate your Sepolia trading session.'}
          </p>
        </div>
      </div>

      <button
        className="sharp-button-secondary"
        onClick={onSignIn}
        disabled={isSigning}
        style={{
          border: '2px solid #FCECD8',
          fontSize: '0.95rem',
          padding: '12px 24px'
        }}
      >
        <span>
          {isSigning
            ? 'SIGNING...'
            : isSessionExpired
            ? 'RECONNECT & RE-SIGN SIWE'
            : 'SIGN IN WITH ETHEREUM'}
        </span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
};
