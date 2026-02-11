import type { TimesType, TimeType } from '../types';
import Time from './Time';

function sortByTime(a: TimeType, b: TimeType) {
  const aVal = new Date(a.date).valueOf()
  const bVal = new Date(b.date).valueOf();
  return bVal - aVal;
}

const TimeLine = ({ data }: { data: TimesType }) => {
  return (
    <div className="h-11/12 w-full flex flex-col items-start overflow-scroll overflow-x-auto">
      {Object.values(data).sort(sortByTime).map((time) => {
        // Render each event with its title
        return (
          <Time data={time} key={time._id} />
        )
      })}
    </div>
  )
}

export default TimeLine;