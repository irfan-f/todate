const Modal = ({
  children,
  title,
  closeFn,
}: {
  children: React.ReactNode;
  title: string;
  closeFn: () => void;
}) => {
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
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-xl shadow-xl p-4 sm:p-6 overflow-hidden focus:outline-none">
        <div className="flex flex-row items-center gap-2 mb-2 shrink-0">
          <h2
            id="modal-title"
            className="text-xl sm:text-2xl font-bold text-gray-800 truncate flex-1"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={closeFn}
            aria-label="Close dialog"
            className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-pointer transition-colors"
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