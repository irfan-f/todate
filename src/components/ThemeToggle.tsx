import { useState, useRef, useEffect } from 'react';
import type { Theme } from '../hooks/useTheme';
import Icon from './Icon';
import lightModeIcon from '../assets/light_mode.svg?raw';
import darkModeIcon from '../assets/dark_mode.svg?raw';
import defaultModeIcon from '../assets/default_mode.svg?raw';

const LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

export default function ThemeToggle({
  theme,
  setTheme,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const listboxId = 'theme-listbox';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id="theme-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        aria-label="Theme"
        title={`Theme: ${LABELS[theme]}`}
        className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded bg-gray-400 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-600 dark:focus-visible:ring-gray-400 transition-colors touch-manipulation"
      >
        <Icon
          src={theme === 'light' ? lightModeIcon : theme === 'dark' ? darkModeIcon : defaultModeIcon}
          className="w-6 h-6 sm:w-5 sm:h-5"
          aria-hidden
        />
      </button>
      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Theme options"
          className="absolute right-0 top-full mt-1 py-1 min-w-32 rounded-lg bg-stone-50 dark:bg-gray-700 border border-stone-200 dark:border-gray-600 shadow-lg z-50"
        >
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              role="option"
              aria-selected={theme === t}
              type="button"
              onClick={() => {
                setTheme(t);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
            >
              {LABELS[t]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
