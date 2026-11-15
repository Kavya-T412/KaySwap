import React, { useState } from 'react';
import { Plus, Minus, Layers, TrendingUp, Info, DollarSign, Award, Target, Zap, ChevronRight, ShieldCheck, FolderPlus, List, BarChart2, Sparkles, ExternalLink } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useKaySwap } from '../hooks/useKaySwap';
import { LpNftCertificate, LpNftCertificateProps } from './LpNftCertificate';
import { addCertificateNftToWallet } from '../utils/walletNft';
import logoImg from '../KaySwap.png';

interface LiquidityCardProps {
  kaySwap: ReturnType<typeof useKaySwap>;
  isAuthenticated: boolean;
}

export const LiquidityCard: React.FC<LiquidityCardProps> = ({ kaySwap, isAuthenticated }) => {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<'create_liquidity' | 'my_pools' | 'remove'>('create_liquidity');
  const [createMode, setCreateMode] = useState<'range_nft' | 'standard' | 'new_pool'>('range_nft');

  // LP Certificate Modal State
  const [certificateData, setCertificateData] = useState<Omit<LpNftCertificateProps, 'isOpen' | 'onClose'> | null>(null);

  // Create New Pool State
  const [poolPairName, setPoolPairName] = useState<string>('KAV/ETH');
  const [newPoolFeeTier, setNewPoolFeeTier] = useState<number>(3000);
  const [newPoolKavAmt, setNewPoolKavAmt] = useState<string>('100');
  const [newPoolEthAmt, setNewPoolEthAmt] = useState<string>('0.05');

  // Standard Add Liquidity state
  const [kavAmount, setKavAmount] = useState<string>('');
  const [ethAmount, setEthAmount] = useState<string>('');

  // Concentrated Range Position state
  const [selectedFeeTier, setSelectedFeeTier] = useState<number>(3000); // 3000 = 0.3%
  const [minPrice, setMinPrice] = useState<string>('0.0001');
  const [maxPrice, setMaxPrice] = useState<string>('0.001');
  const [isFullRange, setIsFullRange] = useState<boolean>(false);
  const [rangeKavAmt, setRangeKavAmt] = useState<string>('');
  const [rangeEthAmt, setRangeEthAmt] = useState<string>('');

  // Remove Liquidity state
  const [lpRemoveAmount, setLpRemoveAmount] = useState<string>('');

  const activeUserPositions = kaySwap.userPositions.filter((p) => p.isActive);
  const validUserCreatedPools = kaySwap.userCreatedPools.filter(
    (p) => p && p.id && parseFloat(p.reserve0 || '0') > 0 && parseFloat(p.reserve1 || '0') > 0
  );

  const spotPrice = parseFloat(kaySwap.reserveKav) > 0 && parseFloat(kaySwap.reserveEth) > 0
    ? parseFloat(kaySwap.reserveEth) / parseFloat(kaySwap.reserveKav)
    : 0.0005;

  // Auto-calculate optimal ratio when adding standard liquidity
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

  const handleCreatePool = async () => {
    if (!newPoolKavAmt || !newPoolEthAmt) return;
    const parts = poolPairName.split('/');
    const token0 = parts[0] || 'KAV';
    const token1 = parts[1] || 'ETH';
    const ok = await kaySwap.createPool(token0, token1, newPoolFeeTier, newPoolKavAmt, newPoolEthAmt);
    if (ok) {
      const savedKav = newPoolKavAmt;
      const savedEth = newPoolEthAmt;
      setNewPoolKavAmt('');
      setNewPoolEthAmt('');
      // Directly prompt connected wallet to add certificate NFT to wallet
      addCertificateNftToWallet('1', undefined, {
        pair: `${token0}/${token1}`,
        amountKav: savedKav,
        amountEth: savedEth,
        feeTier: newPoolFeeTier,
      });
    }
  };

  const handleAddLiquidity = async () => {
    if (!kavAmount || !ethAmount) return;
    const savedKav = kavAmount;
    const savedEth = ethAmount;
    const ok = await kaySwap.addLiquidity(kavAmount, ethAmount);
    if (ok) {
      setKavAmount('');
      setEthAmount('');
      // Directly prompt connected wallet to add certificate NFT to wallet
      addCertificateNftToWallet('1', undefined, {
        pair: 'KAV/ETH',
        amountKav: savedKav,
        amountEth: savedEth,
        feeTier: 3000,
      });
    }
  };

  const handleAddRangePosition = async () => {
    if (!rangeKavAmt || !rangeEthAmt) return;
    const minP = isFullRange ? '0.000001' : minPrice;
    const maxP = isFullRange ? '1000' : maxPrice;
    const savedKav = rangeKavAmt;
    const savedEth = rangeEthAmt;
    const ok = await kaySwap.addRangePosition(minP, maxP, selectedFeeTier, rangeKavAmt, rangeEthAmt);
    if (ok) {
      setRangeKavAmt('');
      setRangeEthAmt('');
      // Directly prompt connected wallet to add certificate NFT to wallet
      const nextId = String(kaySwap.userPositions.length + 1);
      addCertificateNftToWallet(nextId, undefined, {
        pair: 'KAV/ETH',
        amountKav: savedKav,
        amountEth: savedEth,
        feeTier: selectedFeeTier,
      });
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!lpRemoveAmount || parseFloat(lpRemoveAmount) <= 0) return;
    await kaySwap.removeLiquidity(lpRemoveAmount);
    setLpRemoveAmount('');
  };

  const calculatePoolShare = () => {
    const userLp = parseFloat(kaySwap.lpBalance);
    const totalLp = parseFloat(kaySwap.totalLpSupply);
    if (totalLp <= 0 || userLp <= 0) return '0.00%';
    return `${((userLp / totalLp) * 100).toFixed(2)}%`;
  };

  const hasPendingPoolFees = parseFloat(kaySwap.pendingFeesKav) > 0 || parseFloat(kaySwap.pendingFeesEth) > 0;

  return (
    <div style={{ width: '100%', maxWidth: '1160px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Card */}
      <div className="sharp-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.6rem', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
              LIQUIDITY <span style={{ color: '#165823' }}>POOLS & LP NFT CERTIFICATES</span>
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#450C3F', opacity: 0.85, margin: '4px 0 0 0', fontWeight: 600, fontStyle: 'italic' }}>
              “Create Concentrated & Standard Liquidity, Mint Animated LP Certificates, and Collect Fees.”
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="sharp-card-sm" style={{ backgroundColor: '#165823', color: '#fff', padding: '10px 16px', border: '2px solid #450C3F' }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', opacity: 0.9 }}>UNCLAIMED FEES</div>
              <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                {parseFloat(kaySwap.pendingFeesKav).toFixed(2)} KAV + {parseFloat(kaySwap.pendingFeesEth).toFixed(4)} ETH
              </div>
            </div>

            {isAuthenticated && (
              <button
                className="sharp-button-secondary"
                onClick={() => kaySwap.collectPoolFees()}
                disabled={kaySwap.txPending || !hasPendingPoolFees}
                style={{ backgroundColor: '#FCECD8', color: '#450C3F', fontSize: '0.9rem', padding: '10px 16px' }}
              >
                <DollarSign size={16} />
                <span>COLLECT FEES</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Consolidated Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
        <button
          className={`sharp-tab ${activeTab === 'create_liquidity' ? 'active' : ''}`}
          onClick={() => setActiveTab('create_liquidity')}
          style={{ flex: 1.5, justifyContent: 'center', fontSize: '0.9rem', padding: '14px 12px', fontWeight: 800 }}
        >
          <FolderPlus size={18} />
          <span>CREATE LIQUIDITY (STANDARD & RANGE NFTs)</span>
        </button>
        <button
          className={`sharp-tab ${activeTab === 'my_pools' ? 'active' : ''}`}
          onClick={() => setActiveTab('my_pools')}
          style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', padding: '14px 8px' }}
        >
          <List size={18} />
          <span>MY CREATED POOLS & NFTs ({validUserCreatedPools.length + activeUserPositions.length})</span>
        </button>
        <button
          className={`sharp-tab ${activeTab === 'remove' ? 'active' : ''}`}
          onClick={() => setActiveTab('remove')}
          style={{ flex: 1, justifyContent: 'center', fontSize: '0.85rem', padding: '14px 8px' }}
        >
          <Minus size={18} />
          <span>REMOVE LIQUIDITY</span>
        </button>
      </div>

      {/* Grid Layout Container */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px', width: '100%' }}>
        {/* Left Column: Active Form / Content View */}
        <div className="sharp-card" style={{ padding: '24px' }}>

          {/* ------------------------------------------------------------- */}
          {/* UNIFIED CREATE LIQUIDITY TAB                                  */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'create_liquidity' && (
            <div>
              {/* Liquidity Strategy Sub-Selector */}
              <div style={{ marginBottom: '20px', borderBottom: '2px solid #450C3F', paddingBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', color: '#165823' }}>
                  SELECT LIQUIDITY CREATION MODE
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="sharp-button-outline"
                    onClick={() => setCreateMode('range_nft')}
                    style={{
                      flex: 1,
                      padding: '10px 6px',
                      fontSize: '0.8rem',
                      backgroundColor: createMode === 'range_nft' ? '#450C3F' : 'transparent',
                      color: createMode === 'range_nft' ? '#ffffff' : '#450C3F',
                      borderColor: '#450C3F',
                      fontWeight: 700,
                    }}
                  >
                    <Target size={14} style={{ marginRight: '4px' }} />
                    <span>RANGE POSITION (NFT)</span>
                  </button>

                  <button
                    className="sharp-button-outline"
                    onClick={() => setCreateMode('standard')}
                    style={{
                      flex: 1,
                      padding: '10px 6px',
                      fontSize: '0.8rem',
                      backgroundColor: createMode === 'standard' ? '#450C3F' : 'transparent',
                      color: createMode === 'standard' ? '#ffffff' : '#450C3F',
                      borderColor: '#450C3F',
                      fontWeight: 700,
                    }}
                  >
                    <Plus size={14} style={{ marginRight: '4px' }} />
                    <span>STANDARD POOL</span>
                  </button>

                  <button
                    className="sharp-button-outline"
                    onClick={() => setCreateMode('new_pool')}
                    style={{
                      flex: 1,
                      padding: '10px 6px',
                      fontSize: '0.8rem',
                      backgroundColor: createMode === 'new_pool' ? '#450C3F' : 'transparent',
                      color: createMode === 'new_pool' ? '#ffffff' : '#450C3F',
                      borderColor: '#450C3F',
                      fontWeight: 700,
                    }}
                  >
                    <FolderPlus size={14} style={{ marginRight: '4px' }} />
                    <span>NEW POOL</span>
                  </button>
                </div>
              </div>

              {/* MODE 1: UNISWAP V3 RANGE POSITION LIQUIDITY WITH NFT */}
              {createMode === 'range_nft' && (
                <div>
                  <h3 style={{ fontSize: '1.15rem', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={18} color="#165823" />
                    <span>CREATE RANGE POSITION & MINT LP CERTIFICATE NFT</span>
                  </h3>

                  {/* Price Range Visualizer */}
                  <div className="sharp-card-sm" style={{ backgroundColor: '#FCECD8', border: '2px solid #450C3F', padding: '16px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>MARKET SPOT PRICE & RANGE ANALYSIS</span>
                      <span className="sharp-badge sharp-badge-green" style={{ fontSize: '0.72rem' }}>
                        1 KAV = {spotPrice.toFixed(6)} ETH
                      </span>
                    </div>

                    <div style={{ position: 'relative', height: '24px', backgroundColor: '#ffffff', border: '2px solid #450C3F', margin: '16px 0 8px 0', overflow: 'hidden' }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: '20%',
                          right: '20%',
                          top: 0,
                          bottom: 0,
                          backgroundColor: 'rgba(22, 88, 35, 0.25)',
                          borderLeft: '2px solid #165823',
                          borderRight: '2px solid #165823',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          left: '50%',
                          top: 0,
                          bottom: 0,
                          width: '4px',
                          backgroundColor: '#450C3F',
                        }}
                        title="Current Market Spot Price"
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                      <span>Min: {minPrice} ETH</span>
                      <span style={{ color: '#165823' }}>Spot: {spotPrice.toFixed(6)} ETH</span>
                      <span>Max: {maxPrice} ETH</span>
                    </div>
                  </div>

                  {/* Fee Tier Selector */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                      Select Fee Tier
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {[
                        { label: '0.05%', value: 500, desc: 'Low Volatility' },
                        { label: '0.30%', value: 3000, desc: 'Standard Pair' },
                        { label: '1.00%', value: 10000, desc: 'Exotic Pairs' },
                      ].map((tier) => (
                        <button
                          key={tier.value}
                          className="sharp-button-outline"
                          onClick={() => setSelectedFeeTier(tier.value)}
                          style={{
                            flex: 1,
                            padding: '10px 4px',
                            fontSize: '0.78rem',
                            backgroundColor: selectedFeeTier === tier.value ? '#165823' : 'transparent',
                            color: selectedFeeTier === tier.value ? '#ffffff' : '#450C3F',
                            borderColor: '#450C3F',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                          }}
                        >
                          <strong style={{ fontSize: '0.95rem' }}>{tier.label}</strong>
                          <span style={{ fontSize: '0.68rem', opacity: 0.85 }}>{tier.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Bounds */}
                  <div className="sharp-card-sm" style={{ backgroundColor: '#ffffff', border: '2px solid #450C3F', padding: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>SET PRICE RANGE BOUNDS (ETH per KAV)</span>
                      <button
                        className="sharp-button-outline"
                        onClick={() => setIsFullRange(!isFullRange)}
                        style={{
                          padding: '2px 8px',
                          fontSize: '0.7rem',
                          backgroundColor: isFullRange ? '#450C3F' : 'transparent',
                          color: isFullRange ? '#ffffff' : '#450C3F',
                        }}
                      >
                        {isFullRange ? 'FULL RANGE (ACTIVE)' : 'FULL RANGE'}
                      </button>
                    </div>

                    {!isFullRange ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700 }}>MIN PRICE</div>
                          <input
                            type="number"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '2px solid #450C3F',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.9rem',
                              fontWeight: 700,
                            }}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700 }}>MAX PRICE</div>
                          <input
                            type="number"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '8px',
                              border: '2px solid #450C3F',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '0.9rem',
                              fontWeight: 700,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: '#165823', fontWeight: 700, padding: '4px 0' }}>
                        Full Range Active: Collect swap fees across all price intervals.
                      </div>
                    )}
                  </div>

                  {/* Deposit Inputs */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    <div className="sharp-input-box">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                        <span>DEPOSIT KAV</span>
                        <span>BAL: <span className="mono">{parseFloat(kaySwap.kavBalance).toFixed(2)}</span></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={rangeKavAmt}
                          onChange={(e) => setRangeKavAmt(e.target.value)}
                        />
                        <div className="sharp-badge sharp-badge-plum">KAV</div>
                      </div>
                    </div>

                    <div className="sharp-input-box">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                        <span>DEPOSIT ETH</span>
                        <span>BAL: <span className="mono">{parseFloat(kaySwap.ethBalance).toFixed(4)}</span></span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={rangeEthAmt}
                          onChange={(e) => setRangeEthAmt(e.target.value)}
                        />
                        <div className="sharp-badge sharp-badge-green">Ξ ETH</div>
                      </div>
                    </div>
                  </div>

                  <button
                    className="sharp-button-primary"
                    onClick={handleAddRangePosition}
                    disabled={kaySwap.txPending || !rangeKavAmt || !rangeEthAmt}
                    style={{ width: '100%', padding: '14px' }}
                  >
                    {kaySwap.txPending ? 'CREATING POSITION...' : 'PROVIDE RANGE LIQUIDITY'}
                  </button>
                </div>
              )}

              {/* MODE 2: STANDARD CONSTANT PRODUCT POOL LIQUIDITY */}
              {createMode === 'standard' && (
                <div>
                  <h3 style={{ fontSize: '1.15rem', textTransform: 'uppercase', marginBottom: '16px' }}>
                    SUPPLY STANDARD CONSTANT-PRODUCT LIQUIDITY
                  </h3>

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
                      <div className="sharp-badge sharp-badge-plum">KAV</div>
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
                      <div className="sharp-badge sharp-badge-green">Ξ ETH</div>
                    </div>
                  </div>

                  <button
                    className="sharp-button-primary"
                    onClick={handleAddLiquidity}
                    disabled={kaySwap.txPending || !kavAmount || !ethAmount}
                    style={{ width: '100%', padding: '14px' }}
                  >
                    {kaySwap.txPending ? 'ADDING LIQUIDITY...' : 'ADD LIQUIDITY'}
                  </button>
                </div>
              )}

              {/* MODE 3: CREATE NEW TOKEN POOL */}
              {createMode === 'new_pool' && (
                <div>
                  <h3 style={{ fontSize: '1.15rem', textTransform: 'uppercase', marginBottom: '16px' }}>
                    INITIALIZE CUSTOM TOKEN POOL RESERVES
                  </h3>

                  <div className="sharp-input-box" style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>TOKEN PAIR NAME</div>
                    <input
                      type="text"
                      value={poolPairName}
                      onChange={(e) => setPoolPairName(e.target.value)}
                      placeholder="e.g. KAV/ETH"
                      style={{ width: '100%', padding: '8px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                    <div className="sharp-input-box">
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>INITIAL KAV DEPOSIT</div>
                      <input
                        type="number"
                        value={newPoolKavAmt}
                        onChange={(e) => setNewPoolKavAmt(e.target.value)}
                        placeholder="100.00"
                      />
                    </div>

                    <div className="sharp-input-box">
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>INITIAL ETH DEPOSIT</div>
                      <input
                        type="number"
                        value={newPoolEthAmt}
                        onChange={(e) => setNewPoolEthAmt(e.target.value)}
                        placeholder="0.05"
                      />
                    </div>
                  </div>

                  <button
                    className="sharp-button-secondary"
                    onClick={handleCreatePool}
                    disabled={kaySwap.txPending || !newPoolKavAmt || !newPoolEthAmt}
                    style={{ width: '100%', padding: '14px' }}
                  >
                    {kaySwap.txPending ? 'CREATING POOL...' : 'CREATE POOL'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* MY CREATED POOLS & NFT CERTIFICATES VIEW                      */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'my_pools' && (
            <div>
              <h3 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={20} color="#165823" />
                <span>CREATED POOLS & LP CERTIFICATE NFTs</span>
              </h3>

              {validUserCreatedPools.length === 0 && activeUserPositions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', border: '2px dashed #450C3F', fontWeight: 700, fontSize: '0.9rem', color: '#555' }}>
                  YOU HAVE NOT CREATED ANY POOLS OR POSITIONS YET. USE "CREATE LIQUIDITY" TAB TO MINT YOUR FIRST LP CERTIFICATE NFT!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* User Positions NFTs */}
                  {activeUserPositions.map((pos) => (
                    <div
                      key={pos.id}
                      className="sharp-card-sm"
                      style={{
                        backgroundColor: '#ffffff',
                        border: '3px solid #450C3F',
                        boxShadow: '4px 4px 0px #165823',
                        padding: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: '#450C3F' }}>
                          KAV / ETH Range Position #{pos.id}
                        </span>
                        <span className="sharp-badge sharp-badge-green" style={{ fontSize: '0.72rem' }}>
                          {(pos.feeTier / 10000).toFixed(2)}% FEE TIER
                        </span>
                      </div>

                      <div style={{ fontSize: '0.82rem', color: '#555', marginBottom: '8px' }}>
                        Deposit: <strong>{parseFloat(pos.amountKav).toFixed(2)} KAV + {parseFloat(pos.amountEth).toFixed(4)} ETH</strong>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                          className="sharp-button-primary"
                          onClick={() =>
                            setCertificateData({
                              positionId: pos.id,
                              pairName: 'KAV / ETH',
                              feeTier: pos.feeTier,
                              amountKav: pos.amountKav,
                              amountEth: pos.amountEth,
                              minPrice: pos.minPrice,
                              maxPrice: pos.maxPrice,
                              ownerAddress: pos.owner,
                              createdAt: pos.createdAt,
                            })
                          }
                          style={{ flex: 1, padding: '8px', fontSize: '0.78rem', backgroundColor: '#165823' }}
                        >
                          <Award size={14} style={{ marginRight: '4px' }} />
                          VIEW CERTIFICATE NFT
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* User Created Pools */}
                  {validUserCreatedPools.map((pool) => (
                    <div
                      key={pool.id}
                      className="sharp-card-sm"
                      style={{
                        backgroundColor: '#ffffff',
                        border: '2px solid #450C3F',
                        boxShadow: '3px 3px 0px #450C3F',
                        padding: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem', color: '#450C3F' }}>
                          {pool.name}
                        </span>
                        <span className="sharp-badge sharp-badge-green" style={{ fontSize: '0.72rem' }}>
                          {(pool.feeTier / 10000).toFixed(2)}% FEE TIER
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: '#555', marginBottom: '8px' }}>
                        Creator Address: <span className="mono" style={{ fontWeight: 700, color: '#165823' }}>{pool.creator}</span>
                      </div>

                      <button
                        className="sharp-button-outline"
                        onClick={() =>
                          setCertificateData({
                            positionId: pool.id.slice(-4),
                            pairName: `${pool.token0Symbol} / ${pool.token1Symbol}`,
                            feeTier: pool.feeTier,
                            amountKav: pool.reserve0,
                            amountEth: pool.reserve1,
                            minPrice: '0.0001',
                            maxPrice: '0.0010',
                            ownerAddress: pool.creator,
                            createdAt: pool.createdAt,
                          })
                        }
                        style={{ width: '100%', padding: '8px', fontSize: '0.78rem', marginTop: '8px' }}
                      >
                        VIEW POOL CERTIFICATE
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB: REMOVE LIQUIDITY                                         */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'remove' && (
            <div>
              <h3 style={{ fontSize: '1.2rem', textTransform: 'uppercase', marginBottom: '16px' }}>
                BURN LP TOKENS & REDEEM LIQUIDITY
              </h3>

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

              <button
                className="sharp-button-primary"
                onClick={handleRemoveLiquidity}
                disabled={
                  kaySwap.txPending ||
                  !lpRemoveAmount ||
                  parseFloat(lpRemoveAmount) <= 0 ||
                  parseFloat(lpRemoveAmount) > parseFloat(kaySwap.lpBalance)
                }
                style={{ width: '100%', padding: '14px' }}
              >
                {kaySwap.txPending ? 'REMOVING LIQUIDITY...' : 'BURN LP & REDEEM RESERVES'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Active Positions & Summary Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Reserve Breakdown Box */}
          <div className="sharp-card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '1rem', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '2px solid #450C3F', paddingBottom: '6px' }}>
              POOL RESERVES & SHARE
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>KAV Reserve:</span>
                <span className="mono" style={{ fontWeight: 700 }}>{parseFloat(kaySwap.reserveKav).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>ETH Reserve:</span>
                <span className="mono" style={{ fontWeight: 700 }}>{parseFloat(kaySwap.reserveEth).toFixed(4)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pool Share:</span>
                <span className="mono" style={{ fontWeight: 800, color: '#165823' }}>{calculatePoolShare()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>LP Balance:</span>
                <span className="mono" style={{ fontWeight: 700 }}>{parseFloat(kaySwap.lpBalance).toFixed(4)} LP</span>
              </div>
            </div>
          </div>

          {/* Active User Position NFTs */}
          <div className="sharp-card" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '1rem', textTransform: 'uppercase', marginBottom: '12px', borderBottom: '2px solid #450C3F', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={16} color="#165823" />
              <span>ACTIVE POSITION NFTs ({kaySwap.userPositions.filter((p) => p.isActive).length})</span>
            </h4>

            {kaySwap.userPositions.filter((p) => p.isActive).length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>
                No active range position NFTs.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {kaySwap.userPositions
                  .filter((p) => p.isActive)
                  .map((pos) => {
                    const isOwner = Boolean(address && pos.owner.toLowerCase() === address.toLowerCase());
                    return (
                      <div
                        key={pos.id}
                        className="sharp-card-sm"
                        style={{
                          backgroundColor: '#ffffff',
                          border: '2px solid #450C3F',
                          padding: '10px',
                          fontSize: '0.78rem',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginBottom: '4px' }}>
                          <span>NFT #{pos.id}</span>
                          <span style={{ color: isOwner ? '#165823' : '#721C24' }}>
                            {isOwner ? 'OWNER (AUTHORIZED)' : 'RESTRICTED'}
                          </span>
                        </div>
                        <div>Range: {parseFloat(pos.minPrice).toFixed(4)} - {parseFloat(pos.maxPrice).toFixed(4)}</div>
                        <div style={{ margin: '4px 0' }}>Unclaimed Fees: {parseFloat(pos.unclaimedKav).toFixed(2)} KAV</div>

                        <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                          <button
                            className="sharp-button-outline"
                            onClick={() =>
                              setCertificateData({
                                positionId: pos.id,
                                pairName: 'KAV / ETH',
                                feeTier: pos.feeTier,
                                amountKav: pos.amountKav,
                                amountEth: pos.amountEth,
                                minPrice: pos.minPrice,
                                maxPrice: pos.maxPrice,
                                ownerAddress: pos.owner,
                                createdAt: pos.createdAt,
                              })
                            }
                            style={{ flex: 1, padding: '4px', fontSize: '0.7rem', backgroundColor: '#165823', color: '#fff' }}
                          >
                            CERTIFICATE
                          </button>
                          <button
                            className="sharp-button-outline"
                            onClick={() =>
                              addCertificateNftToWallet(pos.id, undefined, {
                                pair: 'KAV/ETH',
                                amountKav: pos.amountKav,
                                amountEth: pos.amountEth,
                                feeTier: pos.feeTier,
                              })
                            }
                            style={{ flex: 1, padding: '4px', fontSize: '0.7rem', backgroundColor: '#167D8D', color: '#fff' }}
                            title="Add Certificate NFT directly to connected wallet"
                          >
                            ADD TO WALLET
                          </button>
                          {isOwner && (
                            <button
                              className="sharp-button-outline"
                              onClick={() => kaySwap.removePosition(pos.id)}
                              style={{ flex: 1, padding: '4px', fontSize: '0.7rem', backgroundColor: '#450C3F', color: '#fff' }}
                            >
                              REMOVE
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animated LP NFT Certificate Viewer Modal */}
      {certificateData && (
        <LpNftCertificate
          isOpen={Boolean(certificateData)}
          onClose={() => setCertificateData(null)}
          {...certificateData}
        />
      )}
    </div>
  );
};
