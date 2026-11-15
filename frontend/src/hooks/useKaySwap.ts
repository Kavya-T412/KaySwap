import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers';
import { KAVYA_TOKEN_ADDRESS, KAYSWAP_AMM_ADDRESS, KAVYA_TOKEN_ABI, KAYSWAP_AMM_ABI } from '../config/contracts';
import { LoaderStep } from '../components/LoaderCard';
import { alchemyService, RealGraphPoint } from '../services/alchemyService';
import { formatUserFriendlyError } from '../utils/formatError';

export interface PositionItem {
  id: number;
  owner: string;
  amountKav: string;
  amountEth: string;
  minPrice: string;
  maxPrice: string;
  feeTier: number; // 500 = 0.05%, 3000 = 0.30%, 10000 = 1.00%
  unclaimedKav: string;
  unclaimedEth: string;
  createdAt: number;
  isActive: boolean;
}

export interface PoolItem {
  id: string;
  name: string;
  token0Symbol: string;
  token1Symbol: string;
  feeTier: number;
  reserve0: string;
  reserve1: string;
  creator: string;
  createdAt: number;
}

export interface TransactionItem {
  id: string;
  type:
  | 'SWAP_KAV_ETH'
  | 'SWAP_ETH_KAV'
  | 'ADD_LIQUIDITY'
  | 'REMOVE_LIQUIDITY'
  | 'CLAIM_FAUCET'
  | 'APPROVE'
  | 'MINT'
  | 'COLLECT_FEES'
  | 'ADD_RANGE_POSITION'
  | 'COLLECT_POSITION_FEES'
  | 'REMOVE_POSITION'
  | 'CREATE_POOL';
  summary: string;
  status: 'pending' | 'success' | 'failed';
  hash?: string;
  timestamp: number;
  error?: string;
}

