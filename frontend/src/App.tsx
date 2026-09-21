import { useState } from 'react';
import { Home, ArrowLeftRight, Layers, Coins, ExternalLink, Star, ShieldCheck } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useSiwe } from './hooks/useSiwe';
import { useKaySwap } from './hooks/useKaySwap';
import { useFeedback } from './hooks/useFeedback';
import { Header } from './components/Header';
import { SIWEBanner } from './components/SIWEBanner';
import { LandingPage } from './components/LandingPage';
import { SwapCard } from './components/SwapCard';
import { LiquidityCard } from './components/LiquidityCard';
import { TokenomicsCard } from './components/TokenomicsCard';
import { TransactionModal } from './components/TransactionModal';
import { LoaderCard } from './components/LoaderCard';
import { FeedbackModal } from './components/FeedbackModal';
import { AdminFeedbackModal } from './components/AdminFeedbackModal';
import { KAVYA_TOKEN_ADDRESS, KAYSWAP_AMM_ADDRESS } from './config/contracts';

export function App() {
  const [activeNav, setActiveNav] = useState<'home' | 'swap' | 'liquidity' | 'tokenomics'>('home');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isManualFeedbackModalOpen, setIsManualFeedbackModalOpen] = useState<boolean>(false);

  const { isConnected } = useAccount();
  const { isAuthenticated, isSessionExpired, signIn, isSigning } = useSiwe();

  // KaySwap hook with post-first-swap callback
  const kaySwap = useKaySwap((txHash) => {
    feedback.checkFirstSwapTrigger(txHash);
  });

  // Feedback hook passed kavOwner for strict deployer verification
  const feedback = useFeedback(kaySwap.kavOwner);

  const pendingCount = kaySwap.transactions.filter((tx) => tx.status === 'pending').length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Bar */}
      <Header
        isConnected={isConnected}
        isAuthenticated={isAuthenticated}
        isSessionExpired={isSessionExpired}
        onSignIn={signIn}
        isSigning={isSigning}
        onLogoClick={() => setActiveNav('home')}
        txCount={kaySwap.transactions.length}
        pendingCount={pendingCount}
        onOpenHistory={() => kaySwap.setIsTxModalOpen(true)}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        isDeployer={feedback.isDeployer}
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
          className={`sharp-tab ${activeNav === 'home' ? 'active' : ''}`}
          onClick={() => setActiveNav('home')}
        >
          <Home size={18} />
          <span>HOME & ABOUT</span>
        </button>

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
        {activeNav === 'home' && (
          <LandingPage
            onNavigateTab={(tab) => setActiveNav(tab)}
            onOpenFeedback={() => setIsManualFeedbackModalOpen(true)}
            onOpenAdmin={() => setIsAdminModalOpen(true)}
            averageRating={feedback.averageRating}
            totalReviews={feedback.totalReviews}
            isDeployer={feedback.isDeployer}
          />
        )}

        {activeNav === 'swap' && (
          <SwapCard
            kaySwap={kaySwap}
            isConnected={isConnected}
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

      {/* Transaction Loader Card */}
      <LoaderCard
        isOpen={kaySwap.isLoaderOpen}
        steps={kaySwap.loaderSteps}
        currentActionTitle={kaySwap.loaderTitle}
        onClose={() => kaySwap.setIsLoaderOpen(false)}
      />

      {/* Post-First Swap Automatic Feedback Modal */}
      <FeedbackModal
        isOpen={feedback.isFirstSwapModalOpen}
        onClose={() => feedback.setIsFirstSwapModalOpen(false)}
        onSubmit={(rating, comment, category, txHash) =>
          feedback.submitFeedback(rating, comment, category, txHash, true)
        }
        isFirstSwap={true}
        swapTxHash={feedback.latestSwapHash}
      />

      {/* Manual User Feedback Modal */}
      <FeedbackModal
        isOpen={isManualFeedbackModalOpen}
        onClose={() => setIsManualFeedbackModalOpen(false)}
        onSubmit={(rating, comment, category) =>
          feedback.submitFeedback(rating, comment, category, undefined, false)
        }
        isFirstSwap={false}
      />

      {/* Admin Audit Feedback Logs Modal - STRICTLY FOR DEPLOYER */}
      <AdminFeedbackModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        feedbacks={feedback.feedbacks}
        isDeployer={feedback.isDeployer}
        onClearLogs={feedback.clearAllFeedbacks}
      />

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

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setIsManualFeedbackModalOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#450C3F',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Star size={14} fill="#450C3F" /> Give Feedback
          </button>

          {/* Admin Logs Link - STRICTLY SHOWN ONLY TO CONTRACT DEPLOYER */}
          {feedback.isDeployer && (
            <button
              onClick={() => setIsAdminModalOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                color: '#165823',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ShieldCheck size={14} /> Admin Audit Logs
            </button>
          )}

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
