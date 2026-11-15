import React, { useState } from 'react';
import { X, ShieldCheck, Lock, Star, ExternalLink, Download, Trash2, Award, Check, RefreshCw } from 'lucide-react';
import { BrowserProvider, Contract } from 'ethers';
import { FeedbackItem } from '../types/feedback';
import { KAYSWAP_LP_NFT_ADDRESS, KAYSWAP_LP_NFT_ABI } from '../config/contracts';

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
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authStatus, setAuthStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEnablePublicMint = async () => {
    setIsAuthorizing(true);
    setAuthStatus(null);
    try {
      const ethereum =
        (window as any).ethereum?.providers?.find((p: any) => p.isMetaMask) ||
        (window as any).ethereum;
      if (!ethereum) throw new Error('No Web3 wallet detected');
      const provider = new BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const nft = new Contract(KAYSWAP_LP_NFT_ADDRESS, KAYSWAP_LP_NFT_ABI, signer);
      const tx = await nft.setAmmContract('0x0000000000000000000000000000000000000000');
      setAuthStatus('Transaction broadcasted. Confirming block...');
      await tx.wait();
      setAuthStatus('Public LP Certificate Minting Enabled on Sepolia ✓');
    } catch (err: any) {
      setAuthStatus(err?.message || 'Failed to authorize public minting');
    } finally {
      setIsAuthorizing(false);
    }
  };

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
                COMMUNITY FEEDBACK & REVIEWS
              </h2>
              <span className="mono" style={{ fontSize: '0.75rem', color: '#165823', fontWeight: 700 }}>
                {isDeployer ? 'Verified Project Administrator' : 'Access Restricted'}
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
              ACCESS RESTRICTED
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#555', maxWidth: '400px', margin: '0 auto' }}>
              User feedback and reviews are kept private and accessible only to authorized administrators.
            </p>
          </div>
        ) : (
          /* Contract Deployer Audit Logs Console */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Top Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#165823' }}>
                TOTAL REVIEWS: {feedbacks.length}
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className="sharp-button-outline"
                  onClick={handleEnablePublicMint}
                  disabled={isAuthorizing}
                  title="Permit all liquidity providers to mint LP certificate NFTs on Sepolia"
                  style={{
                    fontSize: '0.75rem',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#167D8D',
                    color: '#ffffff',
                    borderColor: '#167D8D',
                  }}
                >
                  {isAuthorizing ? <RefreshCw size={14} className="spin" /> : <Award size={14} />}
                  <span>ENABLE PUBLIC LP MINTING</span>
                </button>

                <button
                  className="sharp-button-outline"
                  onClick={exportLogsJson}
                  style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Download size={14} />
                  <span>EXPORT REVIEWS</span>
                </button>

                <button
                  className="sharp-button-outline"
                  onClick={onClearLogs}
                  style={{ fontSize: '0.75rem', padding: '6px 12px', color: '#c5221f', borderColor: '#c5221f', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={14} />
                  <span>CLEAR ALL</span>
                </button>
              </div>
            </div>

            {authStatus && (
              <div
                style={{
                  padding: '8px 12px',
                  marginBottom: '12px',
                  backgroundColor: authStatus.includes('✓') ? '#e6f4ea' : '#fce8e6',
                  color: authStatus.includes('✓') ? '#137333' : '#c5221f',
                  border: `1px solid ${authStatus.includes('✓') ? '#137333' : '#c5221f'}`,
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                {authStatus.includes('✓') && <Check size={14} />}
                <span>{authStatus}</span>
              </div>
            )}

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
                          View Transaction <ExternalLink size={10} />
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
