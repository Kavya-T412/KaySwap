import React from 'react';
import { ArrowRight, Lock, KeyRound } from 'lucide-react';

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
          <h3 style={{ color: '#FCECD8', fontSize: '1.15rem', marginBottom: '4px', textTransform: 'uppercase' }}>
            {isSessionExpired ? 'SIWE SESSION EXPIRED' : 'SIGN IN WITH YOUR WALLET. NOT YOUR PASSWORD.'}
          </h3>
          <p style={{ color: '#FCECD8', opacity: 0.9, fontSize: '0.88rem', margin: 0 }}>
            {isSessionExpired
              ? 'Your 15-minute SIWE security verification expired and automatically disconnected. Please sign the SIWE message to re-authenticate.'
              : 'Sign in with your wallet, not your password. Authenticate your Sepolia trading session via cryptographic signature.'}
          </p>
        </div>
      </div>

      <button
        className="sharp-button-secondary"
        onClick={onSignIn}
        disabled={isSigning}
        style={{
          border: '2px solid #FCECD8',
          fontSize: '0.9rem',
          padding: '12px 20px'
        }}
      >
        <span>
          {isSigning
            ? 'SIGNING MESSAGE...'
            : isSessionExpired
            ? 'RE-SIGN SIWE MESSAGE'
            : 'SIGN IN WITH ETHEREUM'}
        </span>
        <ArrowRight size={18} />
      </button>
    </div>
  );
};
