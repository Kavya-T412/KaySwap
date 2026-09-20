import React, { useState, useEffect } from 'react';
import { Plus, Minus, Layers, TrendingUp, Info } from 'lucide-react';
import { useKaySwap } from '../hooks/useKaySwap';
import logoImg from '../KaySwap.png';

interface LiquidityCardProps {
  kaySwap: ReturnType<typeof useKaySwap>;
  isAuthenticated: boolean;
}

export const LiquidityCard: React.FC<LiquidityCardProps> = ({ kaySwap, isAuthenticated }) => {
  const [activeTab, setActiveTab] = useState<'add' | 'remove'>('add');

  // Add Liquidity state
  const [kavAmount, setKavAmount] = useState<string>('');
  const [ethAmount, setEthAmount] = useState<string>('');

  // Remove Liquidity state
  const [lpRemoveAmount, setLpRemoveAmount] = useState<string>('');

  // Auto-calculate optimal ratio when adding liquidity if reserves exist
  const handleKavChange = (val: string) => {
    setKavAmount(val);
    const resKav = parseFloat(kaySwap.reserveKav);
    const resEth = parseFloat(kaySwap.reserveEth);

    if (val && parseFloat(val) > 0 && resKav > 0 && resEth > 0) {
      const optimalEth = (parseFloat(val) * resEth) / resKav;
      setEthAmount(optimalEth.toFixed(6));
    }
  };

  const handleEthChange = (val: string) => {
    setEthAmount(val);
    const resKav = parseFloat(kaySwap.reserveKav);
    const resEth = parseFloat(kaySwap.reserveEth);

    if (val && parseFloat(val) > 0 && resKav > 0 && resEth > 0) {
      const optimalKav = (parseFloat(val) * resKav) / resEth;
      setKavAmount(optimalKav.toFixed(4));
    }
  };

  // Check allowance for KAV token
  const isKavApproved = () => {
    if (!kavAmount || parseFloat(kavAmount) <= 0) return true;
    return parseFloat(kaySwap.kavAllowance) >= parseFloat(kavAmount);
  };

  const handleApprove = async () => {
    if (!kavAmount || parseFloat(kavAmount) <= 0) return;
    await kaySwap.approveKav(kavAmount);
  };

  const handleAddLiquidity = async () => {
    if (!kavAmount || !ethAmount) return;
    await kaySwap.addLiquidity(kavAmount, ethAmount);
    setKavAmount('');
    setEthAmount('');
  };

  const handleRemoveLiquidity = async () => {
    if (!lpRemoveAmount || parseFloat(lpRemoveAmount) <= 0) return;
    await kaySwap.removeLiquidity(lpRemoveAmount);
    setLpRemoveAmount('');
  };

  // Pool Share Calculation
  const calculatePoolShare = () => {
    const userLp = parseFloat(kaySwap.lpBalance);
    const totalLp = parseFloat(kaySwap.totalLpSupply);
    if (totalLp <= 0 || userLp <= 0) return '0.00%';
    return `${((userLp / totalLp) * 100).toFixed(2)}%`;
  };

  // Returned amounts on remove
  const getExpectedReturnOnRemove = () => {
    const userLp = parseFloat(lpRemoveAmount || '0');
    const totalLp = parseFloat(kaySwap.totalLpSupply);
    const resKav = parseFloat(kaySwap.reserveKav);
    const resEth = parseFloat(kaySwap.reserveEth);

    if (totalLp <= 0 || userLp <= 0) return { kav: '0', eth: '0' };
    const retKav = (userLp * resKav) / totalLp;
    const retEth = (userLp * resEth) / totalLp;

    return { kav: retKav.toFixed(4), eth: retEth.toFixed(6) };
  };

  return (
    <div className="sharp-card" style={{ maxWidth: '540px', margin: '0 auto' }}>
      {/* Tab Controls */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          className={`sharp-tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <Plus size={18} />
          <span>ADD LIQUIDITY</span>
        </button>
        <button
          className={`sharp-tab ${activeTab === 'remove' ? 'active' : ''}`}
          onClick={() => setActiveTab('remove')}
          style={{ flex: 1, justifyContent: 'center' }}
        >
          <Minus size={18} />
          <span>REMOVE LIQUIDITY</span>
        </button>
      </div>

      {/* Pool Reserves Summary Card */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.05em' }}>
            MY POOL POSITION & RESERVES
          </span>
          <span className="sharp-badge sharp-badge-green">
            SHARE: {calculatePoolShare()}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div style={{ backgroundColor: 'rgba(252, 236, 216, 0.1)', padding: '10px', border: '1px solid #FCECD8' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>KAV RESERVE</div>
            <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FCECD8' }}>
              {parseFloat(kaySwap.reserveKav).toLocaleString()} KAV
            </div>
          </div>
          <div style={{ backgroundColor: 'rgba(252, 236, 216, 0.1)', padding: '10px', border: '1px solid #FCECD8' }}>
            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>ETH RESERVE</div>
            <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FCECD8' }}>
              {parseFloat(kaySwap.reserveEth).toFixed(4)} ETH
            </div>
          </div>
        </div>

        <div style={{ marginTop: '12px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>My LP Token Balance:</span>
          <span className="mono" style={{ fontWeight: 700, color: '#165823', backgroundColor: '#FCECD8', padding: '2px 6px' }}>
            {parseFloat(kaySwap.lpBalance).toFixed(4)} KAY-LP
          </span>
        </div>
      </div>

      {/* Add Liquidity Form */}
      {activeTab === 'add' ? (
        <div>
          <div className="sharp-input-box" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
              <span>DEPOSIT KAV</span>
              <span>BAL: <span className="mono">{parseFloat(kaySwap.kavBalance).toFixed(2)}</span></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="number"
                placeholder="0.00"
                value={kavAmount}
                onChange={(e) => handleKavChange(e.target.value)}
              />
              <div className="sharp-badge sharp-badge-plum">
                <img src={logoImg} style={{ width: '16px', height: '16px' }} alt="KAV" />
                <span>KAV</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', margin: '8px 0', fontSize: '1.2rem', fontWeight: 800, color: '#165823' }}>+</div>

          <div className="sharp-input-box" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
              <span>DEPOSIT ETH</span>
              <span>BAL: <span className="mono">{parseFloat(kaySwap.ethBalance).toFixed(4)}</span></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="number"
                placeholder="0.00"
                value={ethAmount}
                onChange={(e) => handleEthChange(e.target.value)}
              />
              <div className="sharp-badge sharp-badge-green">
                <span>Ξ ETH</span>
              </div>
            </div>
          </div>

          {!isAuthenticated ? (
            <div style={{ textAlign: 'center', padding: '12px', border: '2px dashed #450C3F', fontWeight: 700 }}>
              AUTHENTICATION REQUIRED TO PROVIDE LIQUIDITY
            </div>
          ) : !isKavApproved() ? (
            <button
              className="sharp-button-secondary"
              onClick={handleApprove}
              disabled={kaySwap.txPending}
              style={{ width: '100%' }}
            >
              {kaySwap.txPending ? 'APPROVING KAV...' : 'APPROVE KAV FOR POOL'}
            </button>
          ) : (
            <button
              className="sharp-button-primary"
              onClick={handleAddLiquidity}
              disabled={kaySwap.txPending || !kavAmount || !ethAmount}
              style={{ width: '100%' }}
            >
              {kaySwap.txPending ? 'ADDING LIQUIDITY...' : 'SUPPLY LIQUIDITY'}
            </button>
          )}
        </div>
      ) : (
        /* Remove Liquidity Form */
        <div>
          <div className="sharp-input-box" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
              <span>BURN LP TOKENS (KAY-LP)</span>
              <span>MAX: <span className="mono">{parseFloat(kaySwap.lpBalance).toFixed(4)}</span></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="number"
                placeholder="0.00"
                value={lpRemoveAmount}
                onChange={(e) => setLpRemoveAmount(e.target.value)}
              />
              <button
                className="sharp-button-outline"
                onClick={() => setLpRemoveAmount(kaySwap.lpBalance)}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                MAX
              </button>
            </div>
          </div>

          {/* Quick percentage buttons */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {['25', '50', '75', '100'].map((pct) => (
              <button
                key={pct}
                className="sharp-button-outline"
                onClick={() => {
                  const val = (parseFloat(kaySwap.lpBalance) * (parseInt(pct) / 100)).toFixed(4);
                  setLpRemoveAmount(val);
                }}
                style={{ flex: 1, padding: '6px', fontSize: '0.8rem' }}
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Expected Return display */}
          <div
            className="sharp-card-sm"
            style={{ backgroundColor: '#FCECD8', marginBottom: '20px', border: '2px solid #450C3F' }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' }}>
              EXPECTED RETURN FROM POOL:
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>{getExpectedReturnOnRemove().kav} KAV</span>
              <span>+</span>
              <span>{getExpectedReturnOnRemove().eth} ETH</span>
            </div>
          </div>

          {!isAuthenticated ? (
            <div style={{ textAlign: 'center', padding: '12px', border: '2px dashed #450C3F', fontWeight: 700 }}>
              AUTHENTICATION REQUIRED TO REMOVE LIQUIDITY
            </div>
          ) : (
            <button
              className="sharp-button-primary"
              onClick={handleRemoveLiquidity}
              disabled={
                kaySwap.txPending ||
                !lpRemoveAmount ||
                parseFloat(lpRemoveAmount) <= 0 ||
                parseFloat(lpRemoveAmount) > parseFloat(kaySwap.lpBalance)
              }
              style={{ width: '100%' }}
            >
              {kaySwap.txPending ? 'REMOVING LIQUIDITY...' : 'BURN LP & REDEEM RESERVES'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
