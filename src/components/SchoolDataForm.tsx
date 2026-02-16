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
}

export default function SchoolDataForm({ initialData, onSave }: SchoolDataFormProps) {
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

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col justify-center items-center gap-4 sm:gap-6"
    >
      <div className="w-11/12">
        <label htmlFor="school-reference-year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Start year (Year 1 begins)
        </label>
        <input
          id="school-reference-year"
          type="number"
          min={1990}
          max={currentYear + 20}
          value={referenceYear}
          onChange={(e) => setReferenceYear(Number(e.target.value) || currentYear)}
          className={`w-full max-w-32 px-4 py-2 ${INPUT_CLASS}`}
          aria-label="Reference year when Year 1 starts"
        />
      </div>

      <div className="w-11/12 flex flex-wrap gap-4">
        <div>
          <label htmlFor="school-month" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start month
          </label>
          <select
            id="school-month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className={`px-3 py-2 ${INPUT_CLASS}`}
            aria-label="Month when school year starts"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="school-day" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start day
          </label>
          <input
            id="school-day"
            type="number"
            min={1}
            max={31}
            value={day}
            onChange={(e) => setDay(Math.max(1, Math.min(31, Number(e.target.value) || 1)))}
            className={`w-20 px-3 py-2 ${INPUT_CLASS}`}
            aria-label="Day of month when school year starts"
          />
        </div>
      </div>

      <div className="w-11/12">
        <label htmlFor="school-period-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Academic calendar
        </label>
        <select
          id="school-period-type"
          value={periodType}
          onChange={(e) => setPeriodType(e.target.value as SchoolPeriodType)}
          className={`px-3 py-2 ${INPUT_CLASS}`}
          aria-label="Academic calendar (quarter, trimester, semester)"
        >
          {PERIOD_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="w-11/12">
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Repeated grades (school years you repeated)
        </span>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Use this data to align school years with calendar years.
        </p>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="number"
            min={1}
            max={30}
            value={addRepeated}
            onChange={(e) => setAddRepeated(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(addRepeated, setAddRepeated, repeatedGrades, setRepeatedGrades))}
            placeholder="Year #"
            className={`w-20 px-2 py-2 ${INPUT_CLASS}`}
            aria-label="Add repeated grade year number"
          />
          <button
            type="button"
            onClick={() => addToList(addRepeated, setAddRepeated, repeatedGrades, setRepeatedGrades)}
            className="min-h-[44px] px-3 py-2 text-sm font-medium rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Add
          </button>
          {repeatedGrades.map((y) => (
            <span
              key={y}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-200 dark:bg-gray-600"
            >
              Year {y}
              <button
                type="button"
                onClick={() => removeFromList(repeatedGrades, setRepeatedGrades, y)}
                className="min-w-[24px] min-h-[24px] rounded hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                aria-label={`Remove repeated year ${y}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="w-11/12">
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Gap years (after which school year you had a gap)
        </span>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="number"
            min={1}
            max={30}
            value={addGap}
            onChange={(e) => setAddGap(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(addGap, setAddGap, gapYears, setGapYears))}
            placeholder="After year #"
            className={`w-20 px-2 py-2 ${INPUT_CLASS}`}
            aria-label="Add gap after year number"
          />
          <button
            type="button"
            onClick={() => addToList(addGap, setAddGap, gapYears, setGapYears)}
            className="min-h-[44px] px-3 py-2 text-sm font-medium rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Add
          </button>
          {gapYears.map((y) => (
            <span
              key={y}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-200 dark:bg-gray-600"
            >
              After {y}
              <button
                type="button"
                onClick={() => removeFromList(gapYears, setGapYears, y)}
                className="min-w-[24px] min-h-[24px] rounded hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                aria-label={`Remove gap after year ${y}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="w-11/12">
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Skipped grades (school years you skipped)
        </span>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="number"
            min={1}
            max={30}
            value={addSkipped}
            onChange={(e) => setAddSkipped(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addToList(addSkipped, setAddSkipped, skippedGrades, setSkippedGrades))}
            placeholder="Year #"
            className={`w-20 px-2 py-2 ${INPUT_CLASS}`}
            aria-label="Add skipped grade year number"
          />
          <button
            type="button"
            onClick={() => addToList(addSkipped, setAddSkipped, skippedGrades, setSkippedGrades)}
            className="min-h-[44px] px-3 py-2 text-sm font-medium rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Add
          </button>
          {skippedGrades.map((y) => (
            <span
              key={y}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-200 dark:bg-gray-600"
            >
              Year {y}
              <button
                type="button"
                onClick={() => removeFromList(skippedGrades, setSkippedGrades, y)}
                className="min-w-[24px] min-h-[24px] rounded hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                aria-label={`Remove skipped year ${y}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full sm:w-auto sm:min-w-[140px] min-h-[44px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 text-white font-medium py-2 px-4 rounded-lg transition-colors touch-manipulation"
      >
        {initialData ? "Update school data" : "Save school data"}
      </button>
    </form>
  );
}
