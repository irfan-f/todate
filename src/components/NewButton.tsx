const NewButton = ({
  name,
  action,
  ariaLabel,
  className,
}: {
  name: string;
  action: () => void;
  ariaLabel?: string;
  className?: string;
}) => {
  return (
    <button
      type="button"
      onClick={() => action()}
      aria-label={ariaLabel ?? `Create new ${name.toLowerCase()}`}
      className={`min-h-[44px] min-w-[44px] bg-gray-400 hover:bg-gray-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-gray-600 font-bold py-2 px-4 rounded inline-flex items-center justify-center cursor-pointer transition-colors touch-manipulation ${className}`}
    >
      <svg
        className="fill-current w-5 h-5 mr-1 shrink-0"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 -960 960 960"
        aria-hidden
      >
        <path d="M440-280h80v-160h160v-80H520v-160h-80v160H280v80h160v160Zm40 200q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
      </svg>
      <span>{name}</span>
    </button>
  );
};

export default NewButton;