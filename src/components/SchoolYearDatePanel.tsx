import type { SchoolStartDate, SchoolPeriodType } from '../types';
import { INPUT_CLASS } from '../constants';
import { periodCount } from '../utils/schoolPeriod';

function periodLabel(type: SchoolPeriodType, n: number): string {
  return type === 'quarter' ? `Q${n}` : type === 'trimester' ? `Tri ${n}` : `Sem ${n}`;
}

export interface SchoolYearDatePanelProps {
  fieldPrefix: string;
  grade: number;
  setGrade: (n: number) => void;
  period: number;
  setPeriod: (n: number) => void;
  repeatedInstance: number | undefined;
  setRepeatedInstance: (n: number | undefined) => void;
  schoolStartDate: SchoolStartDate | null;
  compact: boolean;
  onOpenSchoolData?: () => void;
}

export default function SchoolYearDatePanel({
  fieldPrefix,
  grade,
  setGrade,
  period,
  setPeriod,
  repeatedInstance,
  setRepeatedInstance,
  schoolStartDate,
  compact,
  onOpenSchoolData,
}: SchoolYearDatePanelProps) {
  if (!schoolStartDate) {
    return (
      <div
        id={`panel-${fieldPrefix}school`}
        role="tabpanel"
        aria-labelledby={`tab-${fieldPrefix}school`}
        className={`${compact ? 'h-full' : ''} flex flex-col items-center justify-center gap-2 py-3`}
      >
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          School data is not configured yet.
        </p>
        {onOpenSchoolData && (
          <button
            type="button"
            onClick={onOpenSchoolData}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
          >
            Set up school data
          </button>
        )}
      </div>
    );
  }

  const periodType = schoolStartDate.periodType ?? 'quarter';
  const skippedGrades = schoolStartDate.skippedGrades ?? [];
  const repeatedGrades = schoolStartDate.repeatedGrades ?? [];
  const periodsPerYear = periodCount(periodType);
  const isGradeSkipped = skippedGrades.includes(grade);
  const isGradeRepeated = repeatedGrades.includes(grade);

  const options: { period: number; repeatedInstance?: number; label: string }[] = [];
  if (!isGradeSkipped) {
    if (isGradeRepeated) {
      Array.from({ length: periodsPerYear }, (_, i) => i + 1).forEach((n) =>
        options.push({ period: n, repeatedInstance: 1, label: periodLabel(periodType, n) })
      );
      Array.from({ length: periodsPerYear }, (_, i) => i + 1).forEach((n) =>
        options.push({ period: n, repeatedInstance: 2, label: `${periodLabel(periodType, n)} (2nd)` })
      );
    } else {
      Array.from({ length: periodsPerYear }, (_, i) => i + 1).forEach((n) =>
        options.push({ period: n, label: periodLabel(periodType, n) })
      );
    }
  }

  const selectedUnitOption = options.find(
    (o) => o.period === period && (o.repeatedInstance ?? 1) === (repeatedInstance ?? 1)
  );
  const unitOptionValue = selectedUnitOption
    ? `${selectedUnitOption.period}-${selectedUnitOption.repeatedInstance ?? 1}`
    : options[0]
      ? `${options[0].period}-${options[0].repeatedInstance ?? 1}`
      : '';

  const rowClass = compact ? 'flex items-center justify-between gap-2 min-w-0' : '';
  const labelClass = compact ? 'text-xs font-medium text-gray-600 dark:text-gray-400 shrink-0 w-10' : 'text-sm text-gray-700 dark:text-gray-300';
  const inputClass = compact
    ? `flex-1 min-w-0 px-2 py-1.5 ${INPUT_CLASS}`
    : `w-14 px-2 py-2 ${INPUT_CLASS}`;
  const selectClass = compact
    ? `flex-1 min-w-0 pl-2 pr-7 py-1.5 ${INPUT_CLASS}`
    : `pl-2 pr-7 py-2 ${INPUT_CLASS}`;

  if (compact) {
    return (
      <div
        id={`panel-${fieldPrefix}school`}
        role="tabpanel"
        aria-labelledby={`tab-${fieldPrefix}school`}
        className="h-full flex flex-col justify-evenly"
      >
        <div className={rowClass}>
          <label htmlFor={`${fieldPrefix}grade`} className={labelClass}>
            Grade
          </label>
          <input
            id={`${fieldPrefix}grade`}
            type="number"
            min={1}
            max={30}
            value={grade}
            onChange={(e) => {
              const v = Math.max(1, Number(e.target.value) || 1);
              setGrade(v);
              if (skippedGrades.includes(v)) {
                setPeriod(1);
                setRepeatedInstance(undefined);
              }
            }}
            className={inputClass}
            aria-label={`${fieldPrefix ? 'End g' : 'G'}rade`}
          />
        </div>
        <div className={rowClass}>
          <label htmlFor={`${fieldPrefix}unit`} className={labelClass}>
            Unit
          </label>
          <select
            id={`${fieldPrefix}unit`}
            value={unitOptionValue}
            onChange={(e) => {
              const [p, r] = e.target.value.split('-').map(Number);
              setPeriod(p);
              setRepeatedInstance(r > 1 ? r : undefined);
            }}
            disabled={isGradeSkipped || options.length === 0}
            className={selectClass}
            aria-label={isGradeSkipped ? 'No units (grade skipped)' : `${fieldPrefix ? 'End u' : 'U'}nit`}
          >
            {options.length === 0 && <option value="">—</option>}
            {options.map((o) => (
              <option key={`${o.period}-${o.repeatedInstance ?? 1}`} value={`${o.period}-${o.repeatedInstance ?? 1}`}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <div
      id={`panel-${fieldPrefix}school`}
      role="tabpanel"
      aria-labelledby={`tab-${fieldPrefix}school`}
      className="flex flex-wrap gap-2 items-center"
    >
      <label htmlFor={`${fieldPrefix}grade`} className={labelClass}>
        Grade
      </label>
      <input
        id={`${fieldPrefix}grade`}
        type="number"
        min={1}
        max={30}
        value={grade}
        onChange={(e) => {
          const v = Math.max(1, Number(e.target.value) || 1);
          setGrade(v);
          if (skippedGrades.includes(v)) {
            setPeriod(1);
            setRepeatedInstance(undefined);
          }
        }}
        className={inputClass}
        aria-label={`${fieldPrefix ? 'End g' : 'G'}rade`}
      />
      <label htmlFor={`${fieldPrefix}unit`} className={labelClass}>
        Unit
      </label>
      <select
        id={`${fieldPrefix}unit`}
        value={unitOptionValue}
        onChange={(e) => {
          const [p, r] = e.target.value.split('-').map(Number);
          setPeriod(p);
          setRepeatedInstance(r > 1 ? r : undefined);
        }}
        disabled={isGradeSkipped || options.length === 0}
        className={selectClass}
        aria-label={isGradeSkipped ? 'No units (grade skipped)' : `${fieldPrefix ? 'End u' : 'U'}nit`}
      >
        {options.length === 0 && <option value="">—</option>}
        {options.map((o) => (
          <option key={`${o.period}-${o.repeatedInstance ?? 1}`} value={`${o.period}-${o.repeatedInstance ?? 1}`}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
