import { useState } from 'react';
import { ArrowLeftRight, Layers, Coins, ExternalLink } from 'lucide-react';
import { useSiwe } from './hooks/useSiwe';
import { useKaySwap } from './hooks/useKaySwap';
import { Header } from './components/Header';
import { SIWEBanner } from './components/SIWEBanner';
import { SwapCard } from './components/SwapCard';
import { LiquidityCard } from './components/LiquidityCard';
import { TokenomicsCard } from './components/TokenomicsCard';
import { TransactionModal } from './components/TransactionModal';
import { KAVYA_TOKEN_ADDRESS, KAYSWAP_AMM_ADDRESS } from './config/contracts';
import { useAccount } from 'wagmi';

export function App() {
  const [activeNav, setActiveNav] = useState<'swap' | 'liquidity' | 'tokenomics'>('swap');

  const { isConnected } = useAccount();
  const { isAuthenticated, isSessionExpired, signIn, isSigning } = useSiwe();
  const kaySwap = useKaySwap();

  const pendingCount = kaySwap.transactions.filter((tx) => tx.status === 'pending').length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Bar with Logo Click Handler & Transaction Modal Trigger */}
      <Header
        isAuthenticated={isAuthenticated}
        isSessionExpired={isSessionExpired}
        onSignIn={signIn}
        isSigning={isSigning}
        onLogoClick={() => setActiveNav('swap')}
        txCount={kaySwap.transactions.length}
        pendingCount={pendingCount}
        onOpenHistory={() => kaySwap.setIsTxModalOpen(true)}
      />

      {/* SIWE Session Banner when wallet connected but unauthenticated or session expired */}
      <SIWEBanner
        isConnected={isConnected}
        isAuthenticated={isAuthenticated}
        isSessionExpired={isSessionExpired}
        onSignIn={signIn}
        isSigning={isSigning}
      />

      {/* Main Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <button
          className={`sharp-tab ${activeNav === 'swap' ? 'active' : ''}`}
          onClick={() => setActiveNav('swap')}
        >
          <ArrowLeftRight size={18} />
          <span>SWAP (KAV / ETH)</span>
        </button>

        <button
          className={`sharp-tab ${activeNav === 'liquidity' ? 'active' : ''}`}
          onClick={() => setActiveNav('liquidity')}
        >
          <Layers size={18} />
          <span>LIQUIDITY POOL</span>
        </button>

        <button
          className={`sharp-tab ${activeNav === 'tokenomics' ? 'active' : ''}`}
          onClick={() => setActiveNav('tokenomics')}
        >
          <Coins size={18} />
          <span>TOKENOMICS & FAUCET</span>
        </button>
      </div>

      {/* Primary Workspace View */}
      <main style={{ flex: 1 }}>
        {activeNav === 'swap' && (
          <SwapCard
            kaySwap={kaySwap}
            isAuthenticated={isAuthenticated}
            onSignIn={signIn}
            isSigning={isSigning}
          />
        )}

        {activeNav === 'liquidity' && (
          <LiquidityCard kaySwap={kaySwap} isAuthenticated={isAuthenticated} />
        )}

        {activeNav === 'tokenomics' && (
          <TokenomicsCard kaySwap={kaySwap} isAuthenticated={isAuthenticated} />
        )}
      </main>

      {/* Transaction History Modal */}
      <TransactionModal
        isOpen={kaySwap.isTxModalOpen}
        onClose={() => kaySwap.setIsTxModalOpen(false)}
        transactions={kaySwap.transactions}
        onClearHistory={kaySwap.clearTransactions}
      />

      {/* Footer Info */}
      <footer
        className="sharp-card"
        style={{
          marginTop: '48px',
          padding: '16px 24px',
          fontSize: '0.8rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <strong style={{ textTransform: 'uppercase' }}>KAYSWAP AMM DEX</strong> &bull; Sepolia Testnet
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <a
            href={`https://sepolia.etherscan.io/address/${KAVYA_TOKEN_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: '#450C3F', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            KAV Contract <ExternalLink size={12} />
          </a>
          <a
            href={`https://sepolia.etherscan.io/address/${KAYSWAP_AMM_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: '#450C3F', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            AMM Contract <ExternalLink size={12} />
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;

