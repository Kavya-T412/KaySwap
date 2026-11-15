import React, { useState, useEffect } from 'react';
import { ArrowDownUp, Settings, RefreshCw, AlertCircle, KeyRound, ArrowRight, Route, TrendingUp, HelpCircle } from 'lucide-react';
import { useKaySwap } from '../hooks/useKaySwap';
import logoImg from '../KaySwap.png';

interface SwapCardProps {
  kaySwap: ReturnType<typeof useKaySwap>;
  isConnected: boolean;
  isAuthenticated: boolean;
  onSignIn: () => void;
  isSigning: boolean;
}

export const SwapCard: React.FC<SwapCardProps> = ({
  kaySwap,
  isConnected,
  isAuthenticated,
  onSignIn,
  isSigning,
}) => {
  const [isKavIn, setIsKavIn] = useState<boolean>(true);
  const [amountIn, setAmountIn] = useState<string>('');
  const [amountOut, setAmountOut] = useState<string>('0');
  const [slippage, setSlippage] = useState<string>('0.5'); // 0.5%
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isInvertedRate, setIsInvertedRate] = useState<boolean>(false);

  // Recalculate output quote when input changes
  useEffect(() => {
    if (!amountIn || parseFloat(amountIn) <= 0) {
      setAmountOut('0');
      return;
    }
    const calculatedOut = kaySwap.getSwapQuote(amountIn, isKavIn);
    setAmountOut(calculatedOut);
  }, [amountIn, isKavIn, kaySwap.reserveKav, kaySwap.reserveEth]);

  const handleFlip = () => {
    setIsKavIn(!isKavIn);
    setAmountIn('');
    setAmountOut('0');
  };

  const handleMax = () => {
    if (isKavIn) {
      setAmountIn(kaySwap.kavBalance);
    } else {
      const ethBal = parseFloat(kaySwap.ethBalance);
      const maxEth = ethBal > 0.01 ? (ethBal - 0.01).toFixed(4) : '0';
      setAmountIn(maxEth);
    }
  };

  const isKavApproved = () => {
    if (!isKavIn) return true;
    if (!amountIn || parseFloat(amountIn) <= 0) return true;
    return parseFloat(kaySwap.kavAllowance) >= parseFloat(amountIn);
  };

  const calculateMinOut = () => {
    if (!amountOut || parseFloat(amountOut) <= 0) return '0';
    const slipPercent = parseFloat(slippage) || 0.5;
    const minFactor = (100 - slipPercent) / 100;
    return (parseFloat(amountOut) * minFactor).toFixed(6);
  };

  const handleApprove = async () => {
    if (!amountIn || parseFloat(amountIn) <= 0) return;
    await kaySwap.approveKav(amountIn);
  };

  const handleSwap = async () => {
    if (!amountIn || parseFloat(amountIn) <= 0) return;
    if (isKavIn) {
      await kaySwap.swapKavForEth(amountIn, slippage);
    } else {
      await kaySwap.swapEthForKav(amountIn, slippage);
    }
    setAmountIn('');
    setAmountOut('0');
  };

  const getExchangeRate = () => {
    const resKav = parseFloat(kaySwap.reserveKav);
    const resEth = parseFloat(kaySwap.reserveEth);
    if (resKav <= 0 || resEth <= 0) return 'No Pool Liquidity';

    if (isInvertedRate) {
      const rate = (resEth / resKav).toFixed(6);
      return `1 KAV ≈ ${rate} ETH`;
    } else {
      const rate = (resKav / resEth).toFixed(2);
      return `1 ETH ≈ ${rate} KAV`;
    }
  };

  const impactStats = kaySwap.calculatePriceImpact(amountIn, isKavIn);

  const getImpactBadge = () => {
    const impact = impactStats.priceImpactPct;
    if (impact < 1.0) {
      return { text: `${impact}% (Low Impact)`, color: '#165823', bg: '#D4EDDA' };
    } else if (impact < 3.0) {
      return { text: `${impact}% (Medium Impact)`, color: '#856404', bg: '#FFF3CD' };
    } else {
      return { text: `${impact}% (HIGH PRICE IMPACT)`, color: '#721C24', bg: '#F8D7DA' };
    }
  };

  return (
    <div className="sharp-card" style={{ maxWidth: '520px', margin: '0 auto' }}>
      {/* Header & Settings */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '1.4rem', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
          SWAP <span style={{ color: '#165823' }}>TOKENS</span>
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="sharp-button-outline"
            onClick={() => kaySwap.refreshData()}
            title="Refresh Quotes & Reserves"
            style={{ padding: '6px 10px' }}
          >
            <RefreshCw size={16} className={kaySwap.isLoading ? 'spin' : ''} />
          </button>
          <button
            className="sharp-button-outline"
            onClick={() => setShowSettings(!showSettings)}
            style={{
              padding: '6px 10px',
              backgroundColor: showSettings ? '#450C3F' : 'transparent',
              color: showSettings ? '#ffffff' : '#450C3F',
            }}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
      <p style={{ fontSize: '0.85rem', color: '#450C3F', opacity: 0.8, marginTop: 0, marginBottom: '20px', fontWeight: 600, fontStyle: 'italic' }}>
        “Set the tokens. Set the amount. Let the protocol do the rest.”
      </p>

      {/* Slippage Settings Panel */}
      {showSettings && (
        <div
          className="sharp-card-sm"
          style={{
            backgroundColor: '#FCECD8',
            marginBottom: '20px',
            border: '2px solid #450C3F',
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>
            Slippage Tolerance Protection
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            {['0.1', '0.5', '1.0'].map((val) => (
              <button
                key={val}
                className="sharp-button-outline"
                onClick={() => setSlippage(val)}
                style={{
                  flex: 1,
                  padding: '6px',
                  fontSize: '0.8rem',
                  backgroundColor: slippage === val ? '#165823' : 'transparent',
                  color: slippage === val ? '#ffffff' : '#450C3F',
                  borderColor: '#450C3F',
                }}
              >
                {val}%
              </button>
            ))}
            <input
              type="number"
              placeholder="Custom"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              style={{
                width: '80px',
                padding: '6px',
                border: '2px solid #450C3F',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                fontWeight: 700,
                textAlign: 'center',
              }}
            />
          </div>
          <div style={{ fontSize: '0.75rem', color: '#555' }}>
            Your transaction will revert if the price changes unfavorably by more than this percentage.
          </div>
        </div>
      )}

      {/* Input Token Box */}
      <div className="sharp-input-box" style={{ marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
          <span>YOU PAY</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            BALANCE: <span className="mono">{isKavIn ? parseFloat(kaySwap.kavBalance).toFixed(2) : parseFloat(kaySwap.ethBalance).toFixed(4)}</span>
            <button
              onClick={handleMax}
              style={{
                background: '#450C3F',
                color: '#ffffff',
                border: 'none',
                padding: '1px 6px',
                fontSize: '0.7rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              MAX
            </button>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="number"
            placeholder="0.00"
            value={amountIn}
            onChange={(e) => setAmountIn(e.target.value)}
          />
          <div className="sharp-badge sharp-badge-plum" style={{ fontSize: '0.9rem', padding: '6px 12px', gap: '8px' }}>
            {isKavIn ? (
              <>
                <img src={logoImg} style={{ width: '18px', height: '18px' }} alt="KAV" />
                <span>KAV</span>
              </>
            ) : (
              <>
                <span style={{ fontWeight: 800, color: '#627EEA' }}>Ξ</span>
                <span>ETH</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Swap Switch Button */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '-10px 0', zIndex: 2, position: 'relative' }}>
        <button
          className="sharp-button-outline"
          onClick={handleFlip}
          style={{
            backgroundColor: '#ffffff',
            border: '2px solid #450C3F',
            padding: '8px',
            boxShadow: '2px 2px 0px #450C3F',
          }}
        >
          <ArrowDownUp size={18} />
        </button>
      </div>

      {/* Output Token Box */}
      <div className="sharp-input-box" style={{ marginTop: '8px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
          <span>YOU RECEIVE (ESTIMATED)</span>
          <span>BALANCE: <span className="mono">{isKavIn ? parseFloat(kaySwap.ethBalance).toFixed(4) : parseFloat(kaySwap.kavBalance).toFixed(2)}</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="number"
            placeholder="0.00"
            value={amountOut}
            readOnly
            style={{ color: '#165823' }}
          />
          <div className="sharp-badge sharp-badge-green" style={{ fontSize: '0.9rem', padding: '6px 12px', gap: '8px' }}>
            {!isKavIn ? (
              <>
                <img src={logoImg} style={{ width: '18px', height: '18px' }} alt="KAV" />
                <span>KAV</span>
              </>
            ) : (
              <>
                <span style={{ fontWeight: 800 }}>Ξ</span>
                <span>ETH</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quote & Trade Details */}
      {parseFloat(amountIn) > 0 && (
        <div
          className="sharp-card-sm"
          style={{
            backgroundColor: '#FCECD8',
            marginBottom: '20px',
            fontSize: '0.82rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            border: '2px solid #450C3F',
          }}
        >
          {/* Exchange Rate with Inversion Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#555', fontWeight: 600 }}>Spot Exchange Rate:</span>
            <button
              onClick={() => setIsInvertedRate(!isInvertedRate)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: '#450C3F',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: 0,
              }}
              title="Click to toggle rate inversion"
            >
              <span>{getExchangeRate()}</span>
              <RefreshCw size={12} />
            </button>
          </div>

          {/* Price Impact Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#555', fontWeight: 600 }}>Price Impact:</span>
            <span
              style={{
                backgroundColor: getImpactBadge().bg,
                color: getImpactBadge().color,
                padding: '2px 8px',
                fontWeight: 800,
                fontSize: '0.78rem',
                border: '1px solid #450C3F',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {getImpactBadge().text}
            </span>
          </div>

          {/* Minimum Received */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#555', fontWeight: 600 }}>Minimum Received ({slippage}% slip):</span>
            <span className="mono" style={{ fontWeight: 700, color: '#165823' }}>
              {calculateMinOut()} {isKavIn ? 'ETH' : 'KAV'}
            </span>
          </div>

          {/* AMM LP Fee Breakdown */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#555', fontWeight: 600 }}>AMM Protocol Fee (0.30%):</span>
            <span className="mono" style={{ fontWeight: 700 }}>
              {(parseFloat(amountIn) * 0.003).toFixed(4)} {isKavIn ? 'KAV' : 'ETH'}
            </span>
          </div>

          {/* Route Visualizer */}
          <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px dashed #450C3F', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#450C3F' }}>
              <Route size={14} /> Optimized Route:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
              <span className="sharp-badge sharp-badge-plum" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>{isKavIn ? 'KAV' : 'ETH'}</span>
              <span>&rarr;</span>
              <span className="sharp-badge" style={{ backgroundColor: '#165823', color: '#fff', fontSize: '0.7rem', padding: '2px 6px' }}>KaySwap Pool (0.3%)</span>
              <span>&rarr;</span>
              <span className="sharp-badge sharp-badge-green" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>{!isKavIn ? 'KAV' : 'ETH'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error / Status Alert */}
      {kaySwap.error && (
        <div
          style={{
            backgroundColor: '#450C3F',
            color: '#FCECD8',
            padding: '12px',
            marginBottom: '16px',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '2px solid #450C3F',
          }}
        >
          <AlertCircle size={18} />
          <span>{kaySwap.error}</span>
        </div>
      )}

      {/* Action Buttons */}
      {!isConnected ? (
        <div style={{ textAlign: 'center', padding: '14px', border: '2px dashed #450C3F', fontWeight: 700, fontSize: '0.9rem' }}>
          CONNECT WALLET TO START SWAPPING
        </div>
      ) : !isAuthenticated ? (
        <button
          className="sharp-button-secondary"
          onClick={onSignIn}
          disabled={isSigning}
          style={{ width: '100%', gap: '8px' }}
        >
          <KeyRound size={18} />
          <span>{isSigning ? 'SIGNING MESSAGE...' : 'SIGN IN WITH ETHEREUM TO SWAP'}</span>
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <button
            className="sharp-button-primary"
            onClick={handleSwap}
            disabled={kaySwap.txPending || !amountIn || parseFloat(amountIn) <= 0}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '14px 16px',
              backgroundColor: '#165823',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 800 }}>
              {kaySwap.txPending && <RefreshCw size={16} className="spin" />}
              <span>
                {kaySwap.txPending
                  ? 'PROCESSING TRANSACTION...'
                  : isKavIn
                  ? !isKavApproved()
                    ? 'APPROVE & SWAP'
                    : 'SWAP KAV FOR ETH'
                  : 'SWAP ETH FOR KAV'}
              </span>
              {!kaySwap.txPending && <ArrowRight size={18} />}
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
