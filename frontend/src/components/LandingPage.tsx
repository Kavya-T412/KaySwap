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
  // Outer sticky section wrapper refs
  const featOuterRef = useRef<HTMLDivElement>(null);
  const featTrackRef = useRef<HTMLDivElement>(null);

  const guideOuterRef = useRef<HTMLDivElement>(null);
  const guideTrackRef = useRef<HTMLDivElement>(null);

  // Sync vertical page scrolling to horizontal card translation for Section 1 and Section 2
  useEffect(() => {
    let animationFrameId: number;

    const handleWindowScroll = () => {
      animationFrameId = requestAnimationFrame(() => {
        // Section 1: Features
        if (featOuterRef.current && featTrackRef.current) {
          const rect = featOuterRef.current.getBoundingClientRect();
          const stickyTopOffset = 80;
          const sectionHeight = featOuterRef.current.offsetHeight;
          const windowHeight = window.innerHeight;
          const maxScrollableDistance = sectionHeight - windowHeight;

          if (maxScrollableDistance > 0) {
            const currentDistance = stickyTopOffset - rect.top;
            const progress = Math.max(0, Math.min(1, currentDistance / maxScrollableDistance));
            const maxTrackScroll = featTrackRef.current.scrollWidth - featTrackRef.current.clientWidth;
            featTrackRef.current.scrollLeft = progress * maxTrackScroll;
          }
        }

        // Section 2: User Guide & How to Swap
        if (guideOuterRef.current && guideTrackRef.current) {
          const rect = guideOuterRef.current.getBoundingClientRect();
          const stickyTopOffset = 80;
          const sectionHeight = guideOuterRef.current.offsetHeight;
          const windowHeight = window.innerHeight;
          const maxScrollableDistance = sectionHeight - windowHeight;

          if (maxScrollableDistance > 0) {
            const currentDistance = stickyTopOffset - rect.top;
            const progress = Math.max(0, Math.min(1, currentDistance / maxScrollableDistance));
            const maxTrackScroll = guideTrackRef.current.scrollWidth - guideTrackRef.current.clientWidth;
            guideTrackRef.current.scrollLeft = progress * maxTrackScroll;
          }
        }
      });
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    handleWindowScroll();

    return () => {
      window.removeEventListener('scroll', handleWindowScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const scrollLeft = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) ref.current.scrollBy({ left: -360, behavior: 'smooth' });
  };

  const scrollRight = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) ref.current.scrollBy({ left: 360, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '32px', width: '100%' }}>
      {/* ------------------------------------------------------------- */}
      {/* UNIFIED HERO: WHERE KAV MEETS ETH — TRUSTLESSLY.              */}
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
                <Zap size={14} /> WHERE KAV MEETS ETH &mdash; TRUSTLESSLY.
              </div>
              <h1 style={{ color: '#FCECD8', fontSize: '3rem', lineHeight: '1.1', textTransform: 'uppercase', letterSpacing: '0.03em', margin: 0 }}>
                KAY<span style={{ color: '#165823', backgroundColor: '#FCECD8', padding: '0 8px' }}>SWAP</span> PROTOCOL
              </h1>
            </div>
          </div>

          <div>
            <h2 style={{ color: '#FCECD8', fontSize: '1.6rem', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Swap. Provide Liquidity. Stay in Control.
            </h2>
            <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: '#FCECD8', opacity: 0.95, margin: 0, fontWeight: 500, maxWidth: '1000px' }}>
              A decentralized AMM built for fast, permissionless KAV &harr; ETH trading on Sepolia. <strong>Swap. Pool. Verify.</strong> All powered by smart contracts (KayAMM).
            </p>
          </div>

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
              <span>SWAP NOW</span>
              <ArrowRight size={22} />
            </button>

            <button
              className="sharp-button-outline"
              onClick={() => onNavigateTab('liquidity')}
              style={{ padding: '16px 28px', fontSize: '1.05rem', borderColor: '#FCECD8', color: '#FCECD8', backgroundColor: 'transparent' }}
            >
              <span>BECOME A LIQUIDITY PROVIDER &rarr;</span>
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
      {/* SECTION 1: STICKY VERTICAL-TO-HORIZONTAL SCROLL FEATURES      */}
      {/* ------------------------------------------------------------- */}
      <div ref={featOuterRef} style={{ position: 'relative', height: '220vh' }}>
        <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div className="sharp-badge sharp-badge-plum" style={{ marginBottom: '6px' }}>
                SECTION 1 &bull; APPLICATION CAPABILITIES
              </div>
              <h2 style={{ fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0 }}>
                APPLICATION <span style={{ color: '#165823' }}>CAPABILITIES</span>
              </h2>
            </div>

            {/* Manual Controls */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="sharp-button-outline"
                onClick={() => scrollLeft(featTrackRef)}
                title="Scroll Left"
                style={{ padding: '8px 14px' }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className="sharp-button-outline"
                onClick={() => scrollRight(featTrackRef)}
                title="Scroll Right"
                style={{ padding: '8px 14px' }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Horizontal Cards Track */}
          <div
            ref={featTrackRef}
            className="no-scrollbar"
            style={{
              display: 'flex',
              gap: '24px',
              overflowX: 'auto',
              paddingBottom: '8px',
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth'
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
                  Set the tokens. Set the amount. Let the protocol do the rest.
                </p>
              </div>
              <button
                className="sharp-button-secondary"
                onClick={() => onNavigateTab('swap')}
                style={{ marginTop: '24px', width: '100%', fontSize: '0.9rem', justifyContent: 'center' }}
              >
                <span>SWAP NOW</span>
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
                  Don’t Just Trade Liquidity. Provide It. Earn a proportional 0.3% share of all protocol swap fees.
                </p>
              </div>
              <button
                className="sharp-button-outline"
                onClick={() => onNavigateTab('liquidity')}
                style={{ marginTop: '24px', width: '100%', fontSize: '0.9rem' }}
              >
                BECOME A PROVIDER &rarr;
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
                  Sign In With Your Wallet. Not Your Password. Cryptographically secure 15-minute SIWE session verification.
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
                  Know the Supply. Understand the Economy. Need Test KAV? Get Funded. Start Swapping.
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
                  Every Swap Leaves a Trail. Verify It On-Chain with direct Etherscan explorer audit links.
                </p>
              </div>
              <div style={{ marginTop: '24px', fontSize: '0.85rem', fontWeight: 700, color: '#450C3F', padding: '10px', backgroundColor: '#FCECD8', border: '1px solid #450C3F', textAlign: 'center' }}>
                VERIFY ON-CHAIN
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: STICKY VERTICAL-TO-HORIZONTAL SCROLL GUIDE        */}
      {/* ------------------------------------------------------------- */}
      <div ref={guideOuterRef} style={{ position: 'relative', height: '220vh' }}>
        <div style={{ position: 'sticky', top: '80px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div className="sharp-badge sharp-badge-green" style={{ marginBottom: '6px' }}>
                SECTION 2 &bull; USER ONBOARDING & HOW TO SWAP
              </div>
              <h2 style={{ fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0 }}>
                HOW TO USE KAYSWAP <span style={{ color: '#450C3F' }}>& REVIEWS</span>
              </h2>
            </div>

            {/* Manual Controls */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="sharp-button-outline"
                onClick={() => scrollLeft(guideTrackRef)}
                title="Scroll Left"
                style={{ padding: '8px 14px' }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                className="sharp-button-outline"
                onClick={() => scrollRight(guideTrackRef)}
                title="Scroll Right"
                style={{ padding: '8px 14px' }}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Horizontal Guide Track */}
          <div
            ref={guideTrackRef}
            className="no-scrollbar"
            style={{
              display: 'flex',
              gap: '24px',
              overflowX: 'auto',
              paddingBottom: '8px',
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth'
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
                  Sign In With Your Wallet. Not Your Password. Authenticate your session on Sepolia with EIP-4361.
                </p>
              </div>
              <button
                className="sharp-button-outline"
                onClick={() => onNavigateTab('swap')}
                style={{ marginTop: '20px', fontSize: '0.85rem', padding: '10px' }}
              >
                SWAP NOW &rarr;
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
                  2. CLAIM TEST KAV
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#555', lineHeight: '1.5' }}>
                  Need Test KAV? Get Funded. Start Swapping. Claim 1,000 test tokens every 24 hours.
                </p>
              </div>
              <button
                className="sharp-button-outline"
                onClick={() => onNavigateTab('tokenomics')}
                style={{ marginTop: '20px', fontSize: '0.85rem', padding: '10px' }}
              >
                GET FUNDED &rarr;
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
                  <span className="sharp-badge sharp-badge-green">HOW TO SWAP &bull; STEP 03</span>
                  <PlayCircle size={22} color="#165823" />
                </div>
                <h3 style={{ fontSize: '1.3rem', textTransform: 'uppercase', marginBottom: '8px', color: '#165823' }}>
                  3. EXECUTE TOKEN SWAP
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#450C3F', lineHeight: '1.5', fontWeight: 600 }}>
                  Set the tokens. Set the amount. Let the protocol do the rest. Click here to jump straight to live execution!
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
                <span>SWAP NOW</span>
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
                  After executing your first swap, share your experience! Feedback helps improve liquidity and AMM mechanics.
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
        </div>
      </div>

      {/* Bottom Tagline Banner */}
      <div
        className="sharp-card-sm"
        style={{
          textAlign: 'center',
          backgroundColor: '#450C3F',
          color: '#FCECD8',
          padding: '18px 24px',
          marginTop: '32px',
          boxShadow: '4px 4px 0px #165823',
          border: '2px solid #450C3F'
        }}
      >
        <span style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          “Built on Math. Secured by Code. Controlled by You.”
        </span>
      </div>

      {/* Feedback Review Banner */}
      <div
        className="sharp-card"
        style={{
          backgroundColor: '#FCECD8',
          border: '3px solid #450C3F',
          boxShadow: '6px 6px 0px #450C3F',
          padding: '24px',
          marginTop: '16px',
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
    </div>
  );
};
