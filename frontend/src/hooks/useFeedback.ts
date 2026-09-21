import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { FeedbackItem } from '../types/feedback';

const FEEDBACK_STORAGE_KEY = 'kayswap_feedbacks';

export function useFeedback(kavOwner?: string) {
  const { address } = useAccount();

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [isFirstSwapModalOpen, setIsFirstSwapModalOpen] = useState<boolean>(false);
  const [latestSwapHash, setLatestSwapHash] = useState<string | undefined>(undefined);

  // Check if wallet is contract deployer / owner
  const isDeployer = Boolean(
    address && kavOwner && address.toLowerCase() === kavOwner.toLowerCase()
  );

  // Load stored feedbacks
  const loadFeedbacks = useCallback(() => {
    try {
      const stored = localStorage.getItem(FEEDBACK_STORAGE_KEY);
      if (stored) {
        setFeedbacks(JSON.parse(stored));
      } else {
        const initialDefault: FeedbackItem[] = [
          {
            id: 'sample_1',
            address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
            rating: 5,
            category: 'Swap',
            comment: 'Super fast KAV to ETH swap on Sepolia testnet! Excellent UI layout and instant quote updates.',
            timestamp: Date.now() - 86400000,
          },
        ];
        localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(initialDefault));
        setFeedbacks(initialDefault);
      }
    } catch (e) {
      console.error('Failed to load feedback from storage', e);
    }
  }, []);

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  // Submit feedback
  const submitFeedback = (
    rating: number,
    comment: string,
    category: FeedbackItem['category'] = 'General',
    swapTxHash?: string,
    isFirstSwap: boolean = false
  ): boolean => {
    if (!comment.trim() || rating < 1) return false;

    const newItem: FeedbackItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      address: address || 'Anonymous User',
      rating,
      category,
      comment,
      timestamp: Date.now(),
      swapTxHash,
      isFirstSwapFeedback: isFirstSwap,
    };

    const updated = [newItem, ...feedbacks];
    setFeedbacks(updated);
    try {
      localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(updated));
      if (address && isFirstSwap) {
        localStorage.setItem(`kayswap_feedback_given_${address.toLowerCase()}`, 'true');
      }
    } catch (e) {
      console.error('Failed to save feedback', e);
    }
    return true;
  };

  // Check if first swap feedback modal should be triggered
  const checkFirstSwapTrigger = (txHash?: string) => {
    if (!address) return;
    const keyHasSwapped = `kayswap_has_swapped_${address.toLowerCase()}`;
    const keyGivenFeedback = `kayswap_feedback_given_${address.toLowerCase()}`;

    const alreadySwapped = localStorage.getItem(keyHasSwapped);
    const feedbackGiven = localStorage.getItem(keyGivenFeedback);

    if (!alreadySwapped && !feedbackGiven) {
      localStorage.setItem(keyHasSwapped, 'true');
      setLatestSwapHash(txHash);
      setIsFirstSwapModalOpen(true);
    }
  };

  const clearAllFeedbacks = () => {
    setFeedbacks([]);
    localStorage.removeItem(FEEDBACK_STORAGE_KEY);
  };

  // Compute stats
  const averageRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / feedbacks.length).toFixed(1)
      : '5.0';

  return {
    feedbacks,
    averageRating,
    totalReviews: feedbacks.length,
    submitFeedback,
    isFirstSwapModalOpen,
    setIsFirstSwapModalOpen,
    checkFirstSwapTrigger,
    latestSwapHash,
    isDeployer,
    clearAllFeedbacks,
  };
}
