import React, { useState } from 'react';
import { X, Star, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { FeedbackItem } from '../types/feedback';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    rating: number,
    comment: string,
    category: FeedbackItem['category'],
    swapTxHash?: string,
    isFirstSwap?: boolean
  ) => Promise<boolean> | boolean;
  isFirstSwap?: boolean;
  swapTxHash?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isFirstSwap = false,
  swapTxHash,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [category, setCategory] = useState<FeedbackItem['category']>('Swap');
  const [comment, setComment] = useState<string>('');
  const [submittedSuccess, setSubmittedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit(rating, comment, category, swapTxHash, isFirstSwap);
    if (success) {
      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        setComment('');
        onClose();
      }, 1800);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        className="sharp-card"
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#ffffff',
          position: 'relative',
          padding: '28px',
          border: '4px solid #450C3F',
          boxShadow: '8px 8px 0px #450C3F',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#450C3F',
          }}
        >
          <X size={20} />
        </button>

        {submittedSuccess ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <CheckCircle2 size={54} color="#165823" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.4rem', textTransform: 'uppercase', color: '#165823', margin: '0 0 8px 0' }}>
              THANK YOU FOR YOUR FEEDBACK!
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#555', margin: 0 }}>
              Your feedback has been received and helps improve KaySwap!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ backgroundColor: '#450C3F', color: '#ffffff', padding: '6px' }}>
                <MessageSquare size={20} />
              </div>
              <h2 style={{ fontSize: '1.3rem', textTransform: 'uppercase', margin: 0, letterSpacing: '0.04em' }}>
                {isFirstSwap ? 'FIRST SWAP COMPLETED!' : 'SHARE YOUR FEEDBACK'}
              </h2>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#555', margin: '0 0 20px 0', lineHeight: '1.4' }}>
              {isFirstSwap
                ? 'Congratulations on your first KAV swap! Please take 10 seconds to rate your experience.'
                : 'Help us refine KaySwap AMM by leaving your rating and feedback.'}
            </p>

            {/* Rating Stars */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                YOUR RATING:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                    }}
                  >
                    <Star
                      size={26}
                      fill={star <= rating ? '#450C3F' : 'transparent'}
                      color="#450C3F"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Category Selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                CATEGORY:
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['Swap', 'Liquidity', 'UI/UX', 'General'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat as FeedbackItem['category'])}
                    className="sharp-button-outline"
                    style={{
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      backgroundColor: category === cat ? '#450C3F' : 'transparent',
                      color: category === cat ? '#ffffff' : '#450C3F',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Comments Input */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                YOUR COMMENTS / FEEDBACK:
              </label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us what you liked or what can be improved..."
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #450C3F',
                  fontFamily: 'inherit',
                  fontSize: '0.88rem',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              className="sharp-button-primary"
              style={{ width: '100%', gap: '8px' }}
            >
              <Send size={16} />
              <span>SUBMIT FEEDBACK</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
