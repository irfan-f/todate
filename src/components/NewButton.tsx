import Icon from './Icon';
import addCircleIcon from '../assets/add-circle.svg?raw';

const NewButton = ({
  name,
  action,
  ariaLabel,
  className,
  icon,
}: {
  name: string;
  action: () => void;
  ariaLabel?: string;
  className?: string;
  /** Raw SVG string (e.g. from import 'x.svg?raw'). Defaults to add-circle icon. */
  icon?: string;
}) => {
  return (
    <button
      type="button"
      onClick={() => action()}
      aria-label={ariaLabel ?? `Create new ${name.toLowerCase()}`}
      className={`min-h-[44px] min-w-[44px] bg-gray-400 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-gray-600 dark:focus-visible:ring-gray-400 font-bold py-2 px-4 rounded inline-flex items-center justify-center cursor-pointer transition-colors touch-manipulation ${className ?? ''}`}
    >
      <Icon src={icon ?? addCircleIcon} className="w-5 h-5 mr-1 shrink-0" />
      <span>{name}</span>
    </button>
  );
};

export default NewButton;