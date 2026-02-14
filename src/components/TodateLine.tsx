import type { TodateType, SchoolStartDate } from '../types';
import Todate from './Todate';

const TodateLine = ({
  list,
  schoolStartDate,
  totalCount = 0,
  onEditTodate,
}: {
  list: TodateType[];
  schoolStartDate: SchoolStartDate | null;
  /** Total todate count before filtering; used for empty state message. */
  totalCount?: number;
  onEditTodate?: (todate: TodateType) => void;
}) => {
  const emptyMessage =
    totalCount === 0
      ? 'No todates yet. Create one to get started.'
      : 'No todates match the current filters.';
  return (
    <div
      className="flex-1 min-h-0 w-full flex flex-col items-center overflow-y-auto overflow-x-hidden py-2"
      role="list"
      aria-label="Todate timeline"
    >
      {list.length === 0 ? (
        <p className="text-stone-600 dark:text-gray-400 text-sm sm:text-base p-4" role="status">
          {emptyMessage}
        </p>
      ) : (
        list.map((todate) => (
          <Todate
            data={todate}
            key={todate._id}
            schoolStartDate={schoolStartDate}
            onEdit={onEditTodate}
          />
        ))
      )}
    </div>
  );
};

export default TodateLine;
