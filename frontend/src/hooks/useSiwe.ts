import { useState, useEffect, useCallback } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { BrowserProvider } from 'ethers';
import {
  getStoredSession,
  saveSession,
  clearSession,
  createSiweMessage,
  SESSION_DURATION_MS,
  SiweSession
} from '../config/siweConfig';

export function useSiwe() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const [session, setSession] = useState<SiweSession | null>(null);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load session state on address/chainId change
  useEffect(() => {
    if (isConnected && address) {
      const { session: stored, wasExpired } = getStoredSession(address, chainId);
      if (stored) {
        setSession(stored);
        setIsSessionExpired(false);
      } else {
        setSession(null);
        setIsSessionExpired(wasExpired);
      }
    } else {
      setSession(null);
      setIsSessionExpired(false);
    }
  }, [address, chainId, isConnected]);

  // Expiration timer check (15 minutes)
  useEffect(() => {
    if (!session) return;

    const checkExpiration = () => {
      const remainingMs = session.expiresAt - Date.now();
      if (remainingMs <= 0) {
        clearSession(session.address);
        setSession(null);
        setIsSessionExpired(true);
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 2000);
    return () => clearInterval(interval);
  }, [session]);

  // Sign SIWE Message
  const signIn = useCallback(async () => {
    if (!address || !isConnected) return;
    setIsSigning(true);
    setError(null);

    try {
      if (!window.ethereum) {
        throw new Error('No Web3 wallet provider found');
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const siweMsg = createSiweMessage(address, chainId || 11155111);
      const preparedMessage = siweMsg.prepareMessage();

      const signature = await signer.signMessage(preparedMessage);

      const newSession: SiweSession = {
        address,
        chainId: chainId || 11155111,
        signature,
        issuedAt: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION_MS,
      };

      saveSession(newSession);
      setSession(newSession);
      setIsSessionExpired(false);
    } catch (err: any) {
      console.error('SIWE Signing error', err);
      setError(err?.message || 'SIWE Signature rejected or failed');
    } finally {
      setIsSigning(false);
    }
  }, [address, isConnected, chainId]);

  const signOut = useCallback(() => {
    if (address) clearSession(address);
    setSession(null);
    setIsSessionExpired(false);
  }, [address]);

  const isAuthenticated = Boolean(session && Date.now() < session.expiresAt);

  return {
    session,
    isAuthenticated,
    isSessionExpired,
    isSigning,
    error,
    signIn,
    signOut,
  };
}
