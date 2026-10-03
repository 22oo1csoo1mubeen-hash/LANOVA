import { useState } from 'react';
import { Copy, Check, ArrowRight } from 'lucide-react';

/**
 * NetworkCard — reusable card for the 4 primary network metrics on NetworkPage.
 */
export default function NetworkCard({
  icon: Icon,
  label,
  value,
  subtext,
  isCopyable = false,
  copyValue = '',
  isArrow = false,
  onArrowClick,
  isStatus = false,
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!copyValue && !value) return;
    try {
      await navigator.clipboard.writeText(copyValue || value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="net-metric-card">
      <div className="net-card-left-wrap">
        {/* Glowing circular icon */}
        <div className="net-card-icon-circle">
          <Icon size={24} strokeWidth={1.8} className="net-card-icon" />
        </div>

        {/* Content */}
        <div className="net-card-content">
          <span className="net-card-label">{label}</span>
          <div className="net-card-val-row">
            {isStatus ? (
              <span className="net-card-val-status">
                <span className="status-bullet online glow" />
                {value}
              </span>
            ) : (
              <span className="net-card-val">{value}</span>
            )}
          </div>
          <span className="net-card-subtext">{subtext}</span>
        </div>
      </div>

      {/* Action: Copy or Arrow */}
      {isCopyable && (
        <button
          type="button"
          className={`net-card-action-btn${copied ? ' copied' : ''}`}
          onClick={handleCopy}
          aria-label={`Copy ${label}`}
          title={copied ? 'Copied to clipboard!' : `Copy ${value}`}
        >
          {copied ? (
            <Check size={16} strokeWidth={2.4} className="copied-icon" />
          ) : (
            <Copy size={16} strokeWidth={1.8} />
          )}
        </button>
      )}

      {isArrow && (
        <button
          type="button"
          className="net-card-action-btn arrow"
          onClick={onArrowClick}
          aria-label="View connected users in chat"
          title="Open Chat"
        >
          <ArrowRight size={18} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
