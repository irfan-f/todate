import Icon from './Icon';
import { icons } from '../icons';

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
  /** Icon from registry (e.g. icons.addCircle). Defaults to add-circle. */
  icon?: string;
}) => {
  return (
    <button
      type="button"
      onClick={() => action()}
      aria-label={ariaLabel ?? `Create new ${name.toLowerCase()}`}
      className={`btn-primary min-h-[44px] min-w-[44px] font-bold py-2 px-4 rounded inline-flex items-center justify-center ${className ?? ''}`}
    >
      <Icon src={icon ?? icons.addCircle} className="w-5 h-5 mr-1 shrink-0" />
      <span>{name}</span>
    </button>
  );
};

export default NewButton;