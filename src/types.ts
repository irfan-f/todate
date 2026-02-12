export interface TagType {
  _id: `${string}-${string}-${string}-${string}-${string}`,
  name: string,
  color: string
}

/** Flexible date input: from vague (school year + quarter) to precise (date & time). */
export type DatePrecision = 'school' | 'month' | 'day' | 'datetime';

/** Note for non-linear progression: repeated year, skipped year, or gap in education. */
export type SchoolYearNoteType = 'repeated' | 'skipped' | 'gap' | '';

export interface DateValueSchool {
  kind: 'school';
  schoolYear: number;
  quarter: 1 | 2 | 3 | 4;
  /** e.g. "repeated", "skipped Year 2", "gap after Year 1" */
  schoolYearNote?: string;
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

/** School start date (e.g. Sept 1) used to map school year + quarter → calendar date. */
export interface SchoolStartDate {
  month: number; // 1–12
  day: number;   // 1–31
  /** Reference year for "Year 1" start; e.g. 2020 means Year 1 starts Sept 1, 2020. */
  referenceYear: number;
}

// Define the Event type structure
export interface TimeType {
  _id: string;
  title: string;
  /** Canonical ISO date string used for sorting (always set). */
  date: string;
  /** When set, used for display; supports school year, month, day, or datetime. */
  dateDisplay?: DateValue;
  comment?: string;
  tags: TagType[];
}

// Define the events object type using Record for better type safety
export type TimesType = Record<string, TimeType>;
export type TagsType = Record<string, TagType>;