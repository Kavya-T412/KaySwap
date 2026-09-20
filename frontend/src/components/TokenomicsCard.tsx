import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Coins, Gift, Lock, ShieldCheck, ChevronRight, PieChart } from 'lucide-react';
import { useKaySwap } from '../hooks/useKaySwap';
import logoImg from '../KaySwap.png';

interface TokenomicsCardProps {
  kaySwap: ReturnType<typeof useKaySwap>;
  isAuthenticated: boolean;
}

export const TokenomicsCard: React.FC<TokenomicsCardProps> = ({ kaySwap, isAuthenticated }) => {
  const { address } = useAccount();

  // Minting form state
  const [mintRecipient, setMintRecipient] = useState<string>('');
  const [mintAmount, setMintAmount] = useState<string>('');

  const isOwner = Boolean(
    address &&
    kaySwap.kavOwner &&
    address.toLowerCase() === kaySwap.kavOwner.toLowerCase()
  );

  const totalSupplyNum = parseFloat(kaySwap.kavTotalSupply || '500000');
  const maxSupplyNum = parseFloat(kaySwap.kavMaxSupply || '1000000');
  const mintedPct = ((totalSupplyNum / maxSupplyNum) * 100).toFixed(1);

  const handleMint = async () => {
    if (!mintRecipient || !mintAmount) return;
    await kaySwap.mintTokens(mintRecipient, mintAmount);
    setMintAmount('');
  };

  const handleFaucet = async () => {
    await kaySwap.claimFaucet();
  };

  return (
    <div className="sharp-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <img src={logoImg} alt="KAV" style={{ width: '32px', height: '32px' }} />
        <h2 style={{ fontSize: '1.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          KAVYA TOKEN <span style={{ color: '#165823' }}>TOKENOMICS & FAUCET</span>
        </h2>
      </div>

      {/* Supply Progress & Key Metrics */}
      <div
        className="sharp-card-sm"
        style={{
          backgroundColor: '#450C3F',
          color: '#FCECD8',
          marginBottom: '24px',
          border: '2px solid #450C3F',
          boxShadow: '4px 4px 0px #165823'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>TOTAL MINTED VS MAX SUPPLY</span>
          <span className="mono" style={{ color: '#165823', backgroundColor: '#FCECD8', padding: '1px 6px', fontWeight: 800 }}>
            {mintedPct}% MINTED
          </span>
        </div>

        {/* Sharp Progress Bar */}
        <div
          style={{
            height: '16px',
            backgroundColor: 'rgba(252, 236, 216, 0.2)',
            border: '2px solid #FCECD8',
            marginBottom: '16px',
            position: 'relative'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(parseFloat(mintedPct), 100)}%`,
              backgroundColor: '#165823',
              transition: 'width 0.4s ease'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ backgroundColor: 'rgba(252, 236, 216, 0.1)', padding: '12px', border: '1px solid #FCECD8' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>MAX SUPPLY</div>
            <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FCECD8' }}>
              1,000,000 KAV
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(252, 236, 216, 0.1)', padding: '12px', border: '1px solid #FCECD8' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>TOTAL SUPPLY (INITIAL 50%)</div>
            <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#165823', backgroundColor: '#FCECD8', padding: '0 4px' }}>
              {totalSupplyNum.toLocaleString()} KAV
            </div>
          </div>
        </div>
      </div>

      {/* Sepolia Testnet Faucet Box */}
      <div
        className="sharp-card-sm"
        style={{
          backgroundColor: '#FCECD8',
          border: '2px solid #450C3F',
          marginBottom: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Gift size={22} style={{ color: '#165823' }} />
          <h3 style={{ fontSize: '1.1rem', textTransform: 'uppercase' }}>SEPOLIA KAV FAUCET</h3>
        </div>
        <p style={{ fontSize: '0.85rem', marginBottom: '14px', lineHeight: '1.4' }}>
          Need test tokens to test swapping or providing liquidity on Sepolia? Claim <strong>1,000 KAV</strong> instantly every 24 hours.
        </p>

        <button
          className="sharp-button-secondary"
          onClick={handleFaucet}
          disabled={kaySwap.txPending || !isAuthenticated}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          <Gift size={18} />
          <span>{kaySwap.txPending ? 'CLAIMING FAUCET...' : 'CLAIM 1,000 KAV FAUCET'}</span>
        </button>
      </div>

      {/* Owner Minting Control Panel */}
      <div
        className="sharp-card-sm"
        style={{
          border: '2px solid #450C3F',
          backgroundColor: isOwner ? '#ffffff' : 'rgba(69, 12, 63, 0.04)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Coins size={20} style={{ color: '#450C3F' }} />
            <h3 style={{ fontSize: '1.05rem', textTransform: 'uppercase' }}>CONTRACT OWNER MINT CONTROL</h3>
          </div>
          <span className={`sharp-badge ${isOwner ? 'sharp-badge-green' : 'sharp-badge-outline'}`}>
            {isOwner ? 'YOU ARE OWNER' : 'RESTRICTED'}
          </span>
        </div>

        {isOwner ? (
          <div>
            <div className="sharp-input-box" style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>RECIPIENT ADDRESS</div>
              <input
                type="text"
                placeholder="0x..."
                value={mintRecipient}
                onChange={(e) => setMintRecipient(e.target.value)}
                style={{ fontSize: '0.95rem' }}
              />
            </div>

            <div className="sharp-input-box" style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>MINT AMOUNT (MAX CAP: 1M KAV)</div>
              <input
                type="number"
                placeholder="e.g. 100000"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
              />
            </div>

            <button
              className="sharp-button-primary"
              onClick={handleMint}
              disabled={kaySwap.txPending || !mintRecipient || !mintAmount}
              style={{ width: '100%' }}
            >
              {kaySwap.txPending ? 'MINTING TOKENS...' : 'MINT ADDITIONAL SUPPLY'}
            </button>
          </div>
        ) : (
          <p style={{ fontSize: '0.85rem', color: '#450C3F', opacity: 0.8 }}>
            Minting additional supply is restricted to the KavyaToken contract owner. As owner, you can mint up to the remaining 50% supply.
          </p>
        )}
      </div>
    </div>
  );
};
