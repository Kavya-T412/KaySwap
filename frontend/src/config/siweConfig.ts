import { SiweMessage } from 'siwe';

export interface SiweSession {
  address: string;
  chainId: number;
  signature: string;
  issuedAt: number;
  expiresAt: number;
}

const STORAGE_KEY = 'kayswap_siwe_session';
export const SESSION_DURATION_MS = 15 * 60 * 1000; // 15 Minutes SIWE session expiry

export function getStoredSession(address?: string, chainId?: number): { session: SiweSession | null; wasExpired: boolean } {
  if (!address) return { session: null, wasExpired: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY + '_' + address.toLowerCase());
    if (!raw) return { session: null, wasExpired: false };
    const session: SiweSession = JSON.parse(raw);
    if (
      session.address.toLowerCase() === address.toLowerCase() &&
      (!chainId || session.chainId === chainId)
    ) {
      if (Date.now() >= session.expiresAt) {
        return { session: null, wasExpired: true };
      }
      return { session, wasExpired: false };
    }
  } catch (err) {
    console.error('Failed to parse SIWE session', err);
  }
  return { session: null, wasExpired: false };
}

export function saveSession(session: SiweSession): void {
  localStorage.setItem(STORAGE_KEY + '_' + session.address.toLowerCase(), JSON.stringify(session));
}

export function clearSession(address?: string): void {
  if (address) {
    localStorage.removeItem(STORAGE_KEY + '_' + address.toLowerCase());
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function createSiweMessage(address: string, chainId: number): SiweMessage {
  const domain = window.location.host;
  const origin = window.location.origin;
  const statement = 'Welcome to KaySwap! Sign in with Ethereum to authenticate your Sepolia trading session.';
  const issuedAt = new Date();
  const expirationTime = new Date(issuedAt.getTime() + SESSION_DURATION_MS);

  return new SiweMessage({
    domain,
    address,
    statement,
    uri: origin,
    version: '1',
    chainId,
    expirationTime: expirationTime.toISOString(),
  });
}
