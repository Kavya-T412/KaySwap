import { FeedbackItem } from '../types/feedback';
import { apiDb } from './apiDb';

/**
 * KaySwap Review Database Service
 * 
 * Replaces browser localStorage and IndexedDB with PostgreSQL.
 * Fetches and saves all reviews directly via the PostgreSQL API service.
 */
export class ReviewDatabase {
  /**
   * Fetch all user reviews from PostgreSQL database
   */
  async getAllReviews(): Promise<FeedbackItem[]> {
    return await apiDb.getAllFeedbacks();
  }

  /**
   * Save user review to PostgreSQL database
   */
  async saveReview(item: FeedbackItem): Promise<boolean> {
    return await apiDb.saveFeedback(item);
  }

  /**
   * Clear all reviews in PostgreSQL database
   */
  async clearAllReviews(): Promise<boolean> {
    return await apiDb.clearAllFeedbacks();
  }
}

export const reviewDB = new ReviewDatabase();
