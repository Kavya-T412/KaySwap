import React from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, ExternalLink, ArrowRight } from 'lucide-react';

export interface LoaderStep {
  stepNumber: number;
  totalSteps: number;
  title: string;
  description: string;
  status: 'idle' | 'pending' | 'success' | 'failed';
  txHash?: string | null;
  error?: string | null;
}

interface LoaderCardProps {
  isOpen: boolean;
  steps: LoaderStep[];
  currentActionTitle?: string;
  onClose?: () => void;
}

export const LoaderCard: React.FC<LoaderCardProps> = ({
  isOpen,
  steps,
  currentActionTitle = 'TRANSACTION IN PROGRESS',
  onClose,
}) => {
  if (!isOpen || steps.length === 0) return null;

  const isCompleted = steps.every((s) => s.status === 'success');
  const isAnyFailed = steps.some((s) => s.status === 'failed');

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
        zIndex: 1100,
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
          maxWidth: '500px',
          backgroundColor: '#ffffff',
          border: '3px solid #450C3F',
          boxShadow: '8px 8px 0px #450C3F',
          padding: '28px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '2px solid #450C3F', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                backgroundColor: isAnyFailed ? '#c5221f' : isCompleted ? '#165823' : '#450C3F',
                color: '#ffffff',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isCompleted ? (
                <CheckCircle2 size={20} />
              ) : isAnyFailed ? (
                <AlertCircle size={20} />
              ) : (
                <RefreshCw size={20} className="spin" />
              )}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {isCompleted ? 'TRANSACTION COMPLETED' : isAnyFailed ? 'TRANSACTION FAILED' : currentActionTitle}
              </h3>
              <span className="mono" style={{ fontSize: '0.75rem', color: '#666' }}>
                {isCompleted
                  ? 'All on-chain steps verified successfully'
                  : isAnyFailed
                  ? 'Transaction rejected or reverted'
                  : 'Real-time execution status tracking'}
              </span>
            </div>
          </div>
        </div>

        {/* Steps List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {steps.map((step) => {
            const isStepPending = step.status === 'pending';
            const isStepSuccess = step.status === 'success';
            const isStepFailed = step.status === 'failed';

            return (
              <div
                key={step.stepNumber}
                style={{
                  border: `2px solid ${
                    isStepSuccess ? '#165823' : isStepFailed ? '#c5221f' : isStepPending ? '#450C3F' : '#ccc'
                  }`,
                  backgroundColor: isStepPending
                    ? '#FCECD8'
                    : isStepSuccess
                    ? 'rgba(22, 88, 35, 0.06)'
                    : '#fafafa',
                  padding: '16px',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span
                    className="sharp-badge"
                    style={{
                      backgroundColor: isStepSuccess
                        ? '#165823'
                        : isStepFailed
                        ? '#c5221f'
                        : isStepPending
                        ? '#450C3F'
                        : '#888888',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                    }}
                  >
                    STEP {step.stepNumber} OF {step.totalSteps}
                  </span>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: isStepSuccess ? '#165823' : isStepFailed ? '#c5221f' : isStepPending ? '#b06000' : '#888',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {isStepPending && <RefreshCw size={12} className="spin" />}
                    {isStepSuccess && <CheckCircle2 size={12} />}
                    {isStepFailed && <AlertCircle size={12} />}
                    {step.status === 'pending'
                      ? 'IN PROGRESS'
                      : step.status === 'success'
                      ? 'COMPLETED'
                      : step.status === 'failed'
                      ? 'FAILED'
                      : 'WAITING'}
                  </span>
                </div>

                <h4 style={{ margin: '4px 0', fontSize: '1rem', color: isStepSuccess ? '#165823' : '#450C3F' }}>
                  {step.title}
                </h4>

                <p style={{ fontSize: '0.85rem', color: '#444', margin: '0 0 8px 0', lineHeight: '1.4' }}>
                  {step.description}
                </p>

                {step.txHash && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #ccc' }}>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${step.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: '#165823',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      View Tx on Sepolia Etherscan <ExternalLink size={12} />
                    </a>
                  </div>
                )}

                {step.error && (
                  <div style={{ color: '#c5221f', fontSize: '0.8rem', fontWeight: 600, marginTop: '4px' }}>
                    Error: {step.error}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Button on Done/Failed */}
        {(isCompleted || isAnyFailed) && onClose && (
          <button
            className="sharp-button-primary"
            onClick={onClose}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <span>{isCompleted ? 'CONTINUE TO KAYSWAP' : 'CLOSE & RETRY'}</span>
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
