import { MONTHS, INPUT_CLASS } from '../constants';

const currentYear = new Date().getFullYear();

export interface CalendarDatePanelProps {
  fieldPrefix: string;
  year: number;
  setYear: (n: number) => void;
  month: number;
  setMonth: (n: number) => void;
  day: number;
  setDay: (n: number) => void;
  timeValue: string;
  setTimeValue: (s: string) => void;
  compact: boolean;
}

export default function CalendarDatePanel({
  fieldPrefix,
  year,
  setYear,
  month,
  setMonth,
  day,
  setDay,
  timeValue,
  setTimeValue,
  compact,
}: CalendarDatePanelProps) {
  const effectiveMonth = month > 0 ? month : 1;
  const daysInMonth = new Date(year, effectiveMonth, 0).getDate();
  const clampedDay = day > 0 ? Math.min(day, daysInMonth) : day;

  if (clampedDay !== day && day > 0) {
    queueMicrotask(() => setDay(clampedDay));
  }

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
    if (day > 0 && month > 0) {
      const newDaysInMonth = new Date(newYear, month, 0).getDate();
      if (day > newDaysInMonth) setDay(newDaysInMonth);
    }
  };

  const handleMonthChange = (newMonth: number) => {
    setMonth(newMonth);
    if (day > 0 && newMonth > 0) {
      const newDaysInMonth = new Date(year, newMonth, 0).getDate();
      if (day > newDaysInMonth) setDay(newDaysInMonth);
    }
    if (newMonth <= 0) {
      setDay(0);
      setTimeValue('');
    }
  };

  const rowClass = compact ? 'flex items-center justify-between gap-2 min-w-0' : '';
  const labelClass = compact ? 'text-xs font-medium text-muted shrink-0 w-10' : 'text-sm text-on-surface shrink-0';
  const inputClass = compact
    ? `flex-1 min-w-0 px-2 py-1.5 ${INPUT_CLASS}`
    : `min-w-20 w-20 px-2 py-2 ${INPUT_CLASS}`;
  const monthInputClass = compact
    ? `flex-1 min-w-0 pl-2 pr-7 py-1.5 ${INPUT_CLASS}`
    : `w-24 min-w-0 pl-2 pr-7 py-2 ${INPUT_CLASS}`;
  const dayInputClass = compact
    ? `flex-1 min-w-0 px-2 py-1.5 ${INPUT_CLASS}`
    : `min-w-14 w-14 px-2 py-2 ${INPUT_CLASS}`;

  if (compact) {
    return (
      <div
        id={`panel-${fieldPrefix}calendar`}
        role="tabpanel"
        aria-labelledby={`tab-${fieldPrefix}calendar`}
        className="h-full flex flex-col justify-evenly"
      >
        <div className={rowClass}>
          <label htmlFor={`${fieldPrefix}cal-year`} className={labelClass}>
            Year
          </label>
          <input
            id={`${fieldPrefix}cal-year`}
            type="number"
            min={1990}
            max={currentYear + 20}
            value={year}
            onChange={(e) => handleYearChange(Number(e.target.value) || currentYear)}
            className={inputClass}
            aria-label={`${fieldPrefix ? 'End y' : 'Y'}ear`}
          />
        </div>
        <div className={rowClass}>
          <label htmlFor={`${fieldPrefix}cal-month`} className={labelClass}>
            Month
          </label>
          <select
            id={`${fieldPrefix}cal-month`}
            value={month}
            onChange={(e) => handleMonthChange(Number(e.target.value))}
            className={monthInputClass}
            aria-label={`${fieldPrefix ? 'End m' : 'M'}onth`}
          >
            <option value={0}>—</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className={rowClass}>
          <label htmlFor={`${fieldPrefix}cal-day`} className={labelClass}>
            Day
          </label>
          <input
            id={`${fieldPrefix}cal-day`}
            type="number"
            min={0}
            max={daysInMonth}
            value={clampedDay || ''}
            placeholder="—"
            disabled={month <= 0}
            onChange={(e) => {
              const v = e.target.value === '' ? 0 : Math.max(0, Math.min(daysInMonth, Number(e.target.value) || 0));
              setDay(v);
              if (v === 0) setTimeValue('');
            }}
            className={inputClass}
            aria-label={`${fieldPrefix ? 'End d' : 'D'}ay`}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      id={`panel-${fieldPrefix}calendar`}
      role="tabpanel"
      aria-labelledby={`tab-${fieldPrefix}calendar`}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-wrap gap-2 items-center min-w-0">
        <label htmlFor={`${fieldPrefix}cal-year`} className={labelClass}>
          Year
        </label>
        <input
          id={`${fieldPrefix}cal-year`}
          type="number"
          min={1990}
          max={currentYear + 20}
          value={year}
          onChange={(e) => handleYearChange(Number(e.target.value) || currentYear)}
          className={inputClass}
          aria-label={`${fieldPrefix ? 'End y' : 'Y'}ear`}
        />
      </div>
      <div className="flex flex-wrap gap-2 items-center min-w-0">
        <label htmlFor={`${fieldPrefix}cal-month`} className={labelClass}>
          Month
        </label>
        <select
          id={`${fieldPrefix}cal-month`}
          value={month}
          onChange={(e) => handleMonthChange(Number(e.target.value))}
          className={monthInputClass}
          aria-label={`${fieldPrefix ? 'End m' : 'M'}onth`}
        >
          <option value={0}>—</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2 items-center min-w-0">
        <label htmlFor={`${fieldPrefix}cal-day`} className={labelClass}>
          Day
        </label>
        <input
          id={`${fieldPrefix}cal-day`}
          type="number"
          min={0}
          max={daysInMonth}
          value={clampedDay || ''}
          placeholder="—"
          disabled={month <= 0}
          onChange={(e) => {
            const v = e.target.value === '' ? 0 : Math.max(0, Math.min(daysInMonth, Number(e.target.value) || 0));
            setDay(v);
            if (v === 0) setTimeValue('');
          }}
          className={dayInputClass}
          aria-label={`${fieldPrefix ? 'End d' : 'D'}ay`}
        />
      </div>
      {clampedDay > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <label htmlFor={`${fieldPrefix}cal-time`} className={labelClass}>
            Time
          </label>
          <input
            id={`${fieldPrefix}cal-time`}
            type="datetime-local"
            value={timeValue}
            onChange={(e) => setTimeValue(e.target.value)}
            className={`px-2 py-2 ${INPUT_CLASS}`}
            aria-label={`${fieldPrefix ? 'End t' : 'T'}ime`}
          />
        </div>
      )}
    </div>
  );
}
