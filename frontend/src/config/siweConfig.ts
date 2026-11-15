import { SiweMessage } from 'siwe';

export interface SiweSession {
  address: string;
  chainId: number;
  signature: string;
  issuedAt: number;
  expiresAt: number;
}

// In-Memory Session Cache (Zero localStorage)
const sessionCache = new Map<string, SiweSession>();
export const SESSION_DURATION_MS = 15 * 60 * 1000; // 15 Minutes SIWE session expiry

export function getStoredSession(address?: string, chainId?: number): { session: SiweSession | null; wasExpired: boolean } {
  if (!address) return { session: null, wasExpired: false };
  try {
    const session = sessionCache.get(address.toLowerCase());
    if (!session) return { session: null, wasExpired: false };
    if (
      session.address.toLowerCase() === address.toLowerCase() &&
      (!chainId || session.chainId === chainId)
    ) {
      if (Date.now() >= session.expiresAt) {
        sessionCache.delete(address.toLowerCase());
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
  sessionCache.set(session.address.toLowerCase(), session);
}

export function clearSession(address?: string): void {
  if (address) {
    sessionCache.delete(address.toLowerCase());
  } else {
    sessionCache.clear();
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
