import { useState, useEffect } from "react";
import type {
  TodateType,
  TagType,
  TagsType,
  DateValue,
  SchoolStartDate,
  SchoolPeriodType,
} from "../types";
import { dateValueToIso, isoToDatetimeLocal } from "../utils/date";
import NewButton from "./NewButton";
import Icon from "./Icon";
import editIcon from "../assets/edit.svg?raw";
import tagIcon from "../assets/tag.svg?raw";

type DateTab = 'school' | 'calendar';

const DATE_TABS: { value: DateTab; label: string }[] = [
  { value: "school", label: "School year" },
  { value: "calendar", label: "Date" },
];

function periodCount(type: SchoolPeriodType): number {
  return type === "quarter" ? 4 : type === "trimester" ? 3 : 2;
}

function periodLabel(type: SchoolPeriodType, n: number): string {
  return type === "quarter" ? `Q${n}` : type === "trimester" ? `Tri ${n}` : `Sem ${n}`;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const INPUT_CLASS =
  "border border-gray-300 dark:border-gray-500 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none";

interface TodateFormProps {
  tags: TagsType;
  addTodate: (t: TodateType) => void;
  updateTodate?: (t: TodateType) => void;
  initialData?: TodateType | null;
  toggleTagModal: () => void;
  onEditTag?: (tag: TagType) => void;
  schoolStartDate: SchoolStartDate | null;
}

const currentYear = new Date().getFullYear();

const TodateForm = ({
  tags,
  addTodate,
  updateTodate,
  initialData,
  toggleTagModal,
  onEditTag,
  schoolStartDate,
}: TodateFormProps) => {
  const [title, setTitle] = useState("");
  const [dateTab, setDateTab] = useState<DateTab>(() =>
    schoolStartDate != null ? "school" : "calendar"
  );
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);

  // School (periodType from schoolStartDate; Grade = schoolYear, Unit = period + optional repeatedInstance)
  const [schoolYear, setSchoolYear] = useState<number>(1);
  const [period, setPeriod] = useState<number>(1);
  const [repeatedInstance, setRepeatedInstance] = useState<number | undefined>(undefined);

  // Calendar: year required; month/day optional (0 = not set); time only when day set
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(0); // 0 = not selected
  const [day, setDay] = useState<number>(0); // 0 = not selected
  const [calendarTime, setCalendarTime] = useState(""); // datetime-local, only when day set

  useEffect(() => {
    if (!initialData) return;
    setTitle(initialData.title);
    setComment(initialData.comment ?? "");
    setSelectedTags(initialData.tags.map((t) => tags[t._id] ?? t));
    const dv = initialData.dateDisplay;
    if (dv) {
      if (dv.kind === "school") {
        setDateTab("school");
        setSchoolYear(dv.schoolYear);
        const p = dv.period ?? (dv.quarter ?? 1);
        setPeriod(p);
        setRepeatedInstance(dv.repeatedInstance);
      } else {
        setDateTab("calendar");
        if (dv.kind === "month") {
          setYear(dv.year);
          setMonth(dv.month);
          setDay(0);
          setCalendarTime("");
        } else if (dv.kind === "day") {
          setYear(dv.year);
          setMonth(dv.month);
          setDay(dv.day);
          setCalendarTime("");
        } else {
          const d = new Date(dv.iso);
          setYear(d.getFullYear());
          setMonth(d.getMonth() + 1);
          setDay(d.getDate());
          setCalendarTime(isoToDatetimeLocal(dv.iso));
        }
      }
    } else {
      const d = new Date(initialData.date);
      setDateTab("calendar");
      setYear(d.getFullYear());
      setMonth(d.getMonth() + 1);
      setDay(d.getDate());
      setCalendarTime(isoToDatetimeLocal(initialData.date));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when initialData identity changes
  }, [initialData]);

  useEffect(() => {
    setSelectedTags((prev) => prev.map((t) => tags[t._id] ?? t));
  }, [tags]);

  // Sync period/repeatedInstance when grade or school data changes so selection stays valid
  const pt = schoolStartDate?.periodType ?? "quarter";
  const skipped = schoolStartDate?.skippedGrades ?? [];
  const repeated = schoolStartDate?.repeatedGrades ?? [];
  const maxP = periodCount(pt);
  const gradeSkipped = skipped.includes(schoolYear);
  const gradeRepeated = repeated.includes(schoolYear);
  useEffect(() => {
    if (dateTab !== "school") return;
    if (gradeSkipped) {
      setPeriod(1);
      setRepeatedInstance(undefined);
      return;
    }
    if (gradeRepeated) {
      const valid = (period >= 1 && period <= maxP && (repeatedInstance === undefined || repeatedInstance === 1 || repeatedInstance === 2));
      if (!valid) {
        setPeriod(1);
        setRepeatedInstance(1);
      }
      return;
    }
    if (period < 1 || period > maxP) {
      setPeriod(1);
      setRepeatedInstance(undefined);
    } else if (repeatedInstance != null) {
      setRepeatedInstance(undefined);
    }
  }, [dateTab, schoolYear, gradeSkipped, gradeRepeated, maxP, period, repeatedInstance]);

  const toggleTag = (tag: TagType) => {
    setSelectedTags((prev) =>
      prev.some((t) => t._id === tag._id)
        ? prev.filter((t) => t._id !== tag._id)
        : [...prev, tag]
    );
  };

  const removeTag = (tagId: TagType["_id"]) => {
    setSelectedTags((prev) => prev.filter((t) => t._id !== tagId));
  };

  function buildDateValue(): DateValue | null {
    if (dateTab === "school") {
      const pt = schoolStartDate?.periodType ?? "quarter";
      const maxP = periodCount(pt);
      return {
        kind: "school",
        schoolYear: Math.max(1, Math.floor(schoolYear) || 1),
        periodType: pt,
        period: Math.max(1, Math.min(maxP, Math.floor(period) || 1)),
        ...(repeatedInstance != null && repeatedInstance > 1 ? { repeatedInstance } : {}),
      };
    }
    // Calendar tab: year required; month/day/time optional
    const y = Number(year) || currentYear;
    const m = month > 0 ? Math.max(1, Math.min(12, month)) : 1;
    const d = day > 0 ? Math.max(1, Math.min(31, day)) : 0;
    if (calendarTime.trim() && d > 0) {
      return { kind: "datetime", iso: new Date(calendarTime).toISOString() };
    }
    if (d > 0) {
      return { kind: "day", year: y, month: m, day: d };
    }
    if (month > 0) {
      return { kind: "month", year: y, month: m };
    }
    return { kind: "month", year: y, month: 1 };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const dateValue = buildDateValue();
    if (!dateValue) return;
    const iso = dateValueToIso(
      dateValue,
      dateTab === "school" ? schoolStartDate ?? { referenceYear: currentYear, month: 9, day: 1, periodType: "quarter" } : undefined
    );
    const id = initialData?._id ?? crypto.randomUUID();
    const data: TodateType = {
      title,
      date: iso,
      dateDisplay: dateValue,
      comment: comment || undefined,
      tags: selectedTags,
      _id: id,
    };
    if (updateTodate && initialData) {
      updateTodate(data);
    } else {
      addTodate(data);
    }
  }

  const tagIds = Object.keys(tags);
  const effectiveMonth = month > 0 ? month : 1;
  const daysInMonth = new Date(year, effectiveMonth, 0).getDate();

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col justify-center items-center gap-4 sm:gap-6"
    >
      {/* Title - Required */}
      <div className="w-11/12">
        <label htmlFor="todate-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Title <span className="text-red-600" aria-hidden>*</span>
        </label>
        <input
          id="todate-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none invalid:border-red-500"
          placeholder="Enter todate title"
          required
          aria-required="true"
          autoComplete="off"
        />
      </div>

      {/* Date format: two tabs — School year or Date (full-width tabs on small screens) */}
      <div className="w-11/12" role="group" aria-labelledby="date-format-label">
        <p id="date-format-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          When did this happen?
        </p>
        <div
          role="tablist"
          aria-label="Date format"
          className="flex border border-b-0 rounded-t-lg border-gray-300 dark:border-gray-500"
        >
          {DATE_TABS.map((opt) => {
            const isSelected = dateTab === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={`panel-${opt.value}`}
                id={`tab-${opt.value}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setDateTab(opt.value)}
                className={`flex-1 min-w-0 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  isSelected
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <div className="border border-t-0 border-gray-300 dark:border-gray-500 rounded-b-lg p-3 min-h-[72px]">
          {dateTab === "school" && (
            <div
              id="panel-school"
              role="tabpanel"
              aria-labelledby="tab-school"
              className="flex flex-wrap gap-3 items-center"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-full">Grade</span>
              <div className="flex flex-wrap gap-2 items-center">
                <label htmlFor="todate-grade" className="sr-only">Grade (school year number)</label>
                <input
                  id="todate-grade"
                  type="number"
                  min={1}
                  max={30}
                  value={schoolYear}
                  onChange={(e) => {
                    const v = Math.max(1, Number(e.target.value) || 1);
                    setSchoolYear(v);
                    const skipped = schoolStartDate?.skippedGrades ?? [];
                    if (skipped.includes(v)) {
                      setPeriod(1);
                      setRepeatedInstance(undefined);
                    }
                  }}
                  className={`w-16 px-2 py-2 ${INPUT_CLASS}`}
                  aria-label="Grade (school year number)"
                />
              </div>
              {(() => {
                const pt = schoolStartDate?.periodType ?? "quarter";
                const skipped = schoolStartDate?.skippedGrades ?? [];
                const repeated = schoolStartDate?.repeatedGrades ?? [];
                const maxP = periodCount(pt);
                const gradeSkipped = skipped.includes(schoolYear);
                const gradeRepeated = repeated.includes(schoolYear);
                const options: { period: number; repeatedInstance?: number; label: string }[] = [];
                if (gradeSkipped) {
                  // show none
                } else if (gradeRepeated) {
                  Array.from({ length: maxP }, (_, i) => i + 1).forEach((n) =>
                    options.push({ period: n, repeatedInstance: 1, label: periodLabel(pt, n) })
                  );
                  Array.from({ length: maxP }, (_, i) => i + 1).forEach((n) =>
                    options.push({ period: n, repeatedInstance: 2, label: `${periodLabel(pt, n)} (2nd)` })
                  );
                } else {
                  Array.from({ length: maxP }, (_, i) => i + 1).forEach((n) =>
                    options.push({ period: n, label: periodLabel(pt, n) })
                  );
                }
                const currentOpt = options.find(
                  (o) => o.period === period && (o.repeatedInstance ?? 1) === (repeatedInstance ?? 1)
                );
                const valueStr = currentOpt
                  ? `${currentOpt.period}-${currentOpt.repeatedInstance ?? 1}`
                  : options[0] ? `${options[0].period}-${options[0].repeatedInstance ?? 1}` : "";
                return (
                  <>
                    <label htmlFor="todate-unit" className="text-sm text-gray-700 dark:text-gray-300">
                      Unit
                    </label>
                    <select
                      id="todate-unit"
                      value={valueStr}
                      onChange={(e) => {
                        const [p, r] = e.target.value.split("-").map(Number);
                        setPeriod(p);
                        setRepeatedInstance(r > 1 ? r : undefined);
                      }}
                      disabled={gradeSkipped || options.length === 0}
                      className={`px-3 py-2 ${INPUT_CLASS}`}
                      aria-label={gradeSkipped ? "No units (grade skipped)" : "Unit (period within grade)"}
                    >
                      {options.length === 0 && <option value="">—</option>}
                      {options.map((o) => (
                        <option key={`${o.period}-${o.repeatedInstance ?? 1}`} value={`${o.period}-${o.repeatedInstance ?? 1}`}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </>
                );
              })()}
            </div>
          )}

          {dateTab === "calendar" && (
            <div
              id="panel-calendar"
              role="tabpanel"
              aria-labelledby="tab-calendar"
              className="flex flex-col gap-3"
            >
              <div className="flex flex-wrap gap-2 items-center">
                <label htmlFor="calendar-year" className="text-sm text-gray-700 dark:text-gray-300">
                  Year <span className="text-red-600" aria-hidden>*</span>
                </label>
                <input
                  id="calendar-year"
                  type="number"
                  min={1990}
                  max={currentYear + 20}
                  aria-label="Year (required)"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value) || currentYear)}
                  className={`w-24 px-3 py-2 ${INPUT_CLASS}`}
                />
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <label htmlFor="calendar-month" className="text-sm text-gray-700 dark:text-gray-300">
                  Month <span className="text-gray-500 dark:text-gray-400 text-xs">(optional)</span>
                </label>
                <select
                  id="calendar-month"
                  aria-label="Month (optional)"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className={`px-3 py-2 ${INPUT_CLASS}`}
                >
                  <option value={0}>—</option>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <label htmlFor="calendar-day" className="text-sm text-gray-700 dark:text-gray-300">
                  Day <span className="text-gray-500 dark:text-gray-400 text-xs">(optional)</span>
                </label>
                <input
                  id="calendar-day"
                  type="number"
                  min={0}
                  max={daysInMonth}
                  aria-label="Day (optional)"
                  value={day || ""}
                  onChange={(e) => {
                    const v = e.target.value === "" ? 0 : Math.max(0, Math.min(daysInMonth, Number(e.target.value) || 0));
                    setDay(v);
                    if (v === 0) setCalendarTime("");
                  }}
                  placeholder="—"
                  className={`w-16 px-2 py-2 ${INPUT_CLASS}`}
                />
              </div>
              {day > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                  <label htmlFor="calendar-time" className="text-sm text-gray-700 dark:text-gray-300">
                    Time <span className="text-gray-500 dark:text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    id="calendar-time"
                    type="datetime-local"
                    aria-label="Date and time (optional)"
                    value={calendarTime}
                    onChange={(e) => setCalendarTime(e.target.value)}
                    className={`px-4 py-2 ${INPUT_CLASS}`}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comment - Optional */}
      <div className="w-11/12">
        <label htmlFor="todate-comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Comment <span className="text-gray-500 dark:text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="todate-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full min-h-[80px] px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-y"
          placeholder="Add a note..."
          rows={3}
          aria-describedby="comment-optional"
        />
        <span id="comment-optional" className="sr-only">Optional field</span>
      </div>

      {/* Tags - Required */}
      <div className="w-11/12">
        <div className="flex flex-row items-center justify-between gap-2 mb-1 shrink-0">
          <span id="tags-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tags <span className="text-gray-500 dark:text-gray-400 text-xs">(optional)</span>
          </span>
          <NewButton className="w-fit h-fit" name="Tag" action={toggleTagModal} ariaLabel="Create new tag" icon={tagIcon} />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2" id="tags-hint">
          The todate card uses the first tag&apos;s color. Multiple tags are supported for filtering.
        </p>
        <div
          className="relative border rounded-lg p-2 min-h-12 max-h-40 overflow-y-auto bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-500"
          role="listbox"
          aria-labelledby="tags-label"
          aria-multiselectable
          aria-label="Available tags; click to toggle selection"
          aria-describedby="tags-hint"
        >
          {tagIds.length === 0 ? (
            <p className="text-sm text-gray-500 py-2 w-fit" role="status">
              No tags yet. Create one or save without tags.
            </p>
          ) : (
            tagIds.map((tagId) => {
              const tag = tags[tagId];
              const isSelected = selectedTags.some((t) => t._id === tag._id);
              return (
                <button
                  key={tag._id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => toggleTag(tag)}
                  className={`w-full text-left cursor-pointer px-3 py-2 rounded text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-inset touch-manipulation text-gray-900 dark:text-gray-100 ${
                    isSelected ? "bg-gray-200 dark:bg-gray-600" : ""
                  }`}
                >
                  <span
                    className="inline-block w-3 h-3 rounded mr-0.5 shrink-0"
                    style={{ backgroundColor: tag.color }}
                    aria-hidden
                  />
                  <span className="flex-1 min-w-0 truncate">{tag.name}</span>
                  {onEditTag ? (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEditTag(tag);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          onEditTag(tag);
                        }
                      }}
                      className="shrink-0 min-h-[32px] min-w-[32px] inline-flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer text-gray-600 dark:text-gray-400 touch-manipulation"
                      aria-label={`Edit ${tag.name}`}
                    >
                      <Icon src={editIcon} className="w-4 h-4" />
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </div>
      {selectedTags.length > 0 ? (
        <div
          className="flex flex-wrap gap-2 mb-2 min-h-10 w-11/12"
          role="list"
          aria-label="Selected tags"
        >
          {selectedTags.map((tag) => (
            <span
              key={tag._id}
              className="px-3 py-1 rounded-full text-sm font-medium inline-flex items-center bg-gray-200 dark:bg-gray-600"
            >
              <span
                className="inline-block w-3 h-3 rounded mr-2 shrink-0"
                style={{ backgroundColor: tag.color }}
                aria-hidden
              />
              {tag.name}
              <button
                type="button"
                onClick={() => removeTag(tag._id)}
                className="ml-1.5 min-h-[24px] min-w-[24px] inline-flex items-center justify-center rounded hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer"
                aria-label={`Remove ${tag.name} from selection`}
              >
                <span aria-hidden>&times;</span>
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <button
        type="submit"
        className="w-full min-h-[44px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-2 text-white font-medium py-2 px-4 rounded-lg transition-colors touch-manipulation"
      >
        {initialData ? "Update Todate" : "Save Todate"}
      </button>
    </form>
  );
};

export default TodateForm;
