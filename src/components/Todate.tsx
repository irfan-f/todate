import type { TodateType, SchoolStartDate } from '../types';
import { formatDateDisplay } from '../utils/date';
import Icon from './Icon';
import editIcon from '../assets/edit.svg?raw';

interface TodateProps {
  data: TodateType;
  schoolStartDate?: SchoolStartDate | null;
  onEdit?: (data: TodateType) => void;
}

const FALLBACK_TAG_COLOR = '#9ca3af'; // gray-400

const Todate = ({ data, schoolStartDate = null, onEdit }: TodateProps) => {
  const dateTime = new Date(data.date);
  const dateLabel = data.dateDisplay
    ? formatDateDisplay(data.dateDisplay, {
        schoolStart: schoolStartDate ?? undefined,
      })
    : dateTime.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });

  const endDateLabel = data.endDateDisplay
    ? formatDateDisplay(data.endDateDisplay, {
        schoolStart: schoolStartDate ?? undefined,
      })
    : null;

  const rangeLabel = endDateLabel ? `${dateLabel} – ${endDateLabel}` : dateLabel;

  const tags = Array.isArray(data.tags) ? data.tags : [];

  return (
    <article
      className="w-full h-full p-4 sm:p-6 select-text"
      aria-labelledby={`todate-title-${data._id}`}
    >
      {/* Header: title + edit */}
      <div className="flex items-start gap-3">
        <h3
          id={`todate-title-${data._id}`}
          className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight"
        >
          {data.title}
        </h3>
        {onEdit ? (
          <button
            type="button"
            onClick={() => onEdit(data)}
            aria-label={`Edit todate ${data.title}`}
            className="ml-auto shrink-0 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-1 transition-colors touch-manipulation bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 focus-visible:ring-blue-500 cursor-pointer"
          >
            <Icon src={editIcon} className="w-5 h-5" />
          </button>
        ) : null}
      </div>

      {/* Date */}
      <time
        dateTime={dateTime.toISOString()}
        className="block mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400"
      >
        {rangeLabel}
      </time>

      {/* Comment */}
      {data.comment ? (
        <p className="mt-4 text-base sm:text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
          {data.comment}
        </p>
      ) : null}

      {/* Tags */}
      {tags.length > 0 ? (
        <div
          className="flex flex-wrap gap-2 mt-4"
          role="list"
          aria-label="Tags"
        >
          {tags.map((tag, i) => (
            <span
              key={tag?._id ?? `tag-${i}`}
              className="px-3 py-1 rounded-full text-sm font-medium inline-flex items-center border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              role="listitem"
            >
              <span
                className="inline-block w-3 h-3 rounded-full mr-2 shrink-0"
                style={{ backgroundColor: tag?.color ?? FALLBACK_TAG_COLOR }}
                aria-hidden
              />
              {tag?.name ?? 'Tag'}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
};

export default Todate;
