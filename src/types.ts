export interface TagType {
  _id: `${string}-${string}-${string}-${string}-${string}`,
  name: string,
  color: string
}

/** Flexible date input: from vague (school year + period) to precise (date & time). */
export type DatePrecision = 'school' | 'month' | 'day' | 'datetime';

/** School year division: quarter (4), trimester (3), or semester (2) per year. */
export type SchoolPeriodType = 'quarter' | 'trimester' | 'semester';

export interface DateValueSchool {
  kind: 'school';
  schoolYear: number;
  /** How the school year is divided. Omit in legacy data (use quarter instead). */
  periodType?: SchoolPeriodType;
  /** Period number (1–4 quarter, 1–3 trimester, 1–2 semester). Omit in legacy data. */
  period?: number;
  /** When this grade was repeated: 1 = first time, 2 = second time, etc. Omit if not repeated. */
  repeatedInstance?: number;
  /** e.g. "repeated", "skipped Year 2", "gap after Year 1" */
  schoolYearNote?: string;
  /** Legacy: quarter 1–4. When present and periodType/period absent, treated as quarter. */
  quarter?: 1 | 2 | 3 | 4;
}

export interface DateValueMonth {
  kind: 'month';
  year: number;
  month: number; // 1–12
}

export interface DateValueDay {
  kind: 'day';
  year: number;
  month: number;
  day: number;
}

export interface DateValueDatetime {
  kind: 'datetime';
  iso: string;
}

export type DateValue =
  | DateValueSchool
  | DateValueMonth
  | DateValueDay
  | DateValueDatetime;

/** School start date (e.g. Sept 1) used to map school year + period → calendar date. */
export interface SchoolStartDate {
  /** Reference year for "Year 1" start; e.g. 2020 means Year 1 starts Sept 1, 2020. */
  referenceYear: number;
  /** Month (1–12) when Year 1 starts; default 9 (September). */
  month?: number;
  /** Day of month when Year 1 starts; default 1. */
  day?: number;
  /** Academic calendar: quarter (4), trimester (3), or semester (2) per year. */
  periodType?: SchoolPeriodType;
  /** School year numbers that were repeated (e.g. [2] = repeated year 2). Used to calculate calendar years. */
  repeatedGrades?: number[];
  /** School years after which there was a gap year (e.g. [3] = gap after year 3). */
  gapYears?: number[];
  /** School year numbers that were skipped (e.g. [4] = skipped year 4). */
  skippedGrades?: number[];
}

/** A single todate entry (dated moment or period with title, tags, optional comment). */
export interface TodateType {
  _id: string;
  title: string;
  /** Canonical ISO date string used for sorting (always set). */
  date: string;
  /** When set, used for display; supports school year, month, day, or datetime. */
  dateDisplay?: DateValue;
  /** Optional end of range; same shape as dateDisplay (school year or calendar date). */
  endDateDisplay?: DateValue;
  comment?: string;
  tags: TagType[];
}

export type TodatesType = Record<string, TodateType>;
export type TagsType = Record<string, TagType>;