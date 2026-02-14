import type { TodateType, SchoolStartDate } from '../types';
import { formatDateDisplay } from '../utils/date';
import Icon from './Icon';
import editIcon from '../assets/edit.svg?raw';

/** Same as header/FAB chrome so card content is readable on any tag background without distorting the tag color. */
const CONTENT_BG = 'bg-gray-500 dark:bg-gray-700';
const CONTENT_TEXT = 'text-gray-100 dark:text-gray-200';
const CONTENT_BTN = 'bg-gray-500 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 text-gray-100 dark:text-gray-200 focus-visible:ring-gray-300 dark:focus-visible:ring-gray-500';

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

  const tags = Array.isArray(data.tags) ? data.tags : [];
  const cardBgColor = tags[0]?.color ?? FALLBACK_TAG_COLOR;

  return (
    <article
      className="w-full max-w-2xl mx-3 sm:mx-4 my-3 sm:my-4 p-3 sm:p-4 rounded-2xl shadow-sm border border-black/10"
      aria-labelledby={`todate-title-${data._id}`}
      style={{ backgroundColor: cardBgColor }}
    >
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 flex-wrap">
        <h3
          id={`todate-title-${data._id}`}
          className={`text-lg sm:text-2xl font-bold px-3 py-1 rounded-full ${CONTENT_BG} ${CONTENT_TEXT}`}
        >
          {data.title}
        </h3>
        <time
          dateTime={dateTime.toISOString()}
          className={`text-sm sm:text-base shrink-0 px-3 py-1 rounded-full ${CONTENT_BG} ${CONTENT_TEXT}`}
        >
          {dateLabel}
        </time>
        {onEdit ? (
          <button
            type="button"
            onClick={() => onEdit(data)}
            aria-label={`Edit todate ${data.title}`}
            className={`ml-auto min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 transition-colors touch-manipulation ${CONTENT_BTN}`}
          >
            <Icon src={editIcon} className="w-5 h-5" />
          </button>
        ) : null}
      </div>
      {data.comment ? (
        <p className={`mt-2 text-sm sm:text-base px-3 py-1 rounded-full ${CONTENT_BG} ${CONTENT_TEXT}`}>{data.comment}</p>
      ) : null}
      {tags.length > 0 ? (
        <div
          className="flex flex-wrap gap-2 mt-2 min-h-8"
          role="list"
          aria-label="Tags"
        >
          {tags.map((tag, i) => (
            <span
              key={tag?._id ?? `tag-${i}`}
              className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center ${CONTENT_BG} ${CONTENT_TEXT}`}
              role="listitem"
            >
              <span
                className="inline-block w-3 h-3 rounded mr-2 shrink-0"
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
