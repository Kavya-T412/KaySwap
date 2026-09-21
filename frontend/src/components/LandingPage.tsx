import React, { useRef, useEffect } from 'react';
import {
  ArrowRight,
  ArrowLeftRight,
  Layers,
  Coins,
  ShieldCheck,
  History,
  Star,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Zap,
  MessageSquare,
  PlayCircle
} from 'lucide-react';
import logoImg from '../KaySwap.png';

interface LandingPageProps {
  onNavigateTab: (tab: 'swap' | 'liquidity' | 'tokenomics') => void;
  onOpenFeedback: () => void;
  onOpenAdmin: () => void;
  averageRating: string;
  totalReviews: number;
  isDeployer: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateTab,
  onOpenFeedback,
  onOpenAdmin,
  averageRating,
  totalReviews,
  isDeployer,
}) => {
  const featuresScrollRef = useRef<HTMLDivElement>(null);
  const guideScrollRef = useRef<HTMLDivElement>(null);

  // Smooth horizontal scrolling with release to vertical page scroll at boundaries
  useEffect(() => {
    const handleWheelScroll = (ref: React.RefObject<HTMLDivElement>) => (e: WheelEvent) => {
      if (!ref.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      const canScrollRight = scrollLeft < scrollWidth - clientWidth - 10;
      const canScrollLeft = scrollLeft > 10;

      if ((e.deltaY > 0 && canScrollRight) || (e.deltaY < 0 && canScrollLeft)) {
        e.preventDefault();
        ref.current.scrollBy({ left: e.deltaY * 1.5, behavior: 'smooth' });
      }
    };

    const featContainer = featuresScrollRef.current;
    const guideContainer = guideScrollRef.current;

    const featListener = handleWheelScroll(featuresScrollRef);
    const guideListener = handleWheelScroll(guideScrollRef);

    if (featContainer) featContainer.addEventListener('wheel', featListener, { passive: false });
    if (guideContainer) guideContainer.addEventListener('wheel', guideListener, { passive: false });

    return () => {
      if (featContainer) featContainer.removeEventListener('wheel', featListener);
      if (guideContainer) guideContainer.removeEventListener('wheel', guideListener);
    };
  }, []);

  const scrollLeft = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) ref.current.scrollBy({ left: -360, behavior: 'smooth' });
  };

  const scrollRight = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) ref.current.scrollBy({ left: 360, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '56px', paddingBottom: '32px', width: '100%' }}>
      {/* ------------------------------------------------------------- */}
      {/* UNIFIED HOME PAGE HERO (FULL PAGE CANVAS WITHOUT HEAVY DIVISIONS) */}
      {/* ------------------------------------------------------------- */}
      <section
        style={{
          backgroundColor: '#450C3F',
          color: '#FCECD8',
          border: '4px solid #450C3F',
          boxShadow: '8px 8px 0px #165823',
          padding: '48px 36px',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <img
              src={logoImg}
              alt="KaySwap Logo"
              style={{
                width: '80px',
                height: '80px',
                objectFit: 'contain',
                border: '3px solid #FCECD8',
                backgroundColor: '#ffffff',
                padding: '4px'
              }}
            />
            <div>
              <div
                className="sharp-badge"
                style={{
                  backgroundColor: '#165823',
                  color: '#ffffff',
                  border: '1px solid #FCECD8',
                  marginBottom: '8px'
                }}
              >
                <Zap size={14} /> DECENTRALIZED AMM EXCHANGE &bull; SEPOLIA TESTNET
              </div>
              <h1 style={{ color: '#FCECD8', fontSize: '3rem', lineHeight: '1.1', textTransform: 'uppercase', letterSpacing: '0.03em', margin: 0 }}>
                KAY<span style={{ color: '#165823', backgroundColor: '#FCECD8', padding: '0 8px' }}>SWAP</span> PROTOCOL
              </h1>
            </div>
          </div>

          <p style={{ fontSize: '1.25rem', lineHeight: '1.6', color: '#FCECD8', opacity: 0.95, margin: 0, fontWeight: 500, maxWidth: '1000px' }}>
            KaySwap is a high-speed Automated Market Maker (AMM) protocol engineered for peer-to-contract token swaps between <strong>Kavya (KAV)</strong> and <strong>Ethereum (ETH)</strong> on Sepolia. Powered by the constant product invariant (<code>x &times; y = k</code>), KaySwap provides automated liquidity pools, low-slippage trading, and cryptographic Sign-In with Ethereum (SIWE) session security.
          </p>

          {/* Highlights Pill Bar */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.9rem', fontWeight: 700 }}>
            <div style={{ backgroundColor: 'rgba(252, 236, 216, 0.12)', padding: '10px 18px', border: '1px solid #FCECD8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#165823" />
              <span>0.3% Protocol Swap Fee</span>
            </div>
            <div style={{ backgroundColor: 'rgba(252, 236, 216, 0.12)', padding: '10px 18px', border: '1px solid #FCECD8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={16} color="#165823" />
              <span>SIWE 15-Min Security Expiry</span>
            </div>
            <div style={{ backgroundColor: 'rgba(252, 236, 216, 0.12)', padding: '10px 18px', border: '1px solid #FCECD8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Coins size={16} color="#165823" />
              <span>1,000,000 KAV Hard Supply</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', paddingTop: '8px' }}>
            <button
              className="sharp-button-secondary"
              onClick={() => onNavigateTab('swap')}
              style={{ padding: '16px 32px', fontSize: '1.1rem', border: '2px solid #FCECD8' }}
            >
              <span>LAUNCH SWAP EXECUTION</span>
              <ArrowRight size={22} />
            </button>

            <button
              className="sharp-button-outline"
              onClick={() => onNavigateTab('liquidity')}
              style={{ padding: '16px 28px', fontSize: '1.1rem', borderColor: '#FCECD8', color: '#FCECD8', backgroundColor: 'transparent' }}
            >
              <span>PROVIDE LIQUIDITY</span>
            </button>

            <button
              className="sharp-button-outline"
              onClick={onOpenFeedback}
              style={{ padding: '16px 24px', fontSize: '1rem', borderColor: '#FCECD8', color: '#FCECD8', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Star size={18} fill="#FCECD8" />
              <span>REVIEWS ({averageRating}★)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: PLATFORM FEATURES (CONTINUOUS SMOOTH HORIZONTAL SCROLL) */}
      {/* ------------------------------------------------------------- */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="sharp-badge sharp-badge-plum" style={{ marginBottom: '6px' }}>
              SECTION 1 &bull; APPLICATION CAPABILITIES
            </div>
            <h2 style={{ fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0 }}>
              APPLICATION <span style={{ color: '#165823' }}>CAPABILITIES</span>
            </h2>
          </div>

          {/* Scroll Navigation Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="sharp-button-outline"
              onClick={() => scrollLeft(featuresScrollRef)}
              title="Scroll Left"
              style={{ padding: '8px 14px' }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="sharp-button-outline"
              onClick={() => scrollRight(featuresScrollRef)}
              title="Scroll Right"
              style={{ padding: '8px 14px' }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Horizontal Features Track (NO SEPARATION SCROLLBAR, SMOOTH HORIZONTAL SCROLL) */}
        <div
          ref={featuresScrollRef}
          className="no-scrollbar"
          style={{
            display: 'flex',
            gap: '24px',
            overflowX: 'auto',
            paddingBottom: '8px',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {/* Feature Card 1: Instant Swaps */}
          <div
            className="sharp-card"
            style={{
              minWidth: '340px',
              maxWidth: '360px',
              flex: '0 0 auto',
              scrollSnapAlign: 'start',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: '3px solid #450C3F'
            }}
          >
            <div>
              <div style={{ backgroundColor: '#165823', color: '#ffffff', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '2px solid #450C3F' }}>
                <ArrowLeftRight size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                INSTANT KAV ↔ ETH SWAPS
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#555', lineHeight: '1.5' }}>
                Swap KAV tokens for ETH and ETH for KAV with exact algorithmic output quotes, configurable slippage bounds (0.1% to 1.0%), and instant on-chain execution.
              </p>
            </div>
            <button
              className="sharp-button-secondary"
              onClick={() => onNavigateTab('swap')}
              style={{ marginTop: '24px', width: '100%', fontSize: '0.9rem', justifyContent: 'center' }}
            >
              <span>EXECUTE SWAP NOW</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Feature Card 2: Liquidity Pools */}
          <div
            className="sharp-card"
            style={{
              minWidth: '340px',
              maxWidth: '360px',
              flex: '0 0 auto',
              scrollSnapAlign: 'start',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: '3px solid #450C3F'
            }}
          >
            <div>
              <div style={{ backgroundColor: '#450C3F', color: '#ffffff', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '2px solid #450C3F' }}>
                <Layers size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                LIQUIDITY POOLS & LP TOKENS
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#555', lineHeight: '1.5' }}>
                Deposit liquidity into the KAV/ETH pair to earn a proportional share of trading fees. Mint KAY-LP ERC20 tokens and redeem reserves at any time.
              </p>
            </div>
            <button
              className="sharp-button-outline"
              onClick={() => onNavigateTab('liquidity')}
              style={{ marginTop: '24px', width: '100%', fontSize: '0.9rem' }}
            >
              SUPPLY LIQUIDITY &rarr;
            </button>
          </div>

          {/* Feature Card 3: SIWE Security */}
          <div
            className="sharp-card"
            style={{
              minWidth: '340px',
              maxWidth: '360px',
              flex: '0 0 auto',
              scrollSnapAlign: 'start',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: '3px solid #450C3F'
            }}
          >
            <div>
              <div style={{ backgroundColor: '#165823', color: '#ffffff', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '2px solid #450C3F' }}>
                <ShieldCheck size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                SIWE SECURITY & TIMEOUT
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#555', lineHeight: '1.5' }}>
                Sign-In with Ethereum (EIP-4361) verifies wallet ownership. Sessions automatically expire after 15 minutes, triggering an automatic wallet disconnect.
              </p>
            </div>
            <div style={{ marginTop: '24px', fontSize: '0.85rem', fontWeight: 700, color: '#165823', padding: '10px', backgroundColor: '#FCECD8', border: '1px solid #450C3F', textAlign: 'center' }}>
              AUTOMATIC SESSION PROTECTION
            </div>
          </div>

          {/* Feature Card 4: Faucet & Tokenomics */}
          <div
            className="sharp-card"
            style={{
              minWidth: '340px',
              maxWidth: '360px',
              flex: '0 0 auto',
              scrollSnapAlign: 'start',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: '3px solid #450C3F'
            }}
          >
            <div>
              <div style={{ backgroundColor: '#450C3F', color: '#ffffff', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '2px solid #450C3F' }}>
                <Coins size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                TOKENOMICS & TEST FAUCET
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#555', lineHeight: '1.5' }}>
                KAV features a strict 1,000,000 hard supply cap. Claim 1,000 test KAV tokens every 24 hours from the built-in Sepolia faucet to start trading.
              </p>
            </div>
            <button
              className="sharp-button-outline"
              onClick={() => onNavigateTab('tokenomics')}
              style={{ marginTop: '24px', width: '100%', fontSize: '0.9rem' }}
            >
              CLAIM FAUCET &rarr;
            </button>
          </div>

          {/* Feature Card 5: Real-Time Audit Logs */}
          <div
            className="sharp-card"
            style={{
              minWidth: '340px',
              maxWidth: '360px',
              flex: '0 0 auto',
              scrollSnapAlign: 'start',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: '3px solid #450C3F'
            }}
          >
            <div>
              <div style={{ backgroundColor: '#165823', color: '#ffffff', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '2px solid #450C3F' }}>
                <History size={26} />
              </div>
              <h3 style={{ fontSize: '1.25rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                TRANSACTION HISTORY & AUDIT LOGS
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#555', lineHeight: '1.5' }}>
                Track every approve, swap, and liquidity action with status badges, execution timestamps, and direct Sepolia Etherscan block explorer links.
              </p>
            </div>
            <div style={{ marginTop: '24px', fontSize: '0.85rem', fontWeight: 700, color: '#450C3F', padding: '10px', backgroundColor: '#FCECD8', border: '1px solid #450C3F', textAlign: 'center' }}>
              LOGGED ON-CHAIN VERIFICATION
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: HOW TO USE & HOW TO SWAP SESSION (DIRECT EXECUTION REDIRECT) */}
      {/* ------------------------------------------------------------- */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="sharp-badge sharp-badge-green" style={{ marginBottom: '6px' }}>
              SECTION 2 &bull; USER ONBOARDING & HOW TO SWAP
            </div>
            <h2 style={{ fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0 }}>
              HOW TO USE KAYSWAP <span style={{ color: '#450C3F' }}>& REVIEWS</span>
            </h2>
          </div>

          {/* Scroll Navigation Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="sharp-button-outline"
              onClick={() => scrollLeft(guideScrollRef)}
              title="Scroll Left"
              style={{ padding: '8px 14px' }}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="sharp-button-outline"
              onClick={() => scrollRight(guideScrollRef)}
              title="Scroll Right"
              style={{ padding: '8px 14px' }}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Horizontal Guide Track */}
        <div
          ref={guideScrollRef}
          className="no-scrollbar"
          style={{
            display: 'flex',
            gap: '24px',
            overflowX: 'auto',
            paddingBottom: '8px',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          {/* Guide Step 1 */}
          <div
            className="sharp-card"
            style={{
              minWidth: '320px',
              maxWidth: '340px',
              flex: '0 0 auto',
              scrollSnapAlign: 'start',
              backgroundColor: '#ffffff',
              border: '3px solid #450C3F',
              boxShadow: '4px 4px 0px #450C3F',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <span className="sharp-badge sharp-badge-plum" style={{ marginBottom: '12px' }}>STEP 01</span>
              <h3 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                1. CONNECT & SIGN SIWE
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#555', lineHeight: '1.5' }}>
                Click <strong>Connect Wallet</strong> in the header to connect on Sepolia. Then sign the cryptographic SIWE message to authenticate your trading session.
              </p>
            </div>
            <button
              className="sharp-button-outline"
              onClick={() => onNavigateTab('swap')}
              style={{ marginTop: '20px', fontSize: '0.85rem', padding: '10px' }}
            >
              GO TO SWAP EXECUTION &rarr;
            </button>
          </div>

          {/* Guide Step 2 */}
          <div
            className="sharp-card"
            style={{
              minWidth: '320px',
              maxWidth: '340px',
              flex: '0 0 auto',
              scrollSnapAlign: 'start',
              backgroundColor: '#ffffff',
              border: '3px solid #450C3F',
              boxShadow: '4px 4px 0px #450C3F',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <span className="sharp-badge sharp-badge-green" style={{ marginBottom: '12px' }}>STEP 02</span>
              <h3 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                2. CLAIM TEST FAUCET
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#555', lineHeight: '1.5' }}>
                Navigate to <strong>Tokenomics & Faucet</strong> tab. Click <strong>Claim 1,000 KAV Faucet</strong> to receive test tokens directly to your wallet.
              </p>
            </div>
            <button
              className="sharp-button-outline"
              onClick={() => onNavigateTab('tokenomics')}
              style={{ marginTop: '20px', fontSize: '0.85rem', padding: '10px' }}
            >
              GO TO FAUCET &rarr;
            </button>
          </div>

          {/* Guide Step 3: HOW TO SWAP SESSION - REDIRECTS DIRECTLY TO SWAP EXECUTION */}
          <div
            className="sharp-card"
            onClick={() => onNavigateTab('swap')}
            style={{
              minWidth: '340px',
              maxWidth: '360px',
              flex: '0 0 auto',
              scrollSnapAlign: 'start',
              backgroundColor: '#FCECD8',
              border: '3px solid #165823',
              boxShadow: '6px 6px 0px #165823',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="sharp-badge sharp-badge-green">HOW TO SWAP SESSION &bull; STEP 03</span>
                <PlayCircle size={22} color="#165823" />
              </div>
              <h3 style={{ fontSize: '1.3rem', textTransform: 'uppercase', marginBottom: '8px', color: '#165823' }}>
                3. EXECUTE TOKEN SWAP
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#450C3F', lineHeight: '1.5', fontWeight: 600 }}>
                Select input token (KAV or ETH), enter amount, and click <strong>Approve & Swap</strong>. Click here to jump straight to live execution!
              </p>
            </div>

            {/* Direct Execution Redirect CTA */}
            <button
              className="sharp-button-secondary"
              onClick={(e) => {
                e.stopPropagation();
                onNavigateTab('swap');
              }}
              style={{ marginTop: '20px', width: '100%', justifyContent: 'center', fontSize: '0.95rem', padding: '12px' }}
            >
              <span>REDIRECT TO SWAP EXECUTION</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Guide Step 4 */}
          <div
            className="sharp-card"
            style={{
              minWidth: '320px',
              maxWidth: '340px',
              flex: '0 0 auto',
              scrollSnapAlign: 'start',
              backgroundColor: '#ffffff',
              border: '3px solid #450C3F',
              boxShadow: '4px 4px 0px #450C3F',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <span className="sharp-badge sharp-badge-plum" style={{ marginBottom: '12px' }}>STEP 04</span>
              <h3 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                4. SUBMIT REVIEWS
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#555', lineHeight: '1.5' }}>
                After executing your first swap, share your experience! Feedback helps improve liquidity, UI performance, and AMM mechanics.
              </p>
            </div>
            <button
              className="sharp-button-outline"
              onClick={onOpenFeedback}
              style={{ marginTop: '20px', fontSize: '0.85rem', padding: '10px' }}
            >
              GIVE REVIEW &rarr;
            </button>
          </div>
        </div>

        {/* Feedback Review Banner */}
        <div
          className="sharp-card"
          style={{
            backgroundColor: '#FCECD8',
            border: '3px solid #450C3F',
            boxShadow: '6px 6px 0px #450C3F',
            padding: '24px',
            marginTop: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: '#450C3F', color: '#ffffff', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '4px' }}>
                WE VALUE YOUR FEEDBACK & REVIEWS
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#450C3F', margin: 0 }}>
                Community Rating: <strong>{averageRating} / 5.0 Stars</strong> ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'} logged).
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              className="sharp-button-secondary"
              onClick={onOpenFeedback}
              style={{ fontSize: '0.9rem', padding: '10px 18px' }}
            >
              <Star size={16} />
              <span>GIVE FEEDBACK</span>
            </button>

            {/* ADMIN LOGS BUTTON - STRICTLY RENDERED ONLY FOR CONTRACT DEPLOYER */}
            {isDeployer && (
              <button
                className="sharp-button-outline"
                onClick={onOpenAdmin}
                title="Contract Deployer Audit Logs"
                style={{ fontSize: '0.85rem', padding: '10px 14px', backgroundColor: '#165823', color: '#ffffff', borderColor: '#165823' }}
              >
                <span>ADMIN LOGS</span>
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
