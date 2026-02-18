import { useState } from "react";
import type { SchoolStartDate, SchoolPeriodType } from "../types";

const PERIOD_TYPES: { value: SchoolPeriodType; label: string }[] = [
  { value: "quarter", label: "Quarter" },
  { value: "trimester", label: "Trimester" },
  { value: "semester", label: "Semester" },
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const INPUT_CLASS =
  "border border-gray-300 dark:border-gray-500 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none";

const currentYear = new Date().getFullYear();

function sortUnique(nums: number[]): number[] {
  return [...new Set(nums)].filter(Number.isInteger).sort((a, b) => a - b);
}

interface SchoolDataFormProps {
  initialData: SchoolStartDate | null;
  onSave: (data: SchoolStartDate) => void;
  compact?: boolean;
}

export default function SchoolDataForm({ initialData, onSave, compact }: SchoolDataFormProps) {
  const [referenceYear, setReferenceYear] = useState(initialData?.referenceYear ?? currentYear);
  const [month, setMonth] = useState(initialData?.month ?? 9);
  const [day, setDay] = useState(initialData?.day ?? 1);
  const [periodType, setPeriodType] = useState<SchoolPeriodType>(initialData?.periodType ?? "quarter");
  const [repeatedGrades, setRepeatedGrades] = useState<number[]>(initialData?.repeatedGrades ?? []);
  const [gapYears, setGapYears] = useState<number[]>(initialData?.gapYears ?? []);
  const [skippedGrades, setSkippedGrades] = useState<number[]>(initialData?.skippedGrades ?? []);
  const [addRepeated, setAddRepeated] = useState("");
  const [addGap, setAddGap] = useState("");
  const [addSkipped, setAddSkipped] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      referenceYear,
      month: month >= 1 && month <= 12 ? month : 9,
      day: day >= 1 && day <= 31 ? day : 1,
      periodType,
      repeatedGrades: repeatedGrades.length ? repeatedGrades : undefined,
      gapYears: gapYears.length ? gapYears : undefined,
      skippedGrades: skippedGrades.length ? skippedGrades : undefined,
    });
  }

  function addToList(
    value: string,
    setValue: (s: string) => void,
    list: number[],
    setList: (n: number[]) => void,
    min = 1,
    max = 30
  ) {
    const n = Math.floor(Number(value));
    if (!Number.isInteger(n) || n < min || n > max) return;
    setList(sortUnique([...list, n]));
    setValue("");
  }

  function removeFromList(list: number[], setList: (n: number[]) => void, item: number) {
    setList(list.filter((x) => x !== item));
  }

  const gradeListSection = (
    label: string,
    value: string, setValue: (s: string) => void,
    list: number[], setList: (n: number[]) => void,
    ariaAdd: string, ariaRemovePrefix: string
  ) => (
    <div className={`flex flex-wrap items-center gap-1.5 ${compact ? '' : 'w-11/12'}`}>
      <span className={`${compact ? 'text-sm' : 'text-sm'} font-medium text-gray-700 dark:text-gray-300`}>{label}</span>
      <input
        type="number" min={1} max={30} value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(value, setValue, list, setList))}
        placeholder="#"
        className={`${compact ? 'w-12 px-1.5 py-1.5' : 'w-20 px-2 py-2'} ${INPUT_CLASS}`}
        aria-label={ariaAdd}
      />
      <button type="button" onClick={() => addToList(value, setValue, list, setList)}
        className={compact
          ? "px-2 py-1 text-xs font-medium rounded bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
          : "min-h-[44px] px-3 py-2 text-sm font-medium rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        }>
        {compact ? '+' : 'Add'}
      </button>
      {list.map((y) => (
        <span key={y} className={`inline-flex items-center gap-0.5 ${compact ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} rounded-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200`}>
          {compact ? y : `Year ${y}`}
          <button type="button" onClick={() => removeFromList(list, setList, y)}
            className={compact ? "ml-0.5 hover:text-red-500" : "min-w-[24px] min-h-[24px] rounded hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"}
            aria-label={`${ariaRemovePrefix} ${y}`}>
            ×
          </button>
        </span>
      ))}
    </div>
  );

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex flex-row gap-3">
          {/* Left: start info + unit */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <div className="flex items-center gap-1.5">
                <label htmlFor="school-reference-year" className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Year 1</label>
                <input id="school-reference-year" type="number" min={1990} max={currentYear + 20} value={referenceYear}
                  onChange={(e) => setReferenceYear(Number(e.target.value) || currentYear)}
                  className={`w-20 px-2 py-1.5 ${INPUT_CLASS}`} aria-label="Reference year when Year 1 starts" />
              </div>
              <div className="flex items-center gap-1.5">
                <label htmlFor="school-month" className="text-sm font-medium text-gray-700 dark:text-gray-300">Month</label>
                <select id="school-month" value={month} onChange={(e) => setMonth(Number(e.target.value))}
                  className={`px-2 py-1.5 ${INPUT_CLASS}`} aria-label="Month when school year starts">
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1.5">
                <label htmlFor="school-day" className="text-sm font-medium text-gray-700 dark:text-gray-300">Day</label>
                <input id="school-day" type="number" min={1} max={31} value={day}
                  onChange={(e) => setDay(Math.max(1, Math.min(31, Number(e.target.value) || 1)))}
                  className={`w-14 px-2 py-1.5 ${INPUT_CLASS}`} aria-label="Day of month when school year starts" />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="school-period-type" className="text-sm font-medium text-gray-700 dark:text-gray-300">Calendar</label>
              <select id="school-period-type" value={periodType} onChange={(e) => setPeriodType(e.target.value as SchoolPeriodType)}
                className={`px-2 py-1.5 ${INPUT_CLASS}`} aria-label="Academic calendar">
                {PERIOD_TYPES.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>

          {/* Right: grade adjustments (scrollable) */}
          <div className="w-44 shrink-0 flex flex-col gap-1.5 min-h-0">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Adjustments</span>
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2">
              {gradeListSection('Repeated', addRepeated, setAddRepeated, repeatedGrades, setRepeatedGrades, 'Add repeated grade', 'Remove repeated year')}
              {gradeListSection('Gaps', addGap, setAddGap, gapYears, setGapYears, 'Add gap after year', 'Remove gap after year')}
              {gradeListSection('Skipped', addSkipped, setAddSkipped, skippedGrades, setSkippedGrades, 'Add skipped grade', 'Remove skipped year')}
            </div>
          </div>
        </div>

        <button type="submit"
          className="self-center px-8 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 text-white font-medium rounded-lg transition-colors touch-manipulation">
          {initialData ? "Update" : "Save"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col justify-center items-center gap-4 sm:gap-6">
      <div className="w-11/12">
        <label htmlFor="school-reference-year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Start year (Year 1 begins)
        </label>
        <input id="school-reference-year" type="number" min={1990} max={currentYear + 20} value={referenceYear}
          onChange={(e) => setReferenceYear(Number(e.target.value) || currentYear)}
          className={`w-full max-w-32 px-4 py-2 ${INPUT_CLASS}`} aria-label="Reference year when Year 1 starts" />
      </div>
      <div className="w-11/12 flex flex-wrap gap-4">
        <div>
          <label htmlFor="school-month" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start month</label>
          <select id="school-month" value={month} onChange={(e) => setMonth(Number(e.target.value))}
            className={`px-3 py-2 ${INPUT_CLASS}`} aria-label="Month when school year starts">
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="school-day" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start day</label>
          <input id="school-day" type="number" min={1} max={31} value={day}
            onChange={(e) => setDay(Math.max(1, Math.min(31, Number(e.target.value) || 1)))}
            className={`w-20 px-3 py-2 ${INPUT_CLASS}`} aria-label="Day of month when school year starts" />
        </div>
      </div>
      <div className="w-11/12">
        <label htmlFor="school-period-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Academic calendar</label>
        <select id="school-period-type" value={periodType} onChange={(e) => setPeriodType(e.target.value as SchoolPeriodType)}
          className={`px-3 py-2 ${INPUT_CLASS}`} aria-label="Academic calendar (quarter, trimester, semester)">
          {PERIOD_TYPES.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>
      <div className="w-11/12">
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Repeated grades</span>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Use this data to align school years with calendar years.</p>
        {gradeListSection('', addRepeated, setAddRepeated, repeatedGrades, setRepeatedGrades, 'Add repeated grade year number', 'Remove repeated year')}
      </div>
      <div className="w-11/12">
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gap years</span>
        {gradeListSection('', addGap, setAddGap, gapYears, setGapYears, 'Add gap after year number', 'Remove gap after year')}
      </div>
      <div className="w-11/12">
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skipped grades</span>
        {gradeListSection('', addSkipped, setAddSkipped, skippedGrades, setSkippedGrades, 'Add skipped grade year number', 'Remove skipped year')}
      </div>
      <button type="submit"
        className="w-full sm:w-auto sm:min-w-[140px] min-h-[44px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 text-white font-medium py-2 px-4 rounded-lg transition-colors touch-manipulation">
        {initialData ? "Update school data" : "Save school data"}
      </button>
    </form>
  );
}
