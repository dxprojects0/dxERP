import React from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  maxWidthClass?: string;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
  panelClassName?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth,
  maxWidthClass = 'max-w-xl',
  closeOnBackdrop = true,
  closeOnEsc = true,
  showCloseButton = true,
  panelClassName = '',
}) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return undefined;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const onKeydown = (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeydown);

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener('keydown', onKeydown);
    };
  }, [isOpen, closeOnEsc, onClose]);

  if (!isOpen || !mounted) return null;

  const content = (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-slate-950/55 backdrop-blur-sm modal-overlay-shell"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${maxWidthClass} max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden rounded-2xl border border-app bg-surface shadow-[0_20px_60px_rgba(2,6,23,0.28)] flex flex-col modal-panel-shell ${panelClassName}`}
        style={maxWidth ? { maxWidth } : undefined}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="sticky top-0 z-10 bg-surface border-b border-app px-4 py-3 flex items-center justify-between gap-3">
            <h3 className="font-black text-lg">{title || ''}</h3>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 rounded-lg border border-app flex items-center justify-center"
                aria-label="Close modal"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default Modal;
