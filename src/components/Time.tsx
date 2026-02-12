import type { TimeType } from '../types';

const Time = ({ data }: { data: TimeType }) => {
  const dateTime = new Date(data.date);
  const dateLabel = dateTime.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <article
      className="w-full max-w-2xl mx-3 sm:mx-4 my-3 sm:my-4 p-3 sm:p-4 rounded-2xl bg-gray-400 shadow-sm"
      aria-labelledby={`time-title-${data._id}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 flex-wrap">
        <h3
          id={`time-title-${data._id}`}
          className="text-lg sm:text-2xl font-bold text-gray-900"
        >
          {data.title}
        </h3>
        <time
          dateTime={dateTime.toISOString()}
          className="text-sm sm:text-base text-gray-700 shrink-0"
        >
          {dateLabel}
        </time>
      </div>
      {data.comment ? (
        <p className="mt-2 text-gray-800 text-sm sm:text-base">{data.comment}</p>
      ) : null}
      {/* Selected Tags Chips */}
      {data.tags.length > 0 ? (
        <div
          className="flex flex-wrap gap-2 mt-2 min-h-8"
          role="list"
          aria-label="Tags"
        >
          {data.tags.map((tag) => (
            <span
              key={tag._id}
              className="px-3 py-1 rounded-full text-sm font-medium inline-flex items-center bg-gray-300/80"
              role="listitem"
            >
              <span
                className="inline-block w-3 h-3 rounded mr-2 shrink-0"
                style={{ backgroundColor: tag.color }}
                aria-hidden
              />
              {tag.name}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default Time;