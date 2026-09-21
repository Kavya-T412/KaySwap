import React from 'react';
import { X, ShieldCheck, Lock, Star, ExternalLink, Download, Trash2 } from 'lucide-react';
import { FeedbackItem } from '../types/feedback';

interface AdminFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedbacks: FeedbackItem[];
  isDeployer: boolean;
  onClearLogs: () => void;
}

export const AdminFeedbackModal: React.FC<AdminFeedbackModalProps> = ({
  isOpen,
  onClose,
  feedbacks,
  isDeployer,
  onClearLogs,
}) => {
  if (!isOpen) return null;

  const exportLogsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(feedbacks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kayswap_feedback_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(5px)',
        zIndex: 1300,
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
          maxWidth: '720px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          padding: '24px',
          boxShadow: '10px 10px 0px #450C3F',
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
            <ShieldCheck size={24} color="#165823" />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                CONTRACT DEPLOYER AUDIT LOGS
              </h2>
              <span className="mono" style={{ fontSize: '0.75rem', color: '#165823', fontWeight: 700 }}>
                {isDeployer ? 'Verified Contract Deployer Console' : 'Access Restricted'}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#450C3F' }}>
            <X size={20} />
          </button>
        </div>

        {!isDeployer ? (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <div
              style={{
                backgroundColor: '#c5221f',
                color: '#ffffff',
                width: '56px',
                height: '56px',
                margin: '0 auto 16px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={28} />
            </div>

            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', textTransform: 'uppercase', color: '#c5221f' }}>
              ACCESS RESTRICTED TO CONTRACT DEPLOYER
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#555', maxWidth: '400px', margin: '0 auto' }}>
              User feedback review logs are stored privately and can only be accessed by the contract deployer address.
            </p>
          </div>
        ) : (
          /* Contract Deployer Audit Logs Console */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Top Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#165823' }}>
                TOTAL AUDITED REVIEWS: {feedbacks.length}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="sharp-button-outline"
                  onClick={exportLogsJson}
                  style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={14} />
                  <span>EXPORT LOGS JSON</span>
                </button>

                <button
                  className="sharp-button-outline"
                  onClick={onClearLogs}
                  style={{ fontSize: '0.75rem', padding: '6px 12px', color: '#c5221f', borderColor: '#c5221f', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={14} />
                  <span>CLEAR LOGS</span>
                </button>
              </div>
            </div>

            {/* Scrollable Logs List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
              {feedbacks.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                  No feedback reviews recorded yet.
                </div>
              ) : (
                feedbacks.map((fb) => (
                  <div
                    key={fb.id}
                    style={{
                      border: '2px solid #450C3F',
                      padding: '16px',
                      backgroundColor: '#ffffff',
                      boxShadow: '3px 3px 0px #450C3F',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="sharp-badge sharp-badge-plum">{fb.category}</span>
                        {fb.isFirstSwapFeedback && (
                          <span className="sharp-badge sharp-badge-green">POST-FIRST SWAP</span>
                        )}
                        <span className="mono" style={{ fontSize: '0.75rem', color: '#666' }}>
                          {new Date(fb.timestamp).toLocaleString()}
                        </span>
                      </div>

                      {/* Stars */}
                      <div style={{ display: 'flex', gap: '2px', color: '#450C3F' }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < fb.rating ? '#450C3F' : 'none'}
                            stroke="#450C3F"
                          />
                        ))}
                      </div>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: '#111', margin: '8px 0', lineHeight: '1.4', fontWeight: 500 }}>
                      "{fb.comment}"
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#666', marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #eee' }}>
                      <span className="mono">
                        User: <strong>{fb.address}</strong>
                      </span>

                      {fb.swapTxHash && (
                        <a
                          href={`https://sepolia.etherscan.io/tx/${fb.swapTxHash}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#165823', textDecoration: 'none', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                        >
                          Tx Log <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
