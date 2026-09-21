export interface FeedbackItem {
  id: string;
  address: string;
  rating: number; // 1 to 5 stars
  category: 'General' | 'Swap' | 'Liquidity' | 'UI/UX' | 'Bug Report';
  comment: string;
  timestamp: number;
  swapTxHash?: string;
  isFirstSwapFeedback?: boolean;
}
