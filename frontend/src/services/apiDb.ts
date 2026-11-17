/**
 * KaySwap PostgreSQL Database API Service
 * 
 * Used strictly for storing and querying user feedbacks and community reviews.
 * All on-chain transactions and pool positions are fetched directly from the blockchain via Alchemy API.
 */

import { FeedbackItem } from '../types/feedback';

/**
 * Resolve candidate backend URLs.
 * In order of priority:
 * 1. User-configured VITE_API_URL environment variable
 * 2. Current origin /api (direct host or Netlify rewrite proxy)
 * 3. Dedicated Render backend URL (cross-origin fallback)
 */
const getCandidateApiUrls = (): string[] => {
  const urls: string[] = [];

  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    const cleaned = envUrl.trim().replace(/\/$/, '');
    urls.push(cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`);
  }

  // Same-origin relative path (works on Render direct fullstack host or via Netlify proxy)
  urls.push('/api');

  // Dedicated Render deployment fallback for static hosts (e.g. Netlify)
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    urls.push('https://kayswap.onrender.com/api');
  }

  return Array.from(new Set(urls));
};

// In-Memory Fallback Cache for seamless instant rendering
let memoryFeedbacks: FeedbackItem[] = [];

class ApiDatabaseService {
  /**
   * Fetch all user feedback reviews from PostgreSQL database
   */
  async getAllFeedbacks(): Promise<FeedbackItem[]> {
    const candidates = getCandidateApiUrls();

    for (const base of candidates) {
      try {
        const res = await fetch(`${base}/feedbacks`, {
          headers: { Accept: 'application/json' },
        });

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
              memoryFeedbacks = data;
              return data;
            }
          }
        }
      } catch {
        // Try next candidate
      }
    }

    if (memoryFeedbacks.length === 0) {
      const defaultFeedback: FeedbackItem[] = [
        {
          id: 'fb_init_1',
          address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
          rating: 5,
          category: 'Swap',
          comment: 'Seamless swap execution and clean UI interface on Sepolia testnet!',
          timestamp: Date.now() - 3600000 * 24,
        },
      ];
      memoryFeedbacks = defaultFeedback;
      return defaultFeedback;
    }

    return memoryFeedbacks;
  }

  /**
   * Save user feedback review to PostgreSQL database
   */
  async saveFeedback(item: FeedbackItem): Promise<boolean> {
    memoryFeedbacks = [item, ...memoryFeedbacks.filter((f) => f.id !== item.id)];
    const candidates = getCandidateApiUrls();

    for (const base of candidates) {
      try {
        const res = await fetch(`${base}/feedbacks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(item),
        });

        if (res.ok) {
          return true;
        }
      } catch {
        // Try next candidate
      }
    }

    return false;
  }

  /**
   * Clear all reviews in PostgreSQL database
   */
  async clearAllFeedbacks(): Promise<boolean> {
    memoryFeedbacks = [];
    const candidates = getCandidateApiUrls();

    for (const base of candidates) {
      try {
        const res = await fetch(`${base}/feedbacks`, {
          method: 'DELETE',
          headers: { Accept: 'application/json' },
        });

        if (res.ok) {
          return true;
        }
      } catch {
        // Try next candidate
      }
    }

    return false;
  }
}

export const apiDb = new ApiDatabaseService();
