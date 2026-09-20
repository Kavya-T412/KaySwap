import React from 'react';
import { X, ExternalLink, CheckCircle2, Clock, AlertCircle, Trash2, History } from 'lucide-react';
import { TransactionItem } from '../hooks/useKaySwap';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: TransactionItem[];
  onClearHistory: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
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
        zIndex: 1000,
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
          maxWidth: '540px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
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
            <History size={22} color="#165823" />
            <h2 style={{ margin: 0, fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              TRANSACTION HISTORY
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#450C3F',
              padding: '4px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body / Transaction List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
          {transactions.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 16px',
                color: '#666',
                fontStyle: 'italic',
                fontSize: '0.9rem',
              }}
            >
              No transactions recorded yet. Executed swaps, liquidity actions, and claims will appear here.
            </div>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                style={{
                  border: '1px solid #450C3F',
                  padding: '12px 16px',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#450C3F' }}>
                    {tx.summary}
                  </div>
                  {/* Status Badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      textTransform: 'uppercase',
                      backgroundColor:
                        tx.status === 'success'
                          ? '#e6f4ea'
                          : tx.status === 'pending'
                          ? '#fef7e0'
                          : '#fce8e6',
                      color:
                        tx.status === 'success'
                          ? '#165823'
                          : tx.status === 'pending'
                          ? '#b06000'
                          : '#c5221f',
                      border: `1px solid ${
                        tx.status === 'success'
                          ? '#165823'
                          : tx.status === 'pending'
                          ? '#b06000'
                          : '#c5221f'
                      }`,
                    }}
                  >
                    {tx.status === 'success' && <CheckCircle2 size={12} />}
                    {tx.status === 'pending' && <Clock size={12} className="spin" />}
                    {tx.status === 'failed' && <AlertCircle size={12} />}
                    <span>{tx.status}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#666' }}>
                  <span>{formatDate(tx.timestamp)}</span>
                  {tx.hash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: '#165823',
                        textDecoration: 'none',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      View on Etherscan <ExternalLink size={10} />
                    </a>
                  )}
                </div>

                {tx.error && (
                  <div style={{ fontSize: '0.75rem', color: '#c5221f', marginTop: '2px', wordBreak: 'break-word' }}>
                    Error: {tx.error}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        {transactions.length > 0 && (
          <div
            style={{
              marginTop: '16px',
              paddingTop: '12px',
              borderTop: '1px solid #ddd',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button
              className="sharp-button-outline"
              onClick={onClearHistory}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                padding: '6px 12px',
                color: '#c5221f',
                borderColor: '#c5221f',
              }}
            >
              <Trash2 size={14} />
              <span>CLEAR HISTORY</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