export function useKaySwap(onSwapSuccess?: (txHash?: string) => void) {
  const { address, isConnected } = useAccount();

  const onSwapSuccessRef = useRef(onSwapSuccess);
  useEffect(() => {
    onSwapSuccessRef.current = onSwapSuccess;
  }, [onSwapSuccess]);

  const [ethBalance, setEthBalance] = useState<string>('0');
  const [kavBalance, setKavBalance] = useState<string>('0');
  const [lpBalance, setLpBalance] = useState<string>('0');
  const [kavAllowance, setKavAllowance] = useState<string>('0');

  const [reserveKav, setReserveKav] = useState<string>('0');
  const [reserveEth, setReserveEth] = useState<string>('0');
  const [rawReserveKav, setRawReserveKav] = useState<bigint>(0n);
  const [rawReserveEth, setRawReserveEth] = useState<bigint>(0n);
  const [totalLpSupply, setTotalLpSupply] = useState<string>('0');

  // Stats, Pools & Fee state
  const [pendingFeesKav, setPendingFeesKav] = useState<string>('0');
  const [pendingFeesEth, setPendingFeesEth] = useState<string>('0');
  const [cumulativeFeeKav, setCumulativeFeeKav] = useState<string>('0');
  const [cumulativeFeeEth, setCumulativeFeeEth] = useState<string>('0');
  const [totalVolumeKav, setTotalVolumeKav] = useState<string>('0');
  const [totalVolumeEth, setTotalVolumeEth] = useState<string>('0');
  const [userPositions, setUserPositions] = useState<PositionItem[]>([]);
  const [userCreatedPools, setUserCreatedPools] = useState<PoolItem[]>([]);
  const [graphPoints, setGraphPoints] = useState<RealGraphPoint[]>([]);

  const [kavTotalSupply, setKavTotalSupply] = useState<string>('0');
  const [kavMaxSupply, setKavMaxSupply] = useState<string>('1000000');
  const [kavOwner, setKavOwner] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [txPending, setTxPending] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Loader Card State
  const [isLoaderOpen, setIsLoaderOpen] = useState<boolean>(false);
  const [loaderTitle, setLoaderTitle] = useState<string>('TRANSACTION IN PROGRESS');
  const [loaderSteps, setLoaderSteps] = useState<LoaderStep[]>([]);

  // Transaction History State & Modal Toggle
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [isTxModalOpen, setIsTxModalOpen] = useState<boolean>(false);

  // Load transactions and user created pools directly from Blockchain via Alchemy API
  useEffect(() => {
    let isMounted = true;
    if (address) {
      (async () => {
        try {
          const onChain = await alchemyService.fetchUserOnChainActivity(address);
          if (isMounted) {
            if (onChain.transactions.length > 0) {
              setTransactions(onChain.transactions);
            }
            if (onChain.userPools.length > 0) {
              setUserCreatedPools(onChain.userPools);
            }
          }
        } catch (e) {
          console.error('Failed to load on-chain data via Alchemy API', e);
        }
      })();
    } else {
      setTransactions([]);
      setUserCreatedPools([]);
    }
    return () => {
      isMounted = false;
    };
  }, [address]);

  const addTransactionRecord = (type: TransactionItem['type'], summary: string): string => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTx: TransactionItem = {
      id,
      type,
      summary,
      status: 'pending',
      timestamp: Date.now(),
    };
    setTransactions((prev) => [newTx, ...prev]);
    return id;
  };

  const updateTransactionRecord = (id: string, updates: Partial<TransactionItem>) => {
    setTransactions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const clearTransactions = () => {
    setTransactions([]);
  };

  const getEthersSigner = async () => {
    if (!window.ethereum) throw new Error('No crypto wallet detected');
    const provider = new BrowserProvider(window.ethereum);
    return await provider.getSigner();
  };

  const getEthersProvider = () => {
    if (window.ethereum) {
      return new BrowserProvider(window.ethereum);
    }
    return null;
  };

  // Fetch balances, contract reserves & positions
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const provider = getEthersProvider();
      if (!provider) return;

      const kavContract = new Contract(KAVYA_TOKEN_ADDRESS, KAVYA_TOKEN_ABI, provider);
      const ammContract = new Contract(KAYSWAP_AMM_ADDRESS, KAYSWAP_AMM_ABI, provider);

      // Fetch Tokenomics
      const [tSupply, mSupply, ownerAddr] = await Promise.all([
        kavContract.totalSupply().catch(() => 0n),
        kavContract.MAX_SUPPLY().catch(() => parseEther('1000000')),
        kavContract.owner().catch(() => ''),
      ]);

      setKavTotalSupply(formatEther(tSupply));
      setKavMaxSupply(formatEther(mSupply));
      setKavOwner(ownerAddr);

      // Fetch Reserves & Stats
      const [rKav, rEth] = await ammContract.getReserves().catch(() => [0n, 0n]);
      setRawReserveKav(rKav);
      setRawReserveEth(rEth);
      setReserveKav(formatEther(rKav));
      setReserveEth(formatEther(rEth));

      const totalLp = await ammContract.totalSupply().catch(() => 0n);
      setTotalLpSupply(formatEther(totalLp));

      const stats = await ammContract.getPoolStats().catch(() => [0n, 0n, 0n, 0n]);
      setCumulativeFeeKav(formatEther(stats[0]));
      setCumulativeFeeEth(formatEther(stats[1]));
      setTotalVolumeKav(formatEther(stats[2]));
      setTotalVolumeEth(formatEther(stats[3]));

      // Fetch user specific data
      if (address) {
        const [ethBalRaw, kavBalRaw, lpBalRaw, allowRaw, pendFees, posRaw] = await Promise.all([
          provider.getBalance(address).catch(() => 0n),
          kavContract.balanceOf(address).catch(() => 0n),
          ammContract.balanceOf(address).catch(() => 0n),
          kavContract.allowance(address, KAYSWAP_AMM_ADDRESS).catch(() => 0n),
          ammContract.getPendingFees(address).catch(() => [0n, 0n]),
          ammContract.getUserPositions(address).catch(() => []),
        ]);

        setEthBalance(formatEther(ethBalRaw));
        setKavBalance(formatEther(kavBalRaw));
        setLpBalance(formatEther(lpBalRaw));
        setKavAllowance(formatEther(allowRaw));

        setPendingFeesKav(formatEther(pendFees[0]));
        setPendingFeesEth(formatEther(pendFees[1]));

        if (Array.isArray(posRaw)) {
          const parsedPositions: PositionItem[] = posRaw.map((p: any) => ({
            id: Number(p.id),
            owner: p.owner,
            amountKav: formatEther(p.amountKAV),
            amountEth: formatEther(p.amountETH),
            minPrice: formatEther(p.minPrice),
            maxPrice: formatEther(p.maxPrice),
            feeTier: Number(p.feeTier),
            unclaimedKav: formatEther(p.unclaimedKAV),
            unclaimedEth: formatEther(p.unclaimedETH),
            createdAt: Number(p.createdAt) > 0 && Number(p.createdAt) < 100000000000 ? Number(p.createdAt) * 1000 : Number(p.createdAt) || Date.now(),
            isActive: Boolean(p.isActive),
          }));
          setUserPositions(parsedPositions);
        }
      }

      // Fetch 100% Real On-Chain Activity & Original Graph Points via Alchemy RPC
      const onChainResult = await alchemyService.fetchUserOnChainActivity(address);
      if (onChainResult.graphPoints.length > 0) {
        setGraphPoints(onChainResult.graphPoints);
      }
      if (onChainResult.transactions.length > 0) {
        setTransactions((prev) => {
          const map = new Map<string, TransactionItem>();
          [...prev, ...onChainResult.transactions].forEach((tx) => {
            if (tx.hash && !map.has(tx.hash)) {
              map.set(tx.hash, tx);
            } else if (!tx.hash && !map.has(tx.id)) {
              map.set(tx.id, tx);
            }
          });
          return Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp);
        });
      }
      if (onChainResult.userPools.length > 0) {
        setUserCreatedPools((prev) => {
          const map = new Map<string, PoolItem>();
          [...prev, ...onChainResult.userPools].forEach((p) => map.set(p.id, p));
          return Array.from(map.values());
        });
      }
    } catch (err: any) {
      console.error('Error refreshing KaySwap data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Quote calculation using loss-less BigInt math
  const getSwapQuote = (amountIn: string, isKavIn: boolean): string => {
    if (!amountIn || parseFloat(amountIn) <= 0) return '0';
    try {
      const amtInBig = parseEther(amountIn);
      if (rawReserveKav === 0n || rawReserveEth === 0n) return '0';

      const resIn = isKavIn ? rawReserveKav : rawReserveEth;
      const resOut = isKavIn ? rawReserveEth : rawReserveKav;

      const amountInWithFee = amtInBig * 997n;
      const numerator = amountInWithFee * resOut;
      const denominator = resIn * 1000n + amountInWithFee;
      const outBig = numerator / denominator;

      return formatEther(outBig);
    } catch (e) {
      return '0';
    }
  };

  // Price impact calculation: Spot Price vs Execution Price
  const calculatePriceImpact = (amountIn: string, isKavIn: boolean) => {
    const resKav = parseFloat(reserveKav);
    const resEth = parseFloat(reserveEth);
    const amtIn = parseFloat(amountIn);
    if (!amtIn || amtIn <= 0 || resKav <= 0 || resEth <= 0) {
      return { priceImpactPct: 0, spotPrice: '0', executionPrice: '0' };
    }

    const spotPrice = isKavIn ? resEth / resKav : resKav / resEth;
    const amountOutStr = getSwapQuote(amountIn, isKavIn);
    const amtOut = parseFloat(amountOutStr);
    const executionPrice = amtOut / amtIn;

    if (spotPrice <= 0 || executionPrice <= 0) {
      return { priceImpactPct: 0, spotPrice: spotPrice.toFixed(6), executionPrice: '0' };
    }

    const rawImpact = ((spotPrice - executionPrice) / spotPrice) * 100;
    const priceImpactPct = Math.max(0, parseFloat(rawImpact.toFixed(2)));

    return {
      priceImpactPct,
      spotPrice: spotPrice.toFixed(6),
      executionPrice: executionPrice.toFixed(6),
    };
  };

  // -------------------------------------------------------------
  // ACTION: APPROVE KAV TOKEN
  // -------------------------------------------------------------
  const approveKav = async (amount: string, showCard: boolean = true) => {
    setTxPending(true);
    setError(null);
    setTxHash(null);

    if (showCard) {
      setLoaderTitle('APPROVING KAV TOKEN');
      setLoaderSteps([
        {
          stepNumber: 1,
          totalSteps: 1,
          title: `Approve ${amount} KAV`,
          description: 'Awaiting wallet signature for ERC20 token approval...',
          status: 'pending',
        },
      ]);
      setIsLoaderOpen(true);
    }

    const recordId = addTransactionRecord('APPROVE', `Approve ${amount} KAV`);
    try {
      const signer = await getEthersSigner();
      const kavContract = new Contract(KAVYA_TOKEN_ADDRESS, KAVYA_TOKEN_ABI, signer);
      const tx = await kavContract.approve(KAYSWAP_AMM_ADDRESS, parseEther(amount));
      setTxHash(tx.hash);
      updateTransactionRecord(recordId, { hash: tx.hash });

      if (showCard) {
        setLoaderSteps([
          {
            stepNumber: 1,
            totalSteps: 1,
            title: `Approve ${amount} KAV`,
            description: 'Transaction broadcasted to Sepolia network. Confirming block...',
            status: 'pending',
            txHash: tx.hash,
          },
        ]);
      }

      await tx.wait();
      updateTransactionRecord(recordId, { status: 'success' });

      if (showCard) {
        setLoaderSteps([
          {
            stepNumber: 1,
            totalSteps: 1,
            title: `Approve ${amount} KAV Approved`,
            description: 'KAV token allowance successfully granted to KaySwap AMM contract.',
            status: 'success',
            txHash: tx.hash,
          },
        ]);
      }

      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Approve failed:', err);
      const errMsg = formatUserFriendlyError(err);
      setError(errMsg);
      updateTransactionRecord(recordId, { status: 'failed', error: errMsg });

      if (showCard) {
        setLoaderSteps([
          {
            stepNumber: 1,
            totalSteps: 1,
            title: 'Approval Failed',
            description: errMsg,
            status: 'failed',
            error: errMsg,
          },
        ]);
      }
      return false;
    } finally {
      setTxPending(false);
    }
  };

  // -------------------------------------------------------------
  // ACTION: SWAP KAV FOR ETH (2-STEP UNIFIED APPROVE & SWAP CARD)
  // -------------------------------------------------------------
  const swapKavForEth = async (amountKav: string, slippagePct: string = '0.5') => {
    setTxPending(true);
    setError(null);
    setTxHash(null);

    let signer;
    let accountAddr = '';
    try {
      signer = await getEthersSigner();
      accountAddr = await signer.getAddress();
    } catch (err: any) {
      const msg = err?.message || 'Could not connect wallet signer';
      setError(msg);
      setTxPending(false);
      return false;
    }

    const kavContract = new Contract(KAVYA_TOKEN_ADDRESS, KAVYA_TOKEN_ABI, signer);
    const kavIn = parseEther(amountKav);

    // Verify live on-chain allowance with signer to prevent state desync
    let liveAllowance = 0n;
    try {
      liveAllowance = await kavContract.allowance(accountAddr, KAYSWAP_AMM_ADDRESS);
    } catch (e) {
      liveAllowance = parseEther(kavAllowance || '0');
    }

    const needsApprove = liveAllowance < kavIn;

    // Both Step 1 and Step 2 show in the EXACT SAME dialog box card
    setLoaderTitle(needsApprove ? 'SWAP KAV FOR ETH (STEP 1 OF 2 & STEP 2 OF 2)' : 'EXECUTING KAV → ETH SWAP');

    if (needsApprove) {
      setLoaderSteps([
        {
          stepNumber: 1,
          totalSteps: 2,
          title: 'Step 1 of 2: Approve KAV Token',
          description: `Awaiting wallet signature to approve ${amountKav} KAV for KaySwap AMM...`,
          status: 'pending',
        },
        {
          stepNumber: 2,
          totalSteps: 2,
          title: 'Step 2 of 2: Swap KAV for ETH',
          description: 'Will execute automatically once Step 1 confirmation is complete.',
          status: 'idle',
        },
      ]);
      setIsLoaderOpen(true);

      const approveRecordId = addTransactionRecord('APPROVE', `Approve ${amountKav} KAV (Step 1 of 2)`);
      let approveTxHash = '';

      try {
        const txApprove = await kavContract.approve(KAYSWAP_AMM_ADDRESS, kavIn);
        approveTxHash = txApprove.hash;
        setTxHash(txApprove.hash);
        updateTransactionRecord(approveRecordId, { hash: txApprove.hash });

        // Update Step 1 with txHash while confirming on-chain in the same card
        setLoaderSteps([
          {
            stepNumber: 1,
            totalSteps: 2,
            title: 'Step 1 of 2: Approve KAV Token',
            description: `Approval broadcasted to Sepolia (${txApprove.hash.slice(0, 10)}...). Confirming block...`,
            status: 'pending',
            txHash: txApprove.hash,
          },
          {
            stepNumber: 2,
            totalSteps: 2,
            title: 'Step 2 of 2: Swap KAV for ETH',
            description: 'Will execute automatically once Step 1 confirmation is complete.',
            status: 'idle',
          },
        ]);

        await txApprove.wait();
        updateTransactionRecord(approveRecordId, { status: 'success' });

        // Step 1 COMPLETED: Seamlessly advance Step 2 to pending in the SAME dialog box card!
        setLoaderSteps([
          {
            stepNumber: 1,
            totalSteps: 2,
            title: 'Step 1 of 2: KAV Token Approved ✓',
            description: `${amountKav} KAV allowance successfully granted to KaySwap AMM contract.`,
            status: 'success',
            txHash: txApprove.hash,
          },
          {
            stepNumber: 2,
            totalSteps: 2,
            title: 'Step 2 of 2: Swap KAV for ETH',
            description: 'Awaiting wallet signature for KAV → ETH swap transaction...',
            status: 'pending',
          },
        ]);

        setKavAllowance(amountKav);
      } catch (approveErr: any) {
        console.error('Step 1 Approve failed:', approveErr);
        const errMsg = formatUserFriendlyError(approveErr);
        setError(errMsg);
        updateTransactionRecord(approveRecordId, { status: 'failed', error: errMsg });

        setLoaderSteps([
          {
            stepNumber: 1,
            totalSteps: 2,
            title: 'Step 1 of 2: Approval Failed',
            description: errMsg,
            status: 'failed',
            error: errMsg,
            txHash: approveTxHash || null,
          },
          {
            stepNumber: 2,
            totalSteps: 2,
            title: 'Step 2 of 2: Swap KAV for ETH',
            description: 'Cancelled due to approval failure.',
            status: 'idle',
          },
        ]);
        setTxPending(false);
        return false;
      }
    } else {
      setLoaderSteps([
        {
          stepNumber: 1,
          totalSteps: 1,
          title: 'Swap KAV for ETH',
          description: 'Awaiting wallet signature to execute KAV → ETH swap...',
          status: 'pending',
        },
      ]);
      setIsLoaderOpen(true);
    }

    // STEP 2: EXECUTE SWAP TRANSACTION
    const currentStepNum = needsApprove ? 2 : 1;
    const totalSteps = needsApprove ? 2 : 1;

    const estOutStr = getSwapQuote(amountKav, true);
    const estOutBig = parseEther(estOutStr);
    const slipBps = BigInt(Math.floor(parseFloat(slippagePct) * 100));
    const minEthOutBig = (estOutBig * (10000n - slipBps)) / 10000n;

    const recordId = addTransactionRecord(
      'SWAP_KAV_ETH',
      needsApprove ? `Swap ${amountKav} KAV for ETH (Step 2 of 2)` : `Swap ${amountKav} KAV for ETH`
    );

    let swapTxHash = '';
    try {
      const ammContract = new Contract(KAYSWAP_AMM_ADDRESS, KAYSWAP_AMM_ABI, signer);
      const tx = await ammContract.swapKAVForETH(kavIn, minEthOutBig);
      swapTxHash = tx.hash;
      setTxHash(tx.hash);
      updateTransactionRecord(recordId, { hash: tx.hash });

      // Update Step 2 in the same card with broadcast hash
      setLoaderSteps((prev) =>
        prev.map((s) =>
          s.stepNumber === currentStepNum
            ? {
              ...s,
              status: 'pending',
              title: needsApprove ? 'Step 2 of 2: Swap KAV for ETH' : 'Swap KAV for ETH',
              description: `Swap transaction broadcasted to Sepolia (${tx.hash.slice(0, 10)}...). Confirming on-chain...`,
              txHash: tx.hash,
            }
            : s
        )
      );

      await tx.wait();
      updateTransactionRecord(recordId, { status: 'success' });

      // Mark Step 2 COMPLETED in the SAME dialog box card!
      setLoaderSteps((prev) =>
        prev.map((s) =>
          s.stepNumber === currentStepNum
            ? {
              ...s,
              status: 'success',
              title: needsApprove ? 'Step 2 of 2: Swap Completed Successfully ✓' : 'Swap Completed Successfully ✓',
              description: `Successfully swapped ${amountKav} KAV for ~${estOutStr} ETH! ETH delivered directly to your wallet.`,
              txHash: tx.hash,
            }
            : s
        )
      );

      await refreshData();
      if (onSwapSuccessRef.current) {
        onSwapSuccessRef.current(tx.hash);
      }
      return true;
    } catch (err: any) {
      console.error('Swap KAV->ETH failed:', err);
      const errMsg = formatUserFriendlyError(err);
      setError(errMsg);
      updateTransactionRecord(recordId, { status: 'failed', error: errMsg });

      setLoaderSteps((prev) =>
        prev.map((s) =>
          s.stepNumber === currentStepNum
            ? {
              ...s,
              status: 'failed',
              title: needsApprove ? 'Step 2 of 2: Swap Failed' : 'Swap Failed',
              description: errMsg,
              error: errMsg,
              txHash: swapTxHash || null,
            }
            : s
        )
      );
      return false;
    } finally {
      setTxPending(false);
    }
  };

  // -------------------------------------------------------------
  // ACTION: SWAP ETH FOR KAV
  // -------------------------------------------------------------
  const swapEthForKav = async (amountEth: string, slippagePct: string = '0.5') => {
    setTxPending(true);
    setError(null);
    setTxHash(null);

    setLoaderTitle('EXECUTING ETH → KAV SWAP');
    setLoaderSteps([
      {
        stepNumber: 1,
        totalSteps: 1,
        title: `Swap ${amountEth} ETH for KAV`,
        description: 'Awaiting wallet signature for ETH → KAV swap...',
        status: 'pending',
      },
    ]);
    setIsLoaderOpen(true);

    const ethIn = parseEther(amountEth);
    const estOutStr = getSwapQuote(amountEth, false);
    const estOutBig = parseEther(estOutStr);
    const slipBps = BigInt(Math.floor(parseFloat(slippagePct) * 100));
    const minKavOutBig = (estOutBig * (10000n - slipBps)) / 10000n;

    const recordId = addTransactionRecord('SWAP_ETH_KAV', `Swap ${amountEth} ETH for KAV`);

    try {
      const signer = await getEthersSigner();
      const ammContract = new Contract(KAYSWAP_AMM_ADDRESS, KAYSWAP_AMM_ABI, signer);

      const tx = await ammContract.swapETHForKAV(minKavOutBig, { value: ethIn });
      setTxHash(tx.hash);
      updateTransactionRecord(recordId, { hash: tx.hash });

      setLoaderSteps([
        {
          stepNumber: 1,
          totalSteps: 1,
          title: `Swap ${amountEth} ETH for KAV`,
          description: 'Transaction broadcasted to Sepolia! Confirming on-chain...',
          status: 'pending',
          txHash: tx.hash,
        },
      ]);

      await tx.wait();
      updateTransactionRecord(recordId, { status: 'success' });

      setLoaderSteps([
        {
          stepNumber: 1,
          totalSteps: 1,
          title: 'Swap ETH for KAV Completed',
          description: `Successfully swapped ${amountEth} ETH for ~${estOutStr} KAV! KAV deposited to your wallet.`,
          status: 'success',
          txHash: tx.hash,
        },
      ]);

      await refreshData();
      if (onSwapSuccessRef.current) {
        onSwapSuccessRef.current(tx.hash);
      }
      return true;
    } catch (err: any) {
      console.error('Swap ETH->KAV failed:', err);
      const errMsg = formatUserFriendlyError(err);
      setError(errMsg);
      updateTransactionRecord(recordId, { status: 'failed', error: errMsg });

      setLoaderSteps([
        {
          stepNumber: 1,
          totalSteps: 1,
          title: 'Swap Failed',
          description: errMsg,
          status: 'failed',
          error: errMsg,
        },
      ]);
      return false;
    } finally {
      setTxPending(false);
    }
  };

  const addLiquidity = async (amountKav: string, amountEth: string) => {
    setTxPending(true);
    setError(null);
    setTxHash(null);

    let signer;
    let accountAddr = '';
    try {
      signer = await getEthersSigner();
      accountAddr = await signer.getAddress();
    } catch (err: any) {
      const msg = formatUserFriendlyError(err);
      setError(msg);
      setTxPending(false);
      return false;
    }

    const kavContract = new Contract(KAVYA_TOKEN_ADDRESS, KAVYA_TOKEN_ABI, signer);
    const kavBig = parseEther(amountKav);
    const ethBig = parseEther(amountEth);

    let liveAllowance = 0n;
    try {
      liveAllowance = await kavContract.allowance(accountAddr, KAYSWAP_AMM_ADDRESS);
    } catch (e) {
      liveAllowance = parseEther(kavAllowance || '0');
    }

    const needsApprove = liveAllowance < kavBig;
    setLoaderTitle('ADD LIQUIDITY');

    if (needsApprove) {
      setLoaderSteps([
        {
          stepNumber: 1,
          totalSteps: 2,
          title: 'Step 1 of 2: Approve KAV Token',
          description: `Awaiting wallet signature to approve ${amountKav} KAV for KaySwap AMM...`,
          status: 'pending',
        },
        {
          stepNumber: 2,
          totalSteps: 2,
          title: 'Step 2 of 2: Add KAV & ETH Liquidity',
          description: 'Will execute automatically once Step 1 confirmation is complete.',
          status: 'idle',
        },
      ]);
      setIsLoaderOpen(true);

      const approveRecordId = addTransactionRecord('APPROVE', `Approve ${amountKav} KAV (Step 1 of 2)`);
      let approveTxHash = '';

      try {
        const txApprove = await kavContract.approve(KAYSWAP_AMM_ADDRESS, kavBig);
        approveTxHash = txApprove.hash;
        setTxHash(txApprove.hash);
        updateTransactionRecord(approveRecordId, { hash: txApprove.hash });

        setLoaderSteps([
          {
            stepNumber: 1,
            totalSteps: 2,
            title: 'Step 1 of 2: Approve KAV Token',
            description: `Approval broadcasted to Sepolia (${txApprove.hash.slice(0, 10)}...). Confirming block...`,
            status: 'pending',
            txHash: txApprove.hash,
          },
          {
            stepNumber: 2,
            totalSteps: 2,
            title: 'Step 2 of 2: Add KAV & ETH Liquidity',
            description: 'Will execute automatically once Step 1 confirmation is complete.',
            status: 'idle',
          },
        ]);

        await txApprove.wait();
        updateTransactionRecord(approveRecordId, { status: 'success' });

        setLoaderSteps([
          {
            stepNumber: 1,
            totalSteps: 2,
            title: 'Step 1 of 2: KAV Token Approved ✓',
            description: `${amountKav} KAV allowance granted. Proceeding to add liquidity...`,
            status: 'success',
            txHash: txApprove.hash,
          },
          {
            stepNumber: 2,
            totalSteps: 2,
            title: 'Step 2 of 2: Add KAV & ETH Liquidity',
            description: 'Awaiting wallet signature to supply liquidity to pool...',
            status: 'pending',
          },
        ]);

        setKavAllowance(amountKav);
      } catch (approveErr: any) {
        console.error('Step 1 Approve failed:', approveErr);
        const errMsg = formatUserFriendlyError(approveErr);
        setError(errMsg);
        updateTransactionRecord(approveRecordId, { status: 'failed', error: errMsg });

        setLoaderSteps([
          {
            stepNumber: 1,
            totalSteps: 2,
            title: 'Step 1 of 2: Approval Failed',
            description: errMsg,
            status: 'failed',
            error: errMsg,
            txHash: approveTxHash || null,
          },
          {
            stepNumber: 2,
            totalSteps: 2,
            title: 'Step 2 of 2: Add KAV & ETH Liquidity',
            description: 'Cancelled due to approval failure.',
            status: 'idle',
          },
        ]);
        setTxPending(false);
        return false;
      }
    } else {
      setLoaderSteps([
        {
          stepNumber: 1,
          totalSteps: 1,
          title: 'Add KAV + ETH Liquidity',
          description: 'Awaiting wallet signature to supply liquidity to pool...',
          status: 'pending',
        },
      ]);
      setIsLoaderOpen(true);
    }

    const currentStepNum = needsApprove ? 2 : 1;
    const recordId = addTransactionRecord('ADD_LIQUIDITY', `Add Liquidity (${amountKav} KAV + ${amountEth} ETH)`);
    let addTxHash = '';

    try {
      const ammContract = new Contract(KAYSWAP_AMM_ADDRESS, KAYSWAP_AMM_ABI, signer);
      const tx = await ammContract.addLiquidity(kavBig, { value: ethBig });
      addTxHash = tx.hash;
      setTxHash(tx.hash);
      updateTransactionRecord(recordId, { hash: tx.hash });

      setLoaderSteps((prev) =>
        prev.map((s) =>
          s.stepNumber === currentStepNum
            ? {
              ...s,
              status: 'pending',
              title: needsApprove ? 'Step 2 of 2: Add KAV & ETH Liquidity' : 'Add KAV + ETH Liquidity',
              description: `Transaction broadcasted to Sepolia (${tx.hash.slice(0, 10)}...). Confirming on-chain...`,
              txHash: tx.hash,
            }
            : s
        )
      );

      await tx.wait();
      updateTransactionRecord(recordId, { status: 'success' });

      setLoaderSteps((prev) =>
        prev.map((s) =>
          s.stepNumber === currentStepNum
            ? {
              ...s,
              status: 'success',
              title: needsApprove ? 'Step 2 of 2: Liquidity Added Successfully ✓' : 'Liquidity Added Successfully ✓',
              description: `Deposited ${amountKav} KAV & ${amountEth} ETH into KaySwap pool. Minted KAY-LP tokens!`,
              txHash: tx.hash,
            }
            : s
        )
      );

      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Add Liquidity failed:', err);
      const errMsg = formatUserFriendlyError(err);
      setError(errMsg);
      updateTransactionRecord(recordId, { status: 'failed', error: errMsg });

      setLoaderSteps((prev) =>
        prev.map((s) =>
          s.stepNumber === currentStepNum
            ? {
              ...s,
              status: 'failed',
              title: needsApprove ? 'Step 2 of 2: Add Liquidity Failed' : 'Add Liquidity Failed',
              description: errMsg,
              error: errMsg,
              txHash: addTxHash || null,
            }
            : s
        )
      );
      return false;
    } finally {
      setTxPending(false);
    }
  };

  // -------------------------------------------------------------
  // ACTION: CREATE NEW LIQUIDITY POOL
  // -------------------------------------------------------------
  const createPool = async (
    token0Symbol: string,
    token1Symbol: string,
    feeTier: number,
    amountKav: string,
    amountEth: string
  ) => {
    setTxPending(true);
    setError(null);
    setTxHash(null);

    if (!address) {
      setError('Please connect your wallet first.');
      setTxPending(false);
      return false;
    }

    const newPool: PoolItem = {
      id: `pool_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${token0Symbol}/${token1Symbol} Pool`,
      token0Symbol,
      token1Symbol,
      feeTier,
      reserve0: amountKav,
      reserve1: amountEth,
      creator: address.toLowerCase(),
      createdAt: Date.now(),
    };

    // ONLY add and save if on-chain funding transaction succeeds!
    const ok = await addRangePosition('0.0001', '0.001', feeTier, amountKav, amountEth);
    if (ok) {
      setUserCreatedPools((prev) => [newPool, ...prev]);
      addTransactionRecord('CREATE_POOL', `Created ${token0Symbol}/${token1Symbol} Pool (${(feeTier / 10000).toFixed(2)}%)`);
    }
    setTxPending(false);
    return ok;
  };

  // -------------------------------------------------------------
  // ACTION: ADD CONCENTRATED RANGE POSITION
  // -------------------------------------------------------------
  const addRangePosition = async (
    minPrice: string,
    maxPrice: string,
    feeTier: number,
    amountKav: string,
    amountEth: string
  ) => {
    setTxPending(true);
    setError(null);
    setTxHash(null);

    let signer;
    let accountAddr = '';
    try {
      signer = await getEthersSigner();
      accountAddr = await signer.getAddress();
    } catch (err: any) {
      const msg = formatUserFriendlyError(err);
      setError(msg);
      setTxPending(false);
      return false;
    }

    const kavContract = new Contract(KAVYA_TOKEN_ADDRESS, KAVYA_TOKEN_ABI, signer);
    const kavBig = parseEther(amountKav);
    const ethBig = parseEther(amountEth);

    let liveAllowance = 0n;
    try {
      liveAllowance = await kavContract.allowance(accountAddr, KAYSWAP_AMM_ADDRESS);
    } catch (e) {
      liveAllowance = parseEther(kavAllowance || '0');
    }

    const needsApprove = liveAllowance < kavBig;
    setLoaderTitle('CREATE RANGE LIQUIDITY POSITION NFT');

    if (needsApprove) {
      setLoaderSteps([
        {
          stepNumber: 1,
          totalSteps: 2,
          title: 'Step 1 of 2: Approve KAV Token',
          description: `Awaiting signature to approve ${amountKav} KAV for KaySwap AMM...`,
          status: 'pending',
        },
        {
          stepNumber: 2,
          totalSteps: 2,
          title: 'Step 2 of 2: Create Range Liquidity Position',
          description: 'Will execute automatically once Step 1 confirmation is complete.',
          status: 'idle',
        },
      ]);
      setIsLoaderOpen(true);

      const approveRecordId = addTransactionRecord('APPROVE', `Approve ${amountKav} KAV (Step 1 of 2)`);
      let approveTxHash = '';

      try {
        const txApprove = await kavContract.approve(KAYSWAP_AMM_ADDRESS, kavBig);
        approveTxHash = txApprove.hash;
        setTxHash(txApprove.hash);
        updateTransactionRecord(approveRecordId, { hash: txApprove.hash });

        setLoaderSteps([
          {
            stepNumber: 1,
            totalSteps: 2,
            title: 'Step 1 of 2: Approve KAV Token',
            description: `Approval broadcasted to Sepolia (${txApprove.hash.slice(0, 10)}...). Confirming...`,
            status: 'pending',
            txHash: txApprove.hash,
          },
          {
            stepNumber: 2,
            totalSteps: 2,
            title: 'Step 2 of 2: Create Range Liquidity Position',
            description: 'Will execute automatically once Step 1 confirmation is complete.',
            status: 'idle',
          },
        ]);

        await txApprove.wait();
        updateTransactionRecord(approveRecordId, { status: 'success' });

        setLoaderSteps([
          {
            stepNumber: 1,
            totalSteps: 2,
            title: 'Step 1 of 2: KAV Token Approved ✓',
            description: `${amountKav} KAV allowance granted. Proceeding to create position NFT...`,
            status: 'success',
            txHash: txApprove.hash,
          },
          {
            stepNumber: 2,
            totalSteps: 2,
            title: 'Step 2 of 2: Create Range Liquidity Position',
            description: 'Awaiting wallet signature to mint range position NFT...',
            status: 'pending',
          },
        ]);

        setKavAllowance(amountKav);
      } catch (approveErr: any) {
        console.error('Step 1 Approve for Range Position failed:', approveErr);
        const errMsg = formatUserFriendlyError(approveErr);
        setError(errMsg);
        updateTransactionRecord(approveRecordId, { status: 'failed', error: errMsg });

        setLoaderSteps([
          {
            stepNumber: 1,
            totalSteps: 2,
            title: 'Step 1 of 2: Approval Failed',
            description: errMsg,
            status: 'failed',
            error: errMsg,
            txHash: approveTxHash || null,
          },
          {
            stepNumber: 2,
            totalSteps: 2,
            title: 'Step 2 of 2: Create Range Liquidity Position',
            description: 'Cancelled due to approval failure.',
            status: 'idle',
          },
        ]);
        setTxPending(false);
        return false;
      }
    } else {
      setLoaderSteps([
        {
          stepNumber: 1,
          totalSteps: 1,
          title: 'Create Range Liquidity Position',
          description: 'Awaiting signature to lock tokens in price range position...',
          status: 'pending',
        },
      ]);
      setIsLoaderOpen(true);
    }

    const currentStepNum = needsApprove ? 2 : 1;
    const recordId = addTransactionRecord(
      'ADD_RANGE_POSITION',
      `Create Position NFT (${amountKav} KAV + ${amountEth} ETH | Tier ${(feeTier / 10000).toFixed(2)}%)`
    );
    let positionTxHash = '';

    try {
      const ammContract = new Contract(KAYSWAP_AMM_ADDRESS, KAYSWAP_AMM_ABI, signer);

      const minPriceBig = parseEther(minPrice);
      const maxPriceBig = parseEther(maxPrice);

      const tx = await ammContract.addRangePosition(minPriceBig, maxPriceBig, feeTier, kavBig, { value: ethBig });
      positionTxHash = tx.hash;
      setTxHash(tx.hash);
      updateTransactionRecord(recordId, { hash: tx.hash });

      setLoaderSteps((prev) =>
        prev.map((s) =>
          s.stepNumber === currentStepNum
            ? {
              ...s,
              status: 'pending',
              title: needsApprove ? 'Step 2 of 2: Create Range Liquidity Position' : 'Create Range Liquidity Position',
              description: `Transaction broadcasted to Sepolia (${tx.hash.slice(0, 10)}...). Confirming on-chain...`,
              txHash: tx.hash,
            }
            : s
        )
      );

      await tx.wait();
      updateTransactionRecord(recordId, { status: 'success' });

      setLoaderSteps((prev) =>
        prev.map((s) =>
          s.stepNumber === currentStepNum
            ? {
              ...s,
              status: 'success',
              title: needsApprove ? 'Step 2 of 2: Position NFT Created Successfully ✓' : 'Position NFT Created Successfully ✓',
              description: `Created custom concentrated position NFT between ${minPrice} and ${maxPrice} ETH/KAV!`,
              txHash: tx.hash,
            }
            : s
        )
      );

      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Add Position failed:', err);
      const errMsg = formatUserFriendlyError(err);
      setError(errMsg);
      updateTransactionRecord(recordId, { status: 'failed', error: errMsg });

      setLoaderSteps((prev) =>
        prev.map((s) =>
          s.stepNumber === currentStepNum
            ? {
              ...s,
              status: 'failed',
              title: needsApprove ? 'Step 2 of 2: Create Position Failed' : 'Create Position Failed',
              description: errMsg,
              error: errMsg,
              txHash: positionTxHash || null,
            }
            : s
        )
      );
      return false;
    } finally {
      setTxPending(false);
    }
  };

  // -------------------------------------------------------------
  // ACTION: COLLECT ACCUMULATED POOL LP FEES
  // -------------------------------------------------------------
  const collectPoolFees = async () => {
    setTxPending(true);
    setError(null);
    setTxHash(null);

    setLoaderTitle('COLLECTING LP SWAP FEES');
    setLoaderSteps([
      {
        stepNumber: 1,
        totalSteps: 1,
        title: 'Collect Accumulated LP Swap Fees',
        description: 'Awaiting signature to claim earned fee rewards...',
        status: 'pending',
      },
    ]);
    setIsLoaderOpen(true);

    const recordId = addTransactionRecord('COLLECT_FEES', `Collect LP Swap Fees (${pendingFeesKav} KAV + ${pendingFeesEth} ETH)`);
    try {
      const signer = await getEthersSigner();
      const ammContract = new Contract(KAYSWAP_AMM_ADDRESS, KAYSWAP_AMM_ABI, signer);

      const tx = await ammContract.collectFees();
      setTxHash(tx.hash);
      updateTransactionRecord(recordId, { hash: tx.hash });
      await tx.wait();

      updateTransactionRecord(recordId, { status: 'success' });
      setLoaderSteps([
        {
          stepNumber: 1,
          totalSteps: 1,
          title: 'Fees Collected Successfully',
          description: `Successfully collected earned swap fees directly to your wallet!`,
          status: 'success',
          txHash: tx.hash,
        },
      ]);
      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Collect Fees failed:', err);
      const errMsg = formatUserFriendlyError(err);
      setError(errMsg);
      updateTransactionRecord(recordId, { status: 'failed', error: errMsg });
      setLoaderSteps([
        { stepNumber: 1, totalSteps: 1, title: 'Fee Collection Failed', description: errMsg, status: 'failed', error: errMsg },
      ]);
      return false;
    } finally {
      setTxPending(false);
    }
  };

  // -------------------------------------------------------------
  // ACTION: COLLECT POSITION SPECIFIC FEES
  // -------------------------------------------------------------
  const collectPositionFees = async (positionId: number) => {
    setTxPending(true);
    setError(null);
    setTxHash(null);

    setLoaderTitle(`COLLECTING FEES FOR POSITION #${positionId}`);
    setLoaderSteps([
      {
        stepNumber: 1,
        totalSteps: 1,
        title: `Harvest Position #${positionId} Accrued Rewards`,
        description: 'Awaiting transaction signature...',
        status: 'pending',
      },
    ]);
    setIsLoaderOpen(true);

    const recordId = addTransactionRecord('COLLECT_POSITION_FEES', `Collect Position #${positionId} Fees`);
    try {
      const signer = await getEthersSigner();
      const ammContract = new Contract(KAYSWAP_AMM_ADDRESS, KAYSWAP_AMM_ABI, signer);

      const tx = await ammContract.collectPositionFees(positionId);
      setTxHash(tx.hash);
      updateTransactionRecord(recordId, { hash: tx.hash });
      await tx.wait();

      updateTransactionRecord(recordId, { status: 'success' });
      setLoaderSteps([
        {
          stepNumber: 1,
          totalSteps: 1,
          title: 'Position Fees Collected',
          description: `Successfully claimed fees for Position #${positionId}!`,
          status: 'success',
          txHash: tx.hash,
        },
      ]);
      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Position Fee collection failed:', err);
      const errMsg = formatUserFriendlyError(err);
      setError(errMsg);
      updateTransactionRecord(recordId, { status: 'failed', error: errMsg });
      setLoaderSteps([
        { stepNumber: 1, totalSteps: 1, title: 'Fee Collection Failed', description: errMsg, status: 'failed', error: errMsg },
      ]);
      return false;
    } finally {
      setTxPending(false);
    }
  };

  // -------------------------------------------------------------
  // ACTION: REMOVE POSITION NFT (Strictly User Authorization Check)
  // -------------------------------------------------------------
  const removePosition = async (positionId: number) => {
    setTxPending(true);
    setError(null);
    setTxHash(null);

    const pos = userPositions.find((p) => p.id === positionId);
    if (pos && address && pos.owner.toLowerCase() !== address.toLowerCase()) {
      setError('Unauthorized: You can only remove positions created by your wallet.');
      setTxPending(false);
      return false;
    }

    setLoaderTitle(`CLOSING POSITION #${positionId}`);
    setLoaderSteps([
      {
        stepNumber: 1,
        totalSteps: 1,
        title: `Close Position NFT #${positionId}`,
        description: 'Redeeming underlying tokens and accrued fees...',
        status: 'pending',
      },
    ]);
    setIsLoaderOpen(true);

    const recordId = addTransactionRecord('REMOVE_POSITION', `Close Position NFT #${positionId}`);
    try {
      const signer = await getEthersSigner();
      const ammContract = new Contract(KAYSWAP_AMM_ADDRESS, KAYSWAP_AMM_ABI, signer);

      const tx = await ammContract.removePosition(positionId);
      setTxHash(tx.hash);
      updateTransactionRecord(recordId, { hash: tx.hash });
      await tx.wait();

      updateTransactionRecord(recordId, { status: 'success' });
      setLoaderSteps([
        {
          stepNumber: 1,
          totalSteps: 1,
          title: `Position #${positionId} Closed`,
          description: `Redeemed principal tokens & accrued fee rewards to your wallet!`,
          status: 'success',
          txHash: tx.hash,
        },
      ]);
      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Remove Position failed:', err);
      const errMsg = formatUserFriendlyError(err);
      setError(errMsg);
      updateTransactionRecord(recordId, { status: 'failed', error: errMsg });
      setLoaderSteps([
        { stepNumber: 1, totalSteps: 1, title: 'Remove Position Failed', description: errMsg, status: 'failed', error: errMsg },
      ]);
      return false;
    } finally {
      setTxPending(false);
    }
  };

  const removeLiquidity = async (amountLp: string) => {
    setTxPending(true);
    setError(null);
    setTxHash(null);

    setLoaderTitle('REMOVING LIQUIDITY');
    setLoaderSteps([
      {
        stepNumber: 1,
        totalSteps: 1,
        title: `Burn ${amountLp} KAY-LP Tokens`,
        description: 'Redeeming underlying KAV and ETH reserves...',
        status: 'pending',
      },
    ]);
    setIsLoaderOpen(true);

    const recordId = addTransactionRecord('REMOVE_LIQUIDITY', `Remove ${amountLp} LP Tokens Liquidity`);
    try {
      const signer = await getEthersSigner();
      const ammContract = new Contract(KAYSWAP_AMM_ADDRESS, KAYSWAP_AMM_ABI, signer);
      const lpBig = parseEther(amountLp);

      const tx = await ammContract.removeLiquidity(lpBig);
      setTxHash(tx.hash);
      updateTransactionRecord(recordId, { hash: tx.hash });
      await tx.wait();

      updateTransactionRecord(recordId, { status: 'success' });
      setLoaderSteps([
        {
          stepNumber: 1,
          totalSteps: 1,
          title: 'Liquidity Removed',
          description: `Burned ${amountLp} LP tokens and received proportional KAV + ETH reserves.`,
          status: 'success',
          txHash: tx.hash,
        },
      ]);
      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Remove Liquidity failed:', err);
      const errMsg = formatUserFriendlyError(err);
      setError(errMsg);
      updateTransactionRecord(recordId, { status: 'failed', error: errMsg });
      setLoaderSteps([
        { stepNumber: 1, totalSteps: 1, title: 'Remove Liquidity Failed', description: errMsg, status: 'failed', error: errMsg },
      ]);
      return false;
    } finally {
      setTxPending(false);
    }
  };

  const claimFaucet = async () => {
    setTxPending(true);
    setError(null);
    setTxHash(null);
    const recordId = addTransactionRecord('CLAIM_FAUCET', `Claim 1,000 Faucet KAV Tokens`);
    try {
      const signer = await getEthersSigner();
      const kavContract = new Contract(KAVYA_TOKEN_ADDRESS, KAVYA_TOKEN_ABI, signer);
      const tx = await kavContract.claimFaucet();
      setTxHash(tx.hash);
      updateTransactionRecord(recordId, { hash: tx.hash });
      await tx.wait();
      updateTransactionRecord(recordId, { status: 'success' });
      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Faucet claim failed:', err);
      const errMsg = formatUserFriendlyError(err);
      setError(errMsg);
      updateTransactionRecord(recordId, { status: 'failed', error: errMsg });
      return false;
    } finally {
      setTxPending(false);
    }
  };

  const mintTokens = async (recipient: string, amount: string) => {
    setTxPending(true);
    setError(null);
    setTxHash(null);
    const recordId = addTransactionRecord('MINT', `Mint ${amount} KAV to ${recipient.slice(0, 6)}...`);
    try {
      const signer = await getEthersSigner();
      const kavContract = new Contract(KAVYA_TOKEN_ADDRESS, KAVYA_TOKEN_ABI, signer);
      const tx = await kavContract.mint(recipient, parseEther(amount));
      setTxHash(tx.hash);
      updateTransactionRecord(recordId, { hash: tx.hash });
      await tx.wait();
      updateTransactionRecord(recordId, { status: 'success' });
      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Minting failed:', err);
      const errMsg = formatUserFriendlyError(err);
      setError(errMsg);
      updateTransactionRecord(recordId, { status: 'failed', error: errMsg });
      return false;
    } finally {
      setTxPending(false);
    }
  };

  return {
    ethBalance,
    kavBalance,
    lpBalance,
    kavAllowance,
    reserveKav,
    reserveEth,
    rawReserveKav,
    rawReserveEth,
    totalLpSupply,
    kavTotalSupply,
    kavMaxSupply,
    kavOwner,
    pendingFeesKav,
    pendingFeesEth,
    cumulativeFeeKav,
    cumulativeFeeEth,
    totalVolumeKav,
    totalVolumeEth,
    userPositions,
    userCreatedPools,
    graphPoints,
    isLoading,
    txPending,
    txHash,
    error,
    transactions,
    isTxModalOpen,
    setIsTxModalOpen,
    clearTransactions,
    refreshData,
    getSwapQuote,
    calculatePriceImpact,
    approveKav,
    swapKavForEth,
    swapEthForKav,
    addLiquidity,
    removeLiquidity,
    createPool,
    addRangePosition,
    collectPoolFees,
    collectPositionFees,
    removePosition,
    claimFaucet,
    mintTokens,
    isLoaderOpen,
    setIsLoaderOpen,
    loaderTitle,
    loaderSteps,
  };
}
