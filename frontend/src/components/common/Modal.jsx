import { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ open, onClose, title, children, width = 'max-w-lg' }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy/40 px-4 py-10 backdrop-blur-[2px]">
      <div
        className={`card w-full ${width} animate-[fadeIn_0.15s_ease-out] shadow-panel`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1 text-ink-muted hover:bg-canvas hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
