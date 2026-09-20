import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { BrowserProvider, Contract, formatEther, parseEther } from 'ethers';
import { KAVYA_TOKEN_ADDRESS, KAYSWAP_AMM_ADDRESS, KAVYA_TOKEN_ABI, KAYSWAP_AMM_ABI } from '../config/contracts';

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
    try {
      const signer = await getEthersSigner();
      const kavContract = new Contract(KAVYA_TOKEN_ADDRESS, KAVYA_TOKEN_ABI, signer);
      const tx = await kavContract.approve(KAYSWAP_AMM_ADDRESS, parseEther(amount));
      setTxHash(tx.hash);
      await tx.wait();
      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Approve failed:', err);
      setError(err?.reason || err?.message || 'Approval failed');
      return false;
    } finally {
      setTxPending(false);
    }
  };

  const swapKavForEth = async (amountKav: string, minEthOut: string) => {
    setTxPending(true);
    setError(null);
    setTxHash(null);
    try {
      const signer = await getEthersSigner();
      const ammContract = new Contract(KAYSWAP_AMM_ADDRESS, KAYSWAP_AMM_ABI, signer);
      const kavIn = parseEther(amountKav);
      const ethMin = parseEther(minEthOut);

      const tx = await ammContract.swapKAVForETH(kavIn, ethMin);
      setTxHash(tx.hash);
      await tx.wait();
      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Swap KAV->ETH failed:', err);
      setError(err?.reason || err?.message || 'Swap failed');
      return false;
    } finally {
      setTxPending(false);
    }
  };

  const swapEthForKav = async (amountEth: string, minKavOut: string) => {
    setTxPending(true);
    setError(null);
    setTxHash(null);
    try {
      const signer = await getEthersSigner();
      const ammContract = new Contract(KAYSWAP_AMM_ADDRESS, KAYSWAP_AMM_ABI, signer);
      const kavMin = parseEther(minKavOut);

      const tx = await ammContract.swapETHForKAV(kavMin, { value: parseEther(amountEth) });
      setTxHash(tx.hash);
      await tx.wait();
      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Swap ETH->KAV failed:', err);
      setError(err?.reason || err?.message || 'Swap failed');
      return false;
    } finally {
      setTxPending(false);
    }
  };

  const addLiquidity = async (amountKav: string, amountEth: string) => {
    setTxPending(true);
    setError(null);
    setTxHash(null);
    try {
      const signer = await getEthersSigner();
      const ammContract = new Contract(KAYSWAP_AMM_ADDRESS, KAYSWAP_AMM_ABI, signer);
      const kavBig = parseEther(amountKav);
      const ethBig = parseEther(amountEth);

      const tx = await ammContract.addLiquidity(kavBig, { value: ethBig });
      setTxHash(tx.hash);
      await tx.wait();
      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Add Liquidity failed:', err);
      setError(err?.reason || err?.message || 'Add Liquidity failed');
      return false;
    } finally {
      setTxPending(false);
    }
  };

  const removeLiquidity = async (amountLp: string) => {
    setTxPending(true);
    setError(null);
    setTxHash(null);
    try {
      const signer = await getEthersSigner();
      const ammContract = new Contract(KAYSWAP_AMM_ADDRESS, KAYSWAP_AMM_ABI, signer);
      const lpBig = parseEther(amountLp);

      const tx = await ammContract.removeLiquidity(lpBig);
      setTxHash(tx.hash);
      await tx.wait();
      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Remove Liquidity failed:', err);
      setError(err?.reason || err?.message || 'Remove Liquidity failed');
      return false;
    } finally {
      setTxPending(false);
    }
  };

  const claimFaucet = async () => {
    setTxPending(true);
    setError(null);
    setTxHash(null);
    try {
      const signer = await getEthersSigner();
      const kavContract = new Contract(KAVYA_TOKEN_ADDRESS, KAVYA_TOKEN_ABI, signer);
      const tx = await kavContract.claimFaucet();
      setTxHash(tx.hash);
      await tx.wait();
      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Faucet claim failed:', err);
      setError(err?.reason || err?.message || 'Faucet claim failed');
      return false;
    } finally {
      setTxPending(false);
    }
  };

  const mintTokens = async (recipient: string, amount: string) => {
    setTxPending(true);
    setError(null);
    setTxHash(null);
    try {
      const signer = await getEthersSigner();
      const kavContract = new Contract(KAVYA_TOKEN_ADDRESS, KAVYA_TOKEN_ABI, signer);
      const tx = await kavContract.mint(recipient, parseEther(amount));
      setTxHash(tx.hash);
      await tx.wait();
      await refreshData();
      return true;
    } catch (err: any) {
      console.error('Minting failed:', err);
      setError(err?.reason || err?.message || 'Minting failed');
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
