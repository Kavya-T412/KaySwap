import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { FeedbackItem } from '../types/feedback';
import { reviewDB } from '../services/db';

export function useFeedback(kavOwner?: string) {
  const { address } = useAccount();

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [isFirstSwapModalOpen, setIsFirstSwapModalOpen] = useState<boolean>(false);
  const [latestSwapHash, setLatestSwapHash] = useState<string | undefined>(undefined);

  // Check if wallet is contract deployer / owner
  const isDeployer = Boolean(
    address && kavOwner && address.toLowerCase() === kavOwner.toLowerCase()
  );

  // Load stored feedbacks from PostgreSQL database
  const loadFeedbacks = useCallback(async () => {
    try {
      let storedReviews = await reviewDB.getAllReviews();

      if (!storedReviews || storedReviews.length === 0) {
        storedReviews = [
          {
            id: 'sample_1',
            address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
            rating: 5,
            category: 'Swap',
            comment: 'Super fast KAV to ETH swap on Sepolia testnet! Excellent UI layout and instant quote updates.',
            timestamp: Date.now() - 86400000,
          },
        ];
      }
      setFeedbacks(storedReviews);
    } catch (e) {
      console.error('Failed to load feedback from DB', e);
    }
  }, []);

  useEffect(() => {
    loadFeedbacks();
  }, [loadFeedbacks]);

  // Submit feedback into PostgreSQL database
  const submitFeedback = async (
    rating: number,
    comment: string,
    category: FeedbackItem['category'] = 'General',
    swapTxHash?: string,
    isFirstSwap: boolean = false
  ): Promise<boolean> => {
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

    const saved = await reviewDB.saveReview(newItem);
    if (saved) {
      const updated = [newItem, ...feedbacks];
      setFeedbacks(updated);
      return true;
    }
    return false;
  };

  // Check if first swap feedback modal should be triggered
  const checkFirstSwapTrigger = async (txHash?: string) => {
    const userAddr = address || '';
    try {
      const latest = await reviewDB.getAllReviews();
      setFeedbacks(latest);
      const hasReviewed = latest.some(
        (f) =>
          Boolean(userAddr) &&
          Boolean(f.address) &&
          f.address.toLowerCase() === userAddr.toLowerCase() &&
          Boolean(f.isFirstSwapFeedback)
      );

      if (!hasReviewed) {
        setLatestSwapHash(txHash);
        setIsFirstSwapModalOpen(true);
      }
    } catch {
      const hasReviewed = feedbacks.some(
        (f) =>
          Boolean(userAddr) &&
          Boolean(f.address) &&
          f.address.toLowerCase() === userAddr.toLowerCase() &&
          Boolean(f.isFirstSwapFeedback)
      );

      if (!hasReviewed) {
        setLatestSwapHash(txHash);
        setIsFirstSwapModalOpen(true);
      }
    }
  };

  const clearAllFeedbacks = async () => {
    await reviewDB.clearAllReviews();
    setFeedbacks([]);
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
