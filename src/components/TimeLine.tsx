import type { TimesType, TimeType, SchoolStartDate } from '../types';
import Time from './Time';

function sortByTime(a: TimeType, b: TimeType) {
  const aVal = new Date(a.date).valueOf()
  const bVal = new Date(b.date).valueOf();
  return bVal - aVal;
}

const TimeLine = ({
  data,
  schoolStartDate,
}: {
  data: TimesType;
  schoolStartDate: SchoolStartDate | null;
}) => {
  const sorted = Object.values(data).sort(sortByTime);

  return (
    <div
      className="flex-1 min-h-0 w-full flex flex-col items-center overflow-y-auto overflow-x-hidden py-2"
      role="list"
      aria-label="Event timeline"
    >
      {sorted.length === 0 ? (
        <p className="text-gray-500 text-sm sm:text-base p-4" role="status">
          No events yet. Create one to get started.
        </p>
      ) : (
        sorted.map((time) => (
          <Time data={time} key={time._id} schoolStartDate={schoolStartDate} />
        ))
      )}
    </div>
  );
};
export default TimeLine;
