import type { DateValue, SchoolStartDate, SchoolPeriodType } from '../types';

/** Months per period for each division type (quarter=3, trimester=4, semester=6). */
const MONTHS_PER_PERIOD: Record<SchoolPeriodType, number> = {
  quarter: 3,
  trimester: 4,
  semester: 6,
};

/**
 * Calendar year offset for school year N, accounting for repeated grades, gap years, and skipped grades.
 * repeatedInstance: when N is repeated, 1 = first time, 2 = second time (adds 0 or 1 extra year).
 */
function schoolYearToCalendarYearOffset(
  schoolYear: number,
  schoolStart: SchoolStartDate,
  repeatedInstance?: number
): number {
  const repeated = schoolStart.repeatedGrades ?? [];
  const gaps = schoolStart.gapYears ?? [];
  const skipped = schoolStart.skippedGrades ?? [];
  let offset = schoolYear - 1;
  for (let i = 1; i < schoolYear; i++) {
    if (repeated.includes(i)) offset += 1;
    if (skipped.includes(i)) offset -= 1;
    if (gaps.includes(i)) offset += 1;
  }
  if (repeated.includes(schoolYear) && repeatedInstance != null && repeatedInstance > 1) {
    offset += repeatedInstance - 1;
  }
  return offset;
}

/**
 * Converts a school year + period to an approximate calendar date using the school start date.
 * Accounts for repeated grades, gap years, and skipped grades when resolving calendar year.
 */
function schoolToIso(
  schoolYear: number,
  periodType: SchoolPeriodType,
  period: number,
  schoolStart: SchoolStartDate,
  repeatedInstance?: number
): string {
  const offset = schoolYearToCalendarYearOffset(schoolYear, schoolStart, repeatedInstance);
  const year = schoolStart.referenceYear + offset;
  const startMonth = (schoolStart.month ?? 9) - 1; // 0-indexed
  const monthsPer = MONTHS_PER_PERIOD[periodType];
  const monthOffset = (period - 1) * monthsPer;
  const d = new Date(year, startMonth + monthOffset, schoolStart.day ?? 1, 12, 0, 0);
  return d.toISOString();
}

function getSchoolPeriod(dv: Extract<DateValue, { kind: 'school' }>): { periodType: SchoolPeriodType; period: number } {
  if (dv.periodType != null && dv.period != null) {
    return { periodType: dv.periodType, period: dv.period };
  }
  const quarter = dv.quarter ?? 1;
  return { periodType: 'quarter', period: Math.max(1, Math.min(4, quarter)) };
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
      const { periodType, period } = getSchoolPeriod(dateValue);
      const fallback: SchoolStartDate = { referenceYear: 2000, month: 9, day: 1 };
      return schoolToIso(
        dateValue.schoolYear,
        periodType,
        period,
        schoolStart ?? fallback,
        dateValue.repeatedInstance
      );
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
 * Returns the calendar date range for a school year and period (e.g. Year 1 Q1 → Sep–Nov 2000).
 * Accounts for repeated/gap/skipped grades when resolving calendar year.
 */
export function schoolPeriodToCalendarRange(
  schoolYear: number,
  periodType: SchoolPeriodType,
  period: number,
  schoolStart: SchoolStartDate,
  repeatedInstance?: number
): { start: Date; end: Date } {
  const offset = schoolYearToCalendarYearOffset(schoolYear, schoolStart, repeatedInstance);
  const year = schoolStart.referenceYear + offset;
  const monthsPer = MONTHS_PER_PERIOD[periodType];
  const startMonth0 = (schoolStart.month ?? 9) - 1 + (period - 1) * monthsPer;
  const start = new Date(year, startMonth0, schoolStart.day ?? 1, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + monthsPer);
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
      const { periodType, period } = getSchoolPeriod(dateValue);
      const periodLabel =
        periodType === 'quarter'
          ? `Q${period}`
          : periodType === 'trimester'
            ? `Tri ${period}`
            : `Sem ${period}`;
      if (schoolStart) {
        const { start, end } = schoolPeriodToCalendarRange(
          dateValue.schoolYear,
          periodType,
          period,
          schoolStart,
          dateValue.repeatedInstance
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
      let label = `Year ${dateValue.schoolYear}, ${periodLabel}`;
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
 * Formats an ISO date string for use in <input type="datetime-local"> value (YYYY-MM-DDTHH:mm).
 */
export function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
