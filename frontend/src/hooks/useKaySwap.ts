import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers';
import { KAVYA_TOKEN_ADDRESS, KAYSWAP_AMM_ADDRESS, KAVYA_TOKEN_ABI, KAYSWAP_AMM_ABI } from '../config/contracts';
import { LoaderStep } from '../components/LoaderCard';

export interface TransactionItem {
  id: string;
  type: 'SWAP_KAV_ETH' | 'SWAP_ETH_KAV' | 'ADD_LIQUIDITY' | 'REMOVE_LIQUIDITY' | 'CLAIM_FAUCET' | 'APPROVE' | 'MINT';
  summary: string;
  status: 'pending' | 'success' | 'failed';
  hash?: string;
  timestamp: number;
  error?: string;
}

export function useKaySwap(onSwapSuccess?: (txHash?: string) => void) {
  const { address, isConnected } = useAccount();

  const [ethBalance, setEthBalance] = useState<string>('0');
  const [kavBalance, setKavBalance] = useState<string>('0');
  const [lpBalance, setLpBalance] = useState<string>('0');
  const [kavAllowance, setKavAllowance] = useState<string>('0');

  const [reserveKav, setReserveKav] = useState<string>('0');
  const [reserveEth, setReserveEth] = useState<string>('0');
  const [rawReserveKav, setRawReserveKav] = useState<bigint>(0n);
  const [rawReserveEth, setRawReserveEth] = useState<bigint>(0n);
  const [totalLpSupply, setTotalLpSupply] = useState<string>('0');

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

  // Load transactions from localStorage for connected wallet
  useEffect(() => {
    if (address) {
      try {
        const stored = localStorage.getItem(`kayswap_txs_${address.toLowerCase()}`);
        if (stored) {
          setTransactions(JSON.parse(stored));
        } else {
          setTransactions([]);
        }
      } catch (e) {
        console.error('Failed to load transaction history', e);
      }
    } else {
      setTransactions([]);
    }
  }, [address]);

  // Helper to persist transaction history
  const saveTransactions = (txs: TransactionItem[]) => {
    setTransactions(txs);
    if (address) {
      try {
        localStorage.setItem(`kayswap_txs_${address.toLowerCase()}`, JSON.stringify(txs));
      } catch (e) {}
    }
  };

  const addTransactionRecord = (type: TransactionItem['type'], summary: string): string => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTx: TransactionItem = {
      id,
      type,
      summary,
      status: 'pending',
      timestamp: Date.now(),
    };
    saveTransactions([newTx, ...transactions]);
    return id;
  };

  const updateTransactionRecord = (id: string, updates: Partial<TransactionItem>) => {
    setTransactions((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      if (address) {
        try {
          localStorage.setItem(`kayswap_txs_${address.toLowerCase()}`, JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
  };

  const clearTransactions = () => {
    saveTransactions([]);
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

  // Fetch balances & contract reserves
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

      // Fetch Reserves
      const [rKav, rEth] = await ammContract.getReserves().catch(() => [0n, 0n]);
      setRawReserveKav(rKav);
      setRawReserveEth(rEth);
      setReserveKav(formatEther(rKav));
      setReserveEth(formatEther(rEth));

      const totalLp = await ammContract.totalSupply().catch(() => 0n);
      setTotalLpSupply(formatEther(totalLp));

      // Fetch user specific balances
      if (address) {
        const [ethBalRaw, kavBalRaw, lpBalRaw, allowRaw] = await Promise.all([
          provider.getBalance(address).catch(() => 0n),
          kavContract.balanceOf(address).catch(() => 0n),
          ammContract.balanceOf(address).catch(() => 0n),
          kavContract.allowance(address, KAYSWAP_AMM_ADDRESS).catch(() => 0n),
        ]);

        setEthBalance(formatEther(ethBalRaw));
        setKavBalance(formatEther(kavBalRaw));
        setLpBalance(formatEther(lpBalRaw));
        setKavAllowance(formatEther(allowRaw));
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
      const denominator = (resIn * 1000n) + amountInWithFee;
      const outBig = numerator / denominator;

      return formatEther(outBig);
    } catch (e) {
      return '0';
    }
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
      const errMsg = err?.reason || err?.message || 'Approval failed';
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
  // ACTION: SWAP KAV FOR ETH (With exact BigInt precision & loader)
  // -------------------------------------------------------------
  const swapKavForEth = async (amountKav: string, slippagePct: string = '0.5') => {
    setTxPending(true);
    setError(null);
    setTxHash(null);

    const needsApprove = parseFloat(kavAllowance) < parseFloat(amountKav);
    const totalSteps = needsApprove ? 2 : 1;

    setLoaderTitle('EXECUTING KAV → ETH SWAP');
    const initialSteps: LoaderStep[] = [];
    if (needsApprove) {
      initialSteps.push({
        stepNumber: 1,
        totalSteps: 2,
        title: 'Step 1: Approve KAV Token',
        description: 'Allow KaySwap AMM contract to access your KAV tokens...',
        status: 'pending',
      });
      initialSteps.push({
        stepNumber: 2,
        totalSteps: 2,
        title: 'Step 2: Swap KAV for ETH',
        description: 'Execute instant constant-product AMM swap...',
        status: 'idle',
      });
    } else {
      initialSteps.push({
        stepNumber: 1,
        totalSteps: 1,
        title: 'Swap KAV for ETH',
        description: 'Awaiting wallet signature to send KAV and receive ETH...',
        status: 'pending',
      });
    }
    setLoaderSteps(initialSteps);
    setIsLoaderOpen(true);

    let approveSuccess = true;
    if (needsApprove) {
      approveSuccess = await approveKav(amountKav, false);
      if (!approveSuccess) {
        setLoaderSteps([
          {
            stepNumber: 1,
            totalSteps: 2,
            title: 'Step 1: KAV Approval Failed',
            description: 'Approval rejected or failed in wallet.',
            status: 'failed',
          },
          {
            stepNumber: 2,
            totalSteps: 2,
            title: 'Step 2: Swap KAV for ETH',
            description: 'Cancelled due to approval failure.',
            status: 'idle',
          },
        ]);
        setTxPending(false);
        return false;
      }

      setLoaderSteps([
        {
          stepNumber: 1,
          totalSteps: 2,
          title: 'Step 1: KAV Approved',
          description: 'Allowance verified.',
          status: 'success',
        },
        {
          stepNumber: 2,
          totalSteps: 2,
          title: 'Step 2: Swap KAV for ETH',
          description: 'Awaiting wallet signature for KAV → ETH swap...',
          status: 'pending',
        },
      ]);
    }

    // Exact BigInt calculation for minEthOut
    const kavIn = parseEther(amountKav);
    const estOutStr = getSwapQuote(amountKav, true);
    const estOutBig = parseEther(estOutStr);
    const slipBps = BigInt(Math.floor(parseFloat(slippagePct) * 100));
    const minEthOutBig = (estOutBig * (10000n - slipBps)) / 10000n;

    const recordId = addTransactionRecord('SWAP_KAV_ETH', `Swap ${amountKav} KAV for ETH`);

    try {
      const signer = await getEthersSigner();
      const ammContract = new Contract(KAYSWAP_AMM_ADDRESS, KAYSWAP_AMM_ABI, signer);

      const tx = await ammContract.swapKAVForETH(kavIn, minEthOutBig);
      setTxHash(tx.hash);
      updateTransactionRecord(recordId, { hash: tx.hash });

      const currentStepNum = needsApprove ? 2 : 1;
      setLoaderSteps((prev) =>
        prev.map((s) =>
          s.stepNumber === currentStepNum
            ? {
                ...s,
                description: 'Swap tx broadcasted to Sepolia! Confirming on-chain...',
                status: 'pending',
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
                title: needsApprove ? 'Step 2: Swap Completed' : 'Swap KAV for ETH Completed',
                description: `Successfully swapped ${amountKav} KAV for ~${estOutStr} ETH! ETH delivered directly to your wallet.`,
                status: 'success',
                txHash: tx.hash,
              }
            : s
        )
      );

      await refreshData();
      if (onSwapSuccess) {
        onSwapSuccess(tx.hash);
      }
      return true;
    } catch (err: any) {
      console.error('Swap KAV->ETH failed:', err);
      const errMsg = err?.reason || err?.message || 'Swap failed';
      setError(errMsg);
      updateTransactionRecord(recordId, { status: 'failed', error: errMsg });

      const currentStepNum = needsApprove ? 2 : 1;
      setLoaderSteps((prev) =>
        prev.map((s) =>
          s.stepNumber === currentStepNum
            ? {
                ...s,
                title: 'Swap Failed',
                description: errMsg,
                status: 'failed',
                error: errMsg,
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
  // ACTION: SWAP ETH FOR KAV (With loader)
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
      if (onSwapSuccess) {
        onSwapSuccess(tx.hash);
      }
      return true;
    } catch (err: any) {
      console.error('Swap ETH->KAV failed:', err);
      const errMsg = err?.reason || err?.message || 'Swap failed';
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

    const needsApprove = parseFloat(kavAllowance) < parseFloat(amountKav);
    setLoaderTitle('ADDING LIQUIDITY TO POOL');
    setLoaderSteps([
      {
        stepNumber: 1,
        totalSteps: needsApprove ? 2 : 1,
        title: needsApprove ? 'Step 1: Approve KAV Token' : 'Add KAV + ETH Liquidity',
        description: 'Awaiting transaction signature...',
        status: 'pending',
      },
    ]);
    setIsLoaderOpen(true);

    if (needsApprove) {
      const appOk = await approveKav(amountKav, false);
      if (!appOk) {
        setLoaderSteps([
          { stepNumber: 1, totalSteps: 2, title: 'KAV Approval Failed', description: 'Cancelled.', status: 'failed' },
        ]);
        setTxPending(false);
        return false;
      }
    }

    const recordId = addTransactionRecord('ADD_LIQUIDITY', `Add Liquidity (${amountKav} KAV + ${amountEth} ETH)`);
    try {
      const signer = await getEthersSigner();
      const ammContract = new Contract(KAYSWAP_AMM_ADDRESS, KAYSWAP_AMM_ABI, signer);
      const kavBig = parseEther(amountKav);
      const ethBig = parseEther(amountEth);

      const tx = await ammContract.addLiquidity(kavBig, { value: ethBig });
      setTxHash(tx.hash);
      updateTransactionRecord(recordId, { hash: tx.hash });
      await tx.wait();

      updateTransactionRecord(recordId, { status: 'success' });
      setLoaderSteps([
        {
          stepNumber: 1,
          totalSteps: 1,
          title: 'Liquidity Added Successfully',
          description: `Deposited ${amountKav} KAV & ${amountEth} ETH into KaySwap pool. Minted KAY-LP tokens!`,
          status: 'success',
          txHash: tx.hash,
        },
      ]);
      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Add Liquidity failed:', err);
      const errMsg = err?.reason || err?.message || 'Add Liquidity failed';
      setError(errMsg);
      updateTransactionRecord(recordId, { status: 'failed', error: errMsg });
      setLoaderSteps([
        { stepNumber: 1, totalSteps: 1, title: 'Add Liquidity Failed', description: errMsg, status: 'failed', error: errMsg },
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
      const errMsg = err?.reason || err?.message || 'Remove Liquidity failed';
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
      const errMsg = err?.reason || err?.message || 'Faucet claim failed';
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
      const errMsg = err?.reason || err?.message || 'Minting failed';
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
    approveKav,
    swapKavForEth,
    swapEthForKav,
    addLiquidity,
    removeLiquidity,
    claimFaucet,
    mintTokens,
    isLoaderOpen,
    setIsLoaderOpen,
    loaderTitle,
    loaderSteps,
  };
}
