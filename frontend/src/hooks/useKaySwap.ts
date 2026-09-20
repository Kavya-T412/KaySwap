import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers';
import { KAVYA_TOKEN_ADDRESS, KAYSWAP_AMM_ADDRESS, KAVYA_TOKEN_ABI, KAYSWAP_AMM_ABI } from '../config/contracts';

export interface TransactionItem {
  id: string;
  type: 'SWAP_KAV_ETH' | 'SWAP_ETH_KAV' | 'ADD_LIQUIDITY' | 'REMOVE_LIQUIDITY' | 'CLAIM_FAUCET' | 'APPROVE' | 'MINT';
  summary: string;
  status: 'pending' | 'success' | 'failed';
  hash?: string;
  timestamp: number;
  error?: string;
}

export function useKaySwap() {
  const { address, isConnected } = useAccount();

  const [ethBalance, setEthBalance] = useState<string>('0');
  const [kavBalance, setKavBalance] = useState<string>('0');
  const [lpBalance, setLpBalance] = useState<string>('0');
  const [kavAllowance, setKavAllowance] = useState<string>('0');

  const [reserveKav, setReserveKav] = useState<string>('0');
  const [reserveEth, setReserveEth] = useState<string>('0');
  const [totalLpSupply, setTotalLpSupply] = useState<string>('0');

  const [kavTotalSupply, setKavTotalSupply] = useState<string>('0');
  const [kavMaxSupply, setKavMaxSupply] = useState<string>('1000000');
  const [kavOwner, setKavOwner] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [txPending, setTxPending] = useState<boolean>(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      } catch (e) {
        console.error('Failed to save transaction history', e);
      }
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

  // Helper to get ethers provider/signer
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

  // Quote calculation
  const getSwapQuote = (amountIn: string, isKavIn: boolean): string => {
    if (!amountIn || parseFloat(amountIn) <= 0) return '0';
    try {
      const amtInBig = parseEther(amountIn);
      const resKavBig = parseEther(reserveKav || '0');
      const resEthBig = parseEther(reserveEth || '0');

      if (resKavBig === 0n || resEthBig === 0n) return '0';

      const resIn = isKavIn ? resKavBig : resEthBig;
      const resOut = isKavIn ? resEthBig : resKavBig;

      const amountInWithFee = amtInBig * 997n;
      const numerator = amountInWithFee * resOut;
      const denominator = (resIn * 1000n) + amountInWithFee;
      const outBig = numerator / denominator;

      return formatEther(outBig);
    } catch (e) {
      return '0';
    }
  };

  // Actions
  const approveKav = async (amount: string) => {
    setTxPending(true);
    setError(null);
    setTxHash(null);
    const recordId = addTransactionRecord('APPROVE', `Approve ${amount} KAV`);
    try {
      const signer = await getEthersSigner();
      const kavContract = new Contract(KAVYA_TOKEN_ADDRESS, KAVYA_TOKEN_ABI, signer);
      const tx = await kavContract.approve(KAYSWAP_AMM_ADDRESS, parseEther(amount));
      setTxHash(tx.hash);
      updateTransactionRecord(recordId, { hash: tx.hash });
      await tx.wait();
      updateTransactionRecord(recordId, { status: 'success' });
      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Approve failed:', err);
      const errMsg = err?.reason || err?.message || 'Approval failed';
      setError(errMsg);
      updateTransactionRecord(recordId, { status: 'failed', error: errMsg });
      return false;
    } finally {
      setTxPending(false);
    }
  };

  const swapKavForEth = async (amountKav: string, minEthOut: string) => {
    setTxPending(true);
    setError(null);
    setTxHash(null);
    const recordId = addTransactionRecord('SWAP_KAV_ETH', `Swap ${amountKav} KAV for ~${minEthOut} ETH`);
    try {
      const signer = await getEthersSigner();
      const ammContract = new Contract(KAYSWAP_AMM_ADDRESS, KAYSWAP_AMM_ABI, signer);
      const kavIn = parseEther(amountKav);
      const ethMin = parseEther(minEthOut);

      const tx = await ammContract.swapKAVForETH(kavIn, ethMin);
      setTxHash(tx.hash);
      updateTransactionRecord(recordId, { hash: tx.hash });
      await tx.wait();
      updateTransactionRecord(recordId, { status: 'success' });
      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Swap KAV->ETH failed:', err);
      const errMsg = err?.reason || err?.message || 'Swap failed';
      setError(errMsg);
      updateTransactionRecord(recordId, { status: 'failed', error: errMsg });
      return false;
    } finally {
      setTxPending(false);
    }
  };

  const swapEthForKav = async (amountEth: string, minKavOut: string) => {
    setTxPending(true);
    setError(null);
    setTxHash(null);
    const recordId = addTransactionRecord('SWAP_ETH_KAV', `Swap ${amountEth} ETH for ~${minKavOut} KAV`);
    try {
      const signer = await getEthersSigner();
      const ammContract = new Contract(KAYSWAP_AMM_ADDRESS, KAYSWAP_AMM_ABI, signer);
      const kavMin = parseEther(minKavOut);

      const tx = await ammContract.swapETHForKAV(kavMin, { value: parseEther(amountEth) });
      setTxHash(tx.hash);
      updateTransactionRecord(recordId, { hash: tx.hash });
      await tx.wait();
      updateTransactionRecord(recordId, { status: 'success' });
      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Swap ETH->KAV failed:', err);
      const errMsg = err?.reason || err?.message || 'Swap failed';
      setError(errMsg);
      updateTransactionRecord(recordId, { status: 'failed', error: errMsg });
      return false;
    } finally {
      setTxPending(false);
    }
  };

  const addLiquidity = async (amountKav: string, amountEth: string) => {
    setTxPending(true);
    setError(null);
    setTxHash(null);
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
      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Add Liquidity failed:', err);
      const errMsg = err?.reason || err?.message || 'Add Liquidity failed';
      setError(errMsg);
      updateTransactionRecord(recordId, { status: 'failed', error: errMsg });
      return false;
    } finally {
      setTxPending(false);
    }
  };

  const removeLiquidity = async (amountLp: string) => {
    setTxPending(true);
    setError(null);
    setTxHash(null);
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
      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Remove Liquidity failed:', err);
      const errMsg = err?.reason || err?.message || 'Remove Liquidity failed';
      setError(errMsg);
      updateTransactionRecord(recordId, { status: 'failed', error: errMsg });
      return false;
    } finally {
      setTxPending(false);
    }
  };

  const claimFaucet = async () => {
    setTxPending(true);
    setError(null);
    setTxHash(null);
    const recordId = addTransactionRecord('CLAIM_FAUCET', `Claim 100 Faucet KAV Tokens`);
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
  };
}

