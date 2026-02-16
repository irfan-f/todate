/**
 * Shared Tailwind class strings for consistent header/nav and FAB buttons.
 */

export const headerNavButtonClass =
  'min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded bg-gray-400 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-600 dark:focus-visible:ring-gray-400 transition-colors touch-manipulation';

export const fabSubButtonClass =
  'min-h-[48px] sm:min-h-[44px] px-4 sm:px-5 rounded-full bg-gray-400 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 shadow-lg dark:shadow-xl inline-flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-600 dark:focus-visible:ring-gray-400 touch-manipulation transition-colors';

export const fabMainButtonClass =
  'min-h-[56px] min-w-[56px] sm:min-h-[60px] sm:min-w-[60px] rounded-full bg-gray-600 hover:bg-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-100 dark:text-gray-200 shadow-lg dark:shadow-xl inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 dark:focus-visible:ring-gray-300 touch-manipulation transition-all duration-200';

/** Smaller FAB placed adjacent to main create FAB (e.g. settings gear). */
export const fabSettingsButtonClass =
  'min-h-[44px] min-w-[44px] sm:min-h-[48px] sm:min-w-[48px] rounded-full bg-gray-500 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-100 dark:text-gray-200 shadow-md dark:shadow-lg inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-400 dark:focus-visible:ring-gray-300 touch-manipulation transition-colors';
