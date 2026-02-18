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
  compact?: boolean;
  onAddTag?: (t: TagType) => void;
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
  compact,
  onAddTag,
}: TodateFormProps) => {
  const [title, setTitle] = useState("");
  const [dateTab, setDateTab] = useState<DateTab>(() =>
    schoolStartDate != null ? "school" : "calendar"
  );
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");

  // School (periodType from schoolStartDate; Grade = schoolYear, Unit = period + optional repeatedInstance)
  const [schoolYear, setSchoolYear] = useState<number>(1);
  const [period, setPeriod] = useState<number>(1);
  const [repeatedInstance, setRepeatedInstance] = useState<number | undefined>(undefined);

  // Calendar: year required; month/day optional (0 = not set); time only when day set
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(0); // 0 = not selected
  const [day, setDay] = useState<number>(0); // 0 = not selected
  const [calendarTime, setCalendarTime] = useState(""); // datetime-local, only when day set

  // Optional end date (same shape as start: school or calendar)
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDateTab, setEndDateTab] = useState<DateTab>(() =>
    schoolStartDate != null ? "school" : "calendar"
  );
  const [schoolYearEnd, setSchoolYearEnd] = useState<number>(1);
  const [periodEnd, setPeriodEnd] = useState<number>(1);
  const [repeatedInstanceEnd, setRepeatedInstanceEnd] = useState<number | undefined>(undefined);
  const [yearEnd, setYearEnd] = useState<number>(new Date().getFullYear());
  const [monthEnd, setMonthEnd] = useState<number>(0);
  const [dayEnd, setDayEnd] = useState<number>(0);
  const [calendarTimeEnd, setCalendarTimeEnd] = useState("");

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
    const edv = initialData.endDateDisplay;
    if (edv) {
      setHasEndDate(true);
      if (edv.kind === "school") {
        setEndDateTab("school");
        setSchoolYearEnd(edv.schoolYear);
        setPeriodEnd(edv.period ?? (edv.quarter ?? 1));
        setRepeatedInstanceEnd(edv.repeatedInstance);
      } else {
        setEndDateTab("calendar");
        if (edv.kind === "month") {
          setYearEnd(edv.year);
          setMonthEnd(edv.month);
          setDayEnd(0);
          setCalendarTimeEnd("");
        } else if (edv.kind === "day") {
          setYearEnd(edv.year);
          setMonthEnd(edv.month);
          setDayEnd(edv.day);
          setCalendarTimeEnd("");
        } else {
          const d = new Date(edv.iso);
          setYearEnd(d.getFullYear());
          setMonthEnd(d.getMonth() + 1);
          setDayEnd(d.getDate());
          setCalendarTimeEnd(isoToDatetimeLocal(edv.iso));
        }
      }
    } else {
      setHasEndDate(false);
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

  const gradeSkippedEnd = (schoolStartDate?.skippedGrades ?? []).includes(schoolYearEnd);
  const gradeRepeatedEnd = (schoolStartDate?.repeatedGrades ?? []).includes(schoolYearEnd);
  const maxPEnd = periodCount(schoolStartDate?.periodType ?? "quarter");
  useEffect(() => {
    if (!hasEndDate || endDateTab !== "school") return;
    if (gradeSkippedEnd) {
      setPeriodEnd(1);
      setRepeatedInstanceEnd(undefined);
      return;
    }
    if (gradeRepeatedEnd) {
      const valid =
        periodEnd >= 1 &&
        periodEnd <= maxPEnd &&
        (repeatedInstanceEnd === undefined || repeatedInstanceEnd === 1 || repeatedInstanceEnd === 2);
      if (!valid) {
        setPeriodEnd(1);
        setRepeatedInstanceEnd(1);
      }
      return;
    }
    if (periodEnd < 1 || periodEnd > maxPEnd) {
      setPeriodEnd(1);
      setRepeatedInstanceEnd(undefined);
    } else if (repeatedInstanceEnd != null) {
      setRepeatedInstanceEnd(undefined);
    }
  }, [hasEndDate, endDateTab, schoolYearEnd, gradeSkippedEnd, gradeRepeatedEnd, maxPEnd, periodEnd, repeatedInstanceEnd]);

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

  function buildEndDateValue(): DateValue | null {
    if (!hasEndDate) return null;
    if (endDateTab === "school") {
      const pt = schoolStartDate?.periodType ?? "quarter";
      const maxP = periodCount(pt);
      return {
        kind: "school",
        schoolYear: Math.max(1, Math.floor(schoolYearEnd) || 1),
        periodType: pt,
        period: Math.max(1, Math.min(maxP, Math.floor(periodEnd) || 1)),
        ...(repeatedInstanceEnd != null && repeatedInstanceEnd > 1 ? { repeatedInstance: repeatedInstanceEnd } : {}),
      };
    }
    const y = Number(yearEnd) || currentYear;
    const m = monthEnd > 0 ? Math.max(1, Math.min(12, monthEnd)) : 1;
    const d = dayEnd > 0 ? Math.max(1, Math.min(31, dayEnd)) : 0;
    if (calendarTimeEnd.trim() && d > 0) {
      return { kind: "datetime", iso: new Date(calendarTimeEnd).toISOString() };
    }
    if (d > 0) {
      return { kind: "day", year: y, month: m, day: d };
    }
    if (monthEnd > 0) {
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
    const endDateValue = buildEndDateValue();
    const id = initialData?._id ?? crypto.randomUUID();
    const data: TodateType = {
      title,
      date: iso,
      dateDisplay: dateValue,
      ...(endDateValue ? { endDateDisplay: endDateValue } : {}),
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

  /* ─── shared helpers that render date tab contents ─── */
  const schoolPanel = (
    prefix: string,
    grade: number, setGrade: (n: number) => void,
    per: number, setPer: (n: number) => void,
    ri: number | undefined, setRi: (n: number | undefined) => void
  ) => {
    const pt = schoolStartDate?.periodType ?? "quarter";
    const skippedG = schoolStartDate?.skippedGrades ?? [];
    const repeatedG = schoolStartDate?.repeatedGrades ?? [];
    const maxPV = periodCount(pt);
    const gradeSkippedV = skippedG.includes(grade);
    const gradeRepeatedV = repeatedG.includes(grade);
    const options: { period: number; repeatedInstance?: number; label: string }[] = [];
    if (!gradeSkippedV) {
      if (gradeRepeatedV) {
        Array.from({ length: maxPV }, (_, i) => i + 1).forEach((n) => options.push({ period: n, repeatedInstance: 1, label: periodLabel(pt, n) }));
        Array.from({ length: maxPV }, (_, i) => i + 1).forEach((n) => options.push({ period: n, repeatedInstance: 2, label: `${periodLabel(pt, n)} (2nd)` }));
      } else {
        Array.from({ length: maxPV }, (_, i) => i + 1).forEach((n) => options.push({ period: n, label: periodLabel(pt, n) }));
      }
    }
    const curOpt = options.find((o) => o.period === per && (o.repeatedInstance ?? 1) === (ri ?? 1));
    const valStr = curOpt ? `${curOpt.period}-${curOpt.repeatedInstance ?? 1}` : options[0] ? `${options[0].period}-${options[0].repeatedInstance ?? 1}` : "";
    return (
      <div id={`panel-${prefix}school`} role="tabpanel" aria-labelledby={`tab-${prefix}school`} className="flex flex-wrap gap-2 items-center">
        <label htmlFor={`${prefix}grade`} className="text-sm text-gray-700 dark:text-gray-300">Grade</label>
        <input id={`${prefix}grade`} type="number" min={1} max={30} value={grade}
          onChange={(e) => { const v = Math.max(1, Number(e.target.value) || 1); setGrade(v); if (skippedG.includes(v)) { setPer(1); setRi(undefined); } }}
          className={`w-14 px-2 ${compact ? 'py-1.5' : 'py-2'} ${INPUT_CLASS}`} aria-label={`${prefix ? 'End g' : 'G'}rade`} />
        <label htmlFor={`${prefix}unit`} className="text-sm text-gray-700 dark:text-gray-300">Unit</label>
        <select id={`${prefix}unit`} value={valStr}
          onChange={(e) => { const [p, r] = e.target.value.split("-").map(Number); setPer(p); setRi(r > 1 ? r : undefined); }}
          disabled={gradeSkippedV || options.length === 0}
          className={`px-2 ${compact ? 'py-1.5' : 'py-2'} ${INPUT_CLASS}`} aria-label={gradeSkippedV ? "No units (grade skipped)" : `${prefix ? 'End u' : 'U'}nit`}>
          {options.length === 0 && <option value="">—</option>}
          {options.map((o) => <option key={`${o.period}-${o.repeatedInstance ?? 1}`} value={`${o.period}-${o.repeatedInstance ?? 1}`}>{o.label}</option>)}
        </select>
      </div>
    );
  };

  const calendarPanel = (
    prefix: string,
    yr: number, setYr: (n: number) => void,
    mo: number, setMo: (n: number) => void,
    dy: number, setDy: (n: number) => void,
    ct: string, setCt: (s: string) => void
  ) => {
    const effMo = mo > 0 ? mo : 1;
    const dim = new Date(yr, effMo, 0).getDate();
    return (
      <div id={`panel-${prefix}calendar`} role="tabpanel" aria-labelledby={`tab-${prefix}calendar`}
        className={compact ? "flex flex-wrap gap-2 items-center" : "flex flex-col gap-3"}>
        <div className="flex flex-wrap gap-2 items-center">
          <label htmlFor={`${prefix}cal-year`} className="text-sm text-gray-700 dark:text-gray-300">Year</label>
          <input id={`${prefix}cal-year`} type="number" min={1990} max={currentYear + 20} value={yr}
            onChange={(e) => setYr(Number(e.target.value) || currentYear)}
            className={`w-20 px-2 ${compact ? 'py-1.5' : 'py-2'} ${INPUT_CLASS}`} aria-label={`${prefix ? 'End y' : 'Y'}ear`} />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <label htmlFor={`${prefix}cal-month`} className="text-sm text-gray-700 dark:text-gray-300">Month</label>
          <select id={`${prefix}cal-month`} value={mo}
            onChange={(e) => setMo(Number(e.target.value))}
            className={`px-2 ${compact ? 'py-1.5' : 'py-2'} ${INPUT_CLASS}`} aria-label={`${prefix ? 'End m' : 'M'}onth`}>
            <option value={0}>—</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <label htmlFor={`${prefix}cal-day`} className="text-sm text-gray-700 dark:text-gray-300">Day</label>
          <input id={`${prefix}cal-day`} type="number" min={0} max={dim} value={dy || ""} placeholder="—"
            onChange={(e) => { const v = e.target.value === "" ? 0 : Math.max(0, Math.min(dim, Number(e.target.value) || 0)); setDy(v); if (v === 0) setCt(""); }}
            className={`w-14 px-2 ${compact ? 'py-1.5' : 'py-2'} ${INPUT_CLASS}`} aria-label={`${prefix ? 'End d' : 'D'}ay`} />
        </div>
        {dy > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <label htmlFor={`${prefix}cal-time`} className="text-sm text-gray-700 dark:text-gray-300">Time</label>
            <input id={`${prefix}cal-time`} type="datetime-local" value={ct}
              onChange={(e) => setCt(e.target.value)}
              className={`px-2 ${compact ? 'py-1.5' : 'py-2'} ${INPUT_CLASS}`} aria-label={`${prefix ? 'End t' : 'T'}ime`} />
          </div>
        )}
      </div>
    );
  };

  const dateTabBar = (prefix: string, tab: DateTab, setTab: (t: DateTab) => void) => (
    <div role="tablist" aria-label={`${prefix ? 'End d' : 'D'}ate format`}
      className="flex border border-b-0 rounded-t-lg border-gray-300 dark:border-gray-500">
      {DATE_TABS.map((opt) => {
        const sel = tab === opt.value;
        return (
          <button key={opt.value} type="button" role="tab" aria-selected={sel}
            aria-controls={`panel-${prefix}${opt.value}`} id={`tab-${prefix}${opt.value}`}
            tabIndex={sel ? 0 : -1} onClick={() => setTab(opt.value)}
            className={`flex-1 min-w-0 px-2 ${compact ? 'py-1 text-xs' : 'py-2 text-sm'} font-medium border-b-2 -mb-px transition-colors ${
              sel ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  const w = "w-11/12";
  const panelPad = "p-3";

  /* Fixed height for compact date panels so toggling tabs/end-date doesn't shift layout */
  const datePanelH = compact ? "h-[38px]" : "min-h-[72px]";

  if (compact) {
    const endDateBlock = (
      <div className="flex flex-col">
        {dateTabBar('end-', endDateTab, setEndDateTab)}
        <div className={`border border-t-0 border-gray-300 dark:border-gray-500 rounded-b-lg px-2 py-1.5 ${datePanelH} overflow-hidden`}>
          {endDateTab === "school" && schoolPanel('end-', schoolYearEnd, setSchoolYearEnd, periodEnd, setPeriodEnd, repeatedInstanceEnd, setRepeatedInstanceEnd)}
          {endDateTab === "calendar" && calendarPanel('end-', yearEnd, setYearEnd, monthEnd, setMonthEnd, dayEnd, setDayEnd, calendarTimeEnd, setCalendarTimeEnd)}
        </div>
      </div>
    );

    const startDateBlock = (
      <div className="flex flex-col">
        {dateTabBar('', dateTab, setDateTab)}
        <div className={`border border-t-0 border-gray-300 dark:border-gray-500 rounded-b-lg px-2 py-1.5 ${datePanelH} overflow-hidden`}>
          {dateTab === "school" && schoolPanel('', schoolYear, setSchoolYear, period, setPeriod, repeatedInstance, setRepeatedInstance)}
          {dateTab === "calendar" && calendarPanel('', year, setYear, month, setMonth, day, setDay, calendarTime, setCalendarTime)}
        </div>
      </div>
    );

    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 flex-1 min-h-0">
        <div className="flex flex-row gap-3 flex-1 min-h-0">
          {/* Left: creation fields */}
          <div className="flex-1 min-w-0 flex flex-col gap-2 overflow-y-auto">
            {/* Title */}
            <div>
              <label htmlFor="todate-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5">Title</label>
              <input id="todate-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                placeholder="Enter title" required autoComplete="off" />
            </div>

            {/* Dates side by side */}
            <div className="flex flex-row gap-2">
              <div className="flex-1 min-w-0" role="group" aria-labelledby="date-format-label">
                <p id="date-format-label" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5">Start</p>
                {startDateBlock}
              </div>
              <div className="flex-1 min-w-0" role="group" aria-labelledby="end-date-label">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <input id="todate-has-end-date" type="checkbox" checked={hasEndDate}
                    onChange={(e) => setHasEndDate(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-500 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="todate-has-end-date" id="end-date-label" className="text-sm font-medium text-gray-700 dark:text-gray-300">End</label>
                </div>
                {hasEndDate ? endDateBlock : (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 h-[64px] flex items-center justify-center">
                    <span className="text-xs text-gray-400 dark:text-gray-500">No end date</span>
                  </div>
                )}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label htmlFor="todate-comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5">
                Comment <span className="text-gray-500 dark:text-gray-400 text-xs">(optional)</span>
              </label>
              <textarea id="todate-comment" value={comment} onChange={(e) => setComment(e.target.value)}
                className="w-full min-h-[40px] px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-y"
                placeholder="Add a note..." rows={1} />
            </div>
          </div>

          {/* Right: tags column */}
          <div className="w-44 shrink-0 flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Tags <span className="text-gray-500 dark:text-gray-400 text-xs">(optional)</span>
            </span>
            {/* Inline tag creation — above selectable tags */}
            {onAddTag && (
              <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-gray-200 dark:border-gray-700">
                <input type="text" value={newTagName} onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="New tag" className={`flex-1 min-w-[60px] px-2 py-1 text-xs ${INPUT_CLASS}`}
                  aria-label="New tag name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTagName.trim()) {
                      e.preventDefault();
                      const t: TagType = { _id: crypto.randomUUID(), name: newTagName.trim(), color: newTagColor };
                      onAddTag(t);
                      setSelectedTags((prev) => [...prev, t]);
                      setNewTagName("");
                    }
                  }} />
                <input type="color" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)}
                  className="h-6 w-6 min-w-6 cursor-pointer rounded border border-gray-300 dark:border-gray-500"
                  aria-label="New tag color" />
                <button type="button"
                  onClick={() => {
                    if (!newTagName.trim()) return;
                    const t: TagType = { _id: crypto.randomUUID(), name: newTagName.trim(), color: newTagColor };
                    onAddTag(t);
                    setSelectedTags((prev) => [...prev, t]);
                    setNewTagName("");
                  }}
                  className="px-2 py-1 text-xs font-medium rounded bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500">
                  +
                </button>
              </div>
            )}
            {/* Selectable tag pills */}
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-wrap gap-1.5 content-start" role="group" aria-label="Select tags">
              {tagIds.length === 0 ? (
                <span className="text-xs text-gray-400">No tags</span>
              ) : tagIds.map((tagId) => {
                const tag = tags[tagId];
                const isSel = selectedTags.some((t) => t._id === tag._id);
                return (
                  <button key={tag._id} type="button" onClick={() => toggleTag(tag)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                      isSel ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                    }`}>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: tag.color }} aria-hidden />
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submit — centered on full width */}
        <button type="submit"
          className="self-center px-8 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white font-medium rounded-lg transition-colors">
          {initialData ? "Update Todate" : "Save Todate"}
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col justify-center items-center gap-4 sm:gap-6"
    >
      {/* Title */}
      <div className={w}>
        <label htmlFor="todate-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5">
          Title <span className="text-red-600" aria-hidden>*</span>
        </label>
        <input
          id="todate-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          placeholder="Enter title"
          required
          autoComplete="off"
        />
      </div>

      {/* Start date */}
      <div className={w} role="group" aria-labelledby="date-format-label">
        <p id="date-format-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          When did this happen?
        </p>
        {dateTabBar('', dateTab, setDateTab)}
        <div className={`border border-t-0 border-gray-300 dark:border-gray-500 rounded-b-lg ${panelPad} ${datePanelH}`}>
          {dateTab === "school" && schoolPanel('', schoolYear, setSchoolYear, period, setPeriod, repeatedInstance, setRepeatedInstance)}
          {dateTab === "calendar" && calendarPanel('', year, setYear, month, setMonth, day, setDay, calendarTime, setCalendarTime)}
        </div>
      </div>

      {/* Optional end date */}
      <div className={w} role="group" aria-labelledby="end-date-label">
        <div className="flex items-center gap-2 mb-2">
          <input id="todate-has-end-date" type="checkbox" checked={hasEndDate}
            onChange={(e) => setHasEndDate(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-500 text-blue-600 focus:ring-blue-500" />
          <label htmlFor="todate-has-end-date" id="end-date-label" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            End date
          </label>
        </div>
        {hasEndDate && dateTabBar('end-', endDateTab, setEndDateTab)}
        {hasEndDate && (
          <div className={`border border-t-0 border-gray-300 dark:border-gray-500 rounded-b-lg ${panelPad} ${datePanelH}`}>
            {endDateTab === "school" && schoolPanel('end-', schoolYearEnd, setSchoolYearEnd, periodEnd, setPeriodEnd, repeatedInstanceEnd, setRepeatedInstanceEnd)}
            {endDateTab === "calendar" && calendarPanel('end-', yearEnd, setYearEnd, monthEnd, setMonthEnd, dayEnd, setDayEnd, calendarTimeEnd, setCalendarTimeEnd)}
          </div>
        )}
      </div>

      {/* Comment */}
      <div className={w}>
        <label htmlFor="todate-comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-0.5">
          Comment <span className="text-gray-500 dark:text-gray-400 text-xs">(optional)</span>
        </label>
        <textarea id="todate-comment" value={comment} onChange={(e) => setComment(e.target.value)}
          className="w-full min-h-[80px] px-4 py-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none resize-y"
          placeholder="Add a note..." rows={3} />
      </div>

      {/* Tags */}
      <div className={w}>
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span id="tags-label" className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
          aria-describedby="tags-hint"
        >
          {tagIds.length === 0 ? (
            <p className="text-sm text-gray-500 py-2 w-fit" role="status">No tags yet. Create one or save without tags.</p>
          ) : tagIds.map((tagId) => {
            const tag = tags[tagId];
            const isSelected = selectedTags.some((t) => t._id === tag._id);
            return (
              <button key={tag._id} type="button" role="option" aria-selected={isSelected}
                onClick={() => toggleTag(tag)}
                className={`w-full text-left cursor-pointer px-3 py-2 rounded text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-inset touch-manipulation text-gray-900 dark:text-gray-100 ${isSelected ? "bg-gray-200 dark:bg-gray-600" : ""}`}>
                <span className="inline-block w-3 h-3 rounded mr-0.5 shrink-0" style={{ backgroundColor: tag.color }} aria-hidden />
                <span className="flex-1 min-w-0 truncate">{tag.name}</span>
                {onEditTag ? (
                  <span role="button" tabIndex={0}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditTag(tag); }}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onEditTag(tag); } }}
                    className="shrink-0 min-h-[32px] min-w-[32px] inline-flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer text-gray-600 dark:text-gray-400 touch-manipulation"
                    aria-label={`Edit ${tag.name}`}>
                    <Icon src={editIcon} className="w-4 h-4" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 min-h-10 w-11/12" role="list" aria-label="Selected tags">
          {selectedTags.map((tag) => (
            <span key={tag._id} className="px-3 py-1 rounded-full text-sm font-medium inline-flex items-center bg-gray-200 dark:bg-gray-600">
              <span className="inline-block w-3 h-3 rounded mr-2 shrink-0" style={{ backgroundColor: tag.color }} aria-hidden />
              {tag.name}
              <button type="button" onClick={() => removeTag(tag._id)}
                className="ml-1.5 min-h-[24px] min-w-[24px] inline-flex items-center justify-center rounded hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer"
                aria-label={`Remove ${tag.name} from selection`}>
                <span aria-hidden>&times;</span>
              </button>
            </span>
          ))}
        </div>
      )}

      <button type="submit"
        className="w-full min-h-[44px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-2 text-white font-medium py-2 px-4 rounded-lg transition-colors touch-manipulation">
        {initialData ? "Update Todate" : "Save Todate"}
      </button>
    </form>
  );
};

export default TodateForm;
