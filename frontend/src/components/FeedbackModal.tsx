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
  ) => boolean;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onSubmit(rating, comment, category, swapTxHash, isFirstSwap);
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
      onClick={onClose}
    >
      <div
        className="sharp-card"
        style={{
          width: '100%',
          maxWidth: '500px',
          backgroundColor: '#ffffff',
          padding: '24px',
          boxShadow: '8px 8px 0px #450C3F',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '2px solid #450C3F',
            paddingBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={22} color="#165823" />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {isFirstSwap ? '🎉 FIRST SWAP COMPLETED!' : 'SHARE YOUR FEEDBACK'}
              </h2>
              <span className="mono" style={{ fontSize: '0.75rem', color: '#165823', fontWeight: 700 }}>
                {isFirstSwap ? 'How was your experience trading on KaySwap?' : 'Help us improve KaySwap AMM'}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#450C3F' }}>
            <X size={20} />
          </button>
        </div>

        {submittedSuccess ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <CheckCircle2 size={48} color="#165823" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.3rem', color: '#165823', marginBottom: '8px' }}>THANK YOU FOR YOUR FEEDBACK!</h3>
            <p style={{ fontSize: '0.9rem', color: '#450C3F' }}>
              Your review has been recorded. It helps refine our decentralized liquidity experience.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Rating Stars */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>
                Rating Score
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{
                      background: star <= rating ? '#450C3F' : '#ffffff',
                      color: star <= rating ? '#FCECD8' : '#450C3F',
                      border: '2px solid #450C3F',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 700,
                    }}
                  >
                    <Star size={16} fill={star <= rating ? '#FCECD8' : 'none'} />
                    <span>{star}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>
                Feedback Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FeedbackItem['category'])}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #450C3F',
                  fontFamily: 'var(--font-main)',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  backgroundColor: '#FCECD8',
                  color: '#450C3F',
                }}
              >
                <option value="Swap">Token Swaps & Execution</option>
                <option value="Liquidity">Liquidity Pool & APY</option>
                <option value="UI/UX">Design, UI & Navigation</option>
                <option value="General">General Platform Experience</option>
                <option value="Bug Report">Bug Report / Issue</option>
              </select>
            </div>

            {/* Review Comment Text Area */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase' }}>
                Your Review & Comments
              </label>
              <textarea
                required
                rows={4}
                placeholder="Share your thoughts about KaySwap..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #450C3F',
                  fontFamily: 'var(--font-main)',
                  fontSize: '0.95rem',
                  backgroundColor: '#ffffff',
                  color: '#450C3F',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              type="submit"
              className="sharp-button-secondary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
            >
              <Send size={18} />
              <span>SUBMIT REVIEW</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
