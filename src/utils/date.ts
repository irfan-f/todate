import type { DateValue, DateValueDatetime, SchoolStartDate } from '../types';

/**
 * Converts a school year + quarter to an approximate calendar date using the school start date.
 * Year N starts at (referenceYear + N - 1), month/day from school start.
 * Quarter Q is the (Q-1)*3 month offset from the start of that school year.
 */
function schoolToIso(
  schoolYear: number,
  quarter: 1 | 2 | 3 | 4,
  schoolStart: SchoolStartDate
): string {
  const year = schoolStart.referenceYear + (schoolYear - 1);
  const startMonth = schoolStart.month - 1; // 0-indexed
  const quarterMonthOffset = (quarter - 1) * 3;
  const d = new Date(year, startMonth + quarterMonthOffset, schoolStart.day, 12, 0, 0);
  return d.toISOString();
}

/**
 * Returns an ISO date string suitable for sorting. Uses midpoint of the period when vague.
 */
export function dateValueToIso(
  dateValue: DateValue,
  schoolStart: SchoolStartDate | null | undefined
): string {
  switch (dateValue.kind) {
    case 'school': {
      if (!schoolStart) {
        // Fallback: use reference year 2000 so "Year 1 Q1" still sorts
        return schoolToIso(dateValue.schoolYear, dateValue.quarter, {
          referenceYear: 2000,
          month: 9,
          day: 1,
        });
      }
      return schoolToIso(dateValue.schoolYear, dateValue.quarter, schoolStart);
    }
    case 'month':
      return new Date(dateValue.year, dateValue.month - 1, 15, 12, 0, 0).toISOString();
    case 'day':
      return new Date(
        dateValue.year,
        dateValue.month - 1,
        dateValue.day,
        12,
        0,
        0
      ).toISOString();
    case 'datetime':
      return dateValue.iso;
    default:
      return new Date().toISOString();
  }
}

/**
 * Returns the calendar date range for a school year and quarter (e.g. Year 1 Q1 → Sep–Nov 2000).
 * Year N starts at (referenceYear + N - 1), month/day from school start; each quarter is 3 months.
 */
export function schoolQuarterToCalendarRange(
  schoolYear: number,
  quarter: 1 | 2 | 3 | 4,
  schoolStart: SchoolStartDate
): { start: Date; end: Date } {
  const year = schoolStart.referenceYear + (schoolYear - 1);
  const startMonth0 = schoolStart.month - 1 + (quarter - 1) * 3;
  const start = new Date(year, startMonth0, schoolStart.day, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 3);
  end.setDate(end.getDate() - 1);
  return { start, end };
}

/**
 * Formats a DateValue for display. For school kind, converts to calendar range when schoolStart is provided
 * (e.g. Year 1 Q1 → "Sep–Nov 2000", Year 1 Q4 → "Jun–Aug 2001").
 */
export function formatDateDisplay(
  dateValue: DateValue,
  options?: {
    locale?: string;
    includeTime?: boolean;
    /** When set, school year + quarter is shown as calendar range (e.g. Sep–Nov 2000). */
    schoolStart?: SchoolStartDate | null;
  }
): string {
  const locale = options?.locale ?? undefined;
  const includeTime = options?.includeTime ?? false;
  const schoolStart = options?.schoolStart;

  switch (dateValue.kind) {
    case 'school': {
      if (schoolStart) {
        const { start, end } = schoolQuarterToCalendarRange(
          dateValue.schoolYear,
          dateValue.quarter,
          schoolStart
        );
        const startStr = start.toLocaleDateString(locale, {
          month: 'short',
          year: 'numeric',
        });
        const endStr = end.toLocaleDateString(locale, {
          month: 'short',
          year: 'numeric',
        });
        const label = startStr === endStr ? startStr : `${startStr}–${endStr}`;
        return dateValue.schoolYearNote?.trim()
          ? `${label} (${dateValue.schoolYearNote.trim()})`
          : label;
      }
      let label = `Year ${dateValue.schoolYear}, Q${dateValue.quarter}`;
      if (dateValue.schoolYearNote?.trim()) {
        label += ` (${dateValue.schoolYearNote.trim()})`;
      }
      return label;
    }
    case 'month':
      return new Date(dateValue.year, dateValue.month - 1, 1).toLocaleDateString(
        locale,
        { month: 'short', year: 'numeric' }
      );
    case 'day':
      return new Date(
        dateValue.year,
        dateValue.month - 1,
        dateValue.day
      ).toLocaleDateString(locale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...(includeTime ? { hour: 'numeric', minute: '2-digit' } : {}),
      });
    case 'datetime': {
      const d = new Date(dateValue.iso);
      return d.toLocaleString(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    }
    default:
      return '';
  }
}

/**
 * Parses an existing TimeType date into a DateValue when possible (e.g. for editing).
 * Legacy events only have date: string (ISO); we treat as datetime.
 */
export function isoToDateValue(iso: string): DateValueDatetime {
  return { kind: 'datetime', iso };
}
