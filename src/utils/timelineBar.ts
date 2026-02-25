import type { TodateType, SchoolStartDate } from '../types';
import { DEFAULT_TAG_COLOR } from '../constants';
import { dateValueToIso } from './date';
import type { TimelineBarItem } from '../components/TimelineBar';

/**
 * Convert a TodateType into a TimelineBarItem for the vertical timeline.
 * Uses `date` (always set) for startDate. For endDate, converts `endDateDisplay`
 * through dateValueToIso when present.
 */
export function todateToBarItem(
  todate: TodateType,
  schoolStartDate: SchoolStartDate | null
): TimelineBarItem {
  let endDate: string | undefined;
  if (todate.endDateDisplay) {
    endDate = dateValueToIso(todate.endDateDisplay, schoolStartDate);
  }
  return {
    id: todate._id,
    title: todate.title,
    startDate: todate.date,
    endDate,
    comment: todate.comment,
    color: todate.tags[0]?.color ?? DEFAULT_TAG_COLOR,
  };
}
