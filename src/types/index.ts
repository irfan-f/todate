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

/** Dataset: one named collection of todates, tags, and optional school start. */
export interface Dataset {
  id: string;
  name: string;
  todates: TodatesType;
  tags: TagsType;
  schoolStartDate?: SchoolStartDate | null;
  updatedAt?: string;
}

/** Store: all datasets plus the active dataset id. */
export interface Store {
  activeId: string;
  datasets: Record<string, Dataset>;
}

/** Import payload: one dataset's content (e.g. from a profile file or one dataset of a store). */
export interface SingleDatasetPayload {
  name?: string;
  todates: TodatesType;
  tags: TagsType;
  schoolStartDate?: SchoolStartDate | null;
}

export function isSingleDatasetPayload(x: unknown): x is SingleDatasetPayload {
  if (x === null || typeof x !== 'object' || Array.isArray(x)) return false;
  const o = x as Record<string, unknown>;
  if (!isTodatesType(o.todates)) return false;
  if (!isTagsType(o.tags)) return false;
  if (o.name !== undefined && typeof o.name !== 'string') return false;
  if (o.schoolStartDate !== undefined && o.schoolStartDate !== null && !isSchoolStartDate(o.schoolStartDate)) return false;
  return true;
}

function isRecordOf(
  obj: unknown,
  keyCheck: (k: string) => boolean,
  valueCheck: (v: unknown) => boolean
): obj is Record<string, unknown> {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return false;
  return Object.entries(obj).every(([k, v]) => keyCheck(k) && valueCheck(v));
}

export function isTagType(x: unknown): x is TagType {
  if (x === null || typeof x !== 'object' || Array.isArray(x)) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o._id === 'string' &&
    o._id.length > 0 &&
    typeof o.name === 'string' &&
    typeof o.color === 'string'
  );
}

export function isSchoolStartDate(x: unknown): x is SchoolStartDate {
  if (x === null || typeof x !== 'object' || Array.isArray(x)) return false;
  const o = x as Record<string, unknown>;
  return typeof o.referenceYear === 'number' && Number.isInteger(o.referenceYear);
}

export function isDateValue(x: unknown): x is DateValue {
  if (x === null || typeof x !== 'object' || Array.isArray(x)) return false;
  const o = x as Record<string, unknown>;
  if (o.kind === 'school')
    return typeof (o as unknown as DateValueSchool).schoolYear === 'number';
  if (o.kind === 'month')
    return typeof (o as unknown as DateValueMonth).year === 'number' && typeof (o as unknown as DateValueMonth).month === 'number';
  if (o.kind === 'day')
    return typeof (o as unknown as DateValueDay).year === 'number' && typeof (o as unknown as DateValueDay).month === 'number' && typeof (o as unknown as DateValueDay).day === 'number';
  if (o.kind === 'datetime')
    return typeof (o as unknown as DateValueDatetime).iso === 'string';
  return false;
}

export function isTodateType(x: unknown): x is TodateType {
  if (x === null || typeof x !== 'object' || Array.isArray(x)) return false;
  const o = x as Record<string, unknown>;
  if (typeof o._id !== 'string' || o._id.length === 0) return false;
  if (typeof o.title !== 'string') return false;
  if (typeof o.date !== 'string') return false;
  if (!Array.isArray(o.tags)) return false;
  return (o.tags as unknown[]).every((t) => isTagType(t));
}

export function isTodatesType(x: unknown): x is TodatesType {
  return isRecordOf(x, () => true, isTodateType);
}

export function isTagsType(x: unknown): x is TagsType {
  return isRecordOf(x, () => true, isTagType);
}

export function isDataset(x: unknown): x is Dataset {
  if (x === null || typeof x !== 'object' || Array.isArray(x)) return false;
  const o = x as Record<string, unknown>;
  if (typeof o.id !== 'string' || o.id.length === 0) return false;
  if (typeof o.name !== 'string') return false;
  if (!isTodatesType(o.todates)) return false;
  if (!isTagsType(o.tags)) return false;
  if (o.schoolStartDate !== undefined && o.schoolStartDate !== null && !isSchoolStartDate(o.schoolStartDate)) return false;
  if (o.updatedAt !== undefined && typeof o.updatedAt !== 'string') return false;
  return true;
}

export function isStore(x: unknown): x is Store {
  if (x === null || typeof x !== 'object' || Array.isArray(x)) return false;
  const o = x as Record<string, unknown>;
  if (typeof o.activeId !== 'string') return false;
  if (o.datasets === null || typeof o.datasets !== 'object' || Array.isArray(o.datasets)) return false;
  return Object.values(o.datasets as Record<string, unknown>).every((d) => isDataset(d));
}
