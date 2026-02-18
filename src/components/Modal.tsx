import { useRef, useEffect } from 'react';

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
}

const Modal = ({
  children,
  title,
  closeFn,
}: {
  children: React.ReactNode;
  title: string;
  closeFn: () => void;
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusableElements(panel);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    panel.addEventListener('keydown', handleKeyDown);
    return () => panel.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop - click to close, visible for focus context */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-hidden
        onClick={closeFn}
      />
      <div
        ref={panelRef}
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-stone-50 dark:bg-gray-800 rounded-xl shadow-xl p-4 sm:p-6 overflow-hidden focus:outline-none"
      >
        <div className="flex flex-row items-center gap-2 mb-2 shrink-0">
          <h2
            id="modal-title"
            className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 truncate flex-1"
          >
            {title}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeFn}
            aria-label="Close dialog"
            className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer transition-colors"
          >
            <span aria-hidden>×</span>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 min-h-0">{children}</div>
      </div>
    </div>
  );
};

export default Modal;