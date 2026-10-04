import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2 } from 'lucide-react';

/**
 * ConfirmModal — custom dialog pop up for action confirmations.
 * Replaces browser native alert/confirm popups with a modern, glassmorphic UI.
 */
export default function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  icon: Icon = Trash2,
  onConfirm,
  onClose,
}) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="lanova-modal-overlay anim-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="lanova-modal-card lanova-confirm-card anim-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Icon Badge */}
        <div className={`modal-alert-icon-wrap ${variant}`}>
          <Icon size={26} strokeWidth={2.2} />
        </div>

        {/* Title */}
        <h3 id="confirm-modal-title" className="modal-confirm-title">
          {title}
        </h3>

        {/* Message / Description */}
        <div className="modal-confirm-desc">
          {message}
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          <button
            type="button"
            className="modal-action-btn secondary"
            onClick={onClose}
          >
            <span>{cancelLabel}</span>
          </button>

          <button
            type="button"
            className={`modal-action-btn ${variant}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
