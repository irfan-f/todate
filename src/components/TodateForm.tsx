import { useState, useEffect } from "react";
import type { TodateType, TagType, TagsType, DateValue, SchoolStartDate } from "../types";
import { INPUT_CLASS } from "../constants";
import { randomUUID } from "../utils/id";
import { dateValueToIso, isoToDatetimeLocal } from "../utils/date";
import { periodCount } from "../utils/schoolPeriod";
import SchoolYearDatePanel from "./SchoolYearDatePanel";
import CalendarDatePanel from "./CalendarDatePanel";
import NewButton from "./NewButton";
import Icon from "./Icon";
import { icons } from "../icons";

type DateTab = 'school' | 'calendar';

const DATE_TABS: { value: DateTab; label: string }[] = [
  { value: "calendar", label: "Date" },
  { value: "school", label: "School year" },
];

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
  onOpenSchoolData?: () => void;
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
  onOpenSchoolData,
}: TodateFormProps) => {
  const [title, setTitle] = useState("");
  const [dateTab, setDateTab] = useState<DateTab>("calendar");
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
  const [endDateTab, setEndDateTab] = useState<DateTab>("calendar");
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
    const id = initialData?._id ?? randomUUID();
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

  const renderDateFormatTabs = (fieldPrefix: string, tab: DateTab, setTab: (t: DateTab) => void) => (
    <div role="tablist" aria-label={`${fieldPrefix ? 'End d' : 'D'}ate format`}
      className="flex border border-b-0 rounded-t-lg border-border">
      {DATE_TABS.map((opt) => {
        const sel = tab === opt.value;
        return (
          <button key={opt.value} type="button" role="tab" aria-selected={sel}
            aria-controls={`panel-${fieldPrefix}${opt.value}`} id={`tab-${fieldPrefix}${opt.value}`}
            tabIndex={sel ? 0 : -1} onClick={() => setTab(opt.value)}
            className={`flex-1 min-w-0 px-2 ${compact ? 'py-1 text-xs' : 'py-2 text-sm'} font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              sel ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-on-surface"
            }`}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  const w = "w-11/12";
  const panelPad = "p-3";

  /* In compact mode, both school (2 rows) and calendar (3 rows) use the same
     fixed height so switching tabs doesn't cause layout shift. */
  const datePanelH = compact ? "h-[130px]" : "min-h-[72px]";

  if (compact) {
    const endDateBlock = (
      <div className="flex flex-col min-w-0 overflow-hidden">
        {renderDateFormatTabs('end-', endDateTab, setEndDateTab)}
        <div className={`border border-t-0 border-border rounded-b-lg px-2 pt-1.5 pb-3 ${datePanelH} min-w-0 overflow-hidden`}>
          {endDateTab === "school" && (
            <SchoolYearDatePanel
              fieldPrefix="end-"
              grade={schoolYearEnd}
              setGrade={setSchoolYearEnd}
              period={periodEnd}
              setPeriod={setPeriodEnd}
              repeatedInstance={repeatedInstanceEnd}
              setRepeatedInstance={setRepeatedInstanceEnd}
              schoolStartDate={schoolStartDate}
              compact={compact ?? false}
              onOpenSchoolData={onOpenSchoolData}
            />
          )}
          {endDateTab === "calendar" && (
            <CalendarDatePanel
              fieldPrefix="end-"
              year={yearEnd}
              setYear={setYearEnd}
              month={monthEnd}
              setMonth={setMonthEnd}
              day={dayEnd}
              setDay={setDayEnd}
              timeValue={calendarTimeEnd}
              setTimeValue={setCalendarTimeEnd}
              compact={compact ?? false}
            />
          )}
        </div>
      </div>
    );

    const startDateBlock = (
      <div className="flex flex-col min-w-0 overflow-hidden">
        {renderDateFormatTabs('', dateTab, setDateTab)}
        <div className={`border border-t-0 border-border rounded-b-lg px-2 pt-1.5 pb-3 ${datePanelH} min-w-0 overflow-hidden`}>
          {dateTab === "school" && (
            <SchoolYearDatePanel
              fieldPrefix=""
              grade={schoolYear}
              setGrade={setSchoolYear}
              period={period}
              setPeriod={setPeriod}
              repeatedInstance={repeatedInstance}
              setRepeatedInstance={setRepeatedInstance}
              schoolStartDate={schoolStartDate}
              compact={compact ?? false}
              onOpenSchoolData={onOpenSchoolData}
            />
          )}
          {dateTab === "calendar" && (
            <CalendarDatePanel
              fieldPrefix=""
              year={year}
              setYear={setYear}
              month={month}
              setMonth={setMonth}
              day={day}
              setDay={setDay}
              timeValue={calendarTime}
              setTimeValue={setCalendarTime}
              compact={compact ?? false}
            />
          )}
        </div>
      </div>
    );

    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 flex-1 min-h-0 min-w-0">
        <div className="flex flex-col @md:flex-row gap-3 flex-1 min-h-0 min-w-0">
          {/* Left: creation fields */}
          <div className="flex-1 min-w-0 flex flex-col gap-2 overflow-x-hidden overflow-y-auto overscroll-contain">
            {/* Title */}
            <div>
              <label htmlFor="todate-title" className="block text-sm font-medium text-on-surface mb-0.5">Title</label>
              <input id="todate-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="input-base px-2 py-1.5"
                placeholder="Enter title" required autoComplete="off" />
            </div>

            {/* Dates: stacked when container narrow, side-by-side when wide (@md+ = 448px) */}
            <div className="flex flex-col gap-2 @md:flex-row">
              <div className="flex-1 min-w-0" role="group" aria-labelledby="date-format-label">
                <p id="date-format-label" className="text-sm font-medium text-on-surface mb-0.5">Start</p>
                {startDateBlock}
              </div>
              <div className="flex-1 min-w-0" role="group" aria-labelledby="end-date-label">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <input id="todate-has-end-date" type="checkbox" checked={hasEndDate}
                    onChange={(e) => setHasEndDate(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-focus cursor-pointer" />
                  <label htmlFor="todate-has-end-date" id="end-date-label" className="text-sm font-medium text-on-surface cursor-pointer">End</label>
                </div>
                {hasEndDate ? endDateBlock : (
                  <div className="border border-border rounded-lg px-2 py-1.5 h-[156px] flex items-center justify-center">
                    <span className="text-xs text-muted">No end date</span>
                  </div>
                )}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label htmlFor="todate-comment" className="block text-sm font-medium text-on-surface mb-0.5">
                Comment <span className="text-muted text-xs">(optional)</span>
              </label>
              <textarea id="todate-comment" value={comment} onChange={(e) => setComment(e.target.value)}
                className="input-base min-h-[40px] px-2 py-1.5 resize-y"
                placeholder="Add a note..." rows={1} />
            </div>
          </div>

          {/* Right: tags column — full width when stacked, fixed width when side-by-side */}
          <div className="w-full @md:w-44 shrink-0 flex flex-col gap-1.5 min-w-0">
            <span className="text-sm font-medium text-on-surface">
              Tags <span className="text-muted text-xs">(optional)</span>
            </span>
            {/* Inline tag creation — above selectable tags */}
            {onAddTag && (
              <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-border">
                <input type="text" value={newTagName} onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="New tag" className={`flex-1 min-w-[60px] px-2 py-1 text-xs ${INPUT_CLASS}`}
                  aria-label="New tag name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTagName.trim()) {
                      e.preventDefault();
                      const t: TagType = { _id: randomUUID() as TagType['_id'], name: newTagName.trim(), color: newTagColor };
                      onAddTag(t);
                      setSelectedTags((prev) => [...prev, t]);
                      setNewTagName("");
                    }
                  }} />
                <input type="color" value={newTagColor} onChange={(e) => setNewTagColor(e.target.value)}
                  className="h-6 w-6 min-w-6 cursor-pointer rounded border border-border"
                  aria-label="New tag color" />
                <button type="button"
                  onClick={() => {
                    if (!newTagName.trim()) return;
                    const t: TagType = { _id: randomUUID() as TagType['_id'], name: newTagName.trim(), color: newTagColor };
                    onAddTag(t);
                    setSelectedTags((prev) => [...prev, t]);
                    setNewTagName("");
                  }}
                  className="px-2 py-1 text-xs font-medium rounded bg-secondary/80 text-on-surface hover:bg-secondary cursor-pointer">
                  +
                </button>
              </div>
            )}
            {/* Selectable tag pills */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-wrap gap-1.5 content-start" role="group" aria-label="Select tags">
              {tagIds.length === 0 ? (
                <span className="text-xs text-muted">No tags</span>
              ) : tagIds.map((tagId) => {
                const tag = tags[tagId];
                const isSel = selectedTags.some((t) => t._id === tag._id);
                return (
                  <button key={tag._id} type="button" onClick={() => toggleTag(tag)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                      isSel ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-on-surface hover:border-primary/50'
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
          className="self-center px-8 py-1.5 text-sm btn-primary text-white font-medium rounded-lg transition-colors cursor-pointer">
          {initialData ? "Update Todate" : "Save Todate"}
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col justify-center items-center gap-4 sm:gap-6 min-w-0 w-full"
    >
      {/* Title */}
      <div className={w}>
        <label htmlFor="todate-title" className="block text-sm font-medium text-on-surface mb-0.5">
          Title <span className="text-red-600" aria-hidden>*</span>
        </label>
        <input
          id="todate-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-border rounded-lg bg-surface-input text-on-surface placeholder:text-muted focus:border-focus focus:ring-2 focus:ring-focus/20 focus:outline-none"
          placeholder="Enter title"
          required
          autoComplete="off"
        />
      </div>

      {/* Start date */}
      <div className={w} role="group" aria-labelledby="date-format-label">
        <p id="date-format-label" className="block text-sm font-medium text-on-surface mb-2">
          When did this happen?
        </p>
        {renderDateFormatTabs('', dateTab, setDateTab)}
        <div className={`border border-t-0 border-border rounded-b-lg ${panelPad} ${datePanelH}`}>
          {dateTab === "school" && (
            <SchoolYearDatePanel
              fieldPrefix=""
              grade={schoolYear}
              setGrade={setSchoolYear}
              period={period}
              setPeriod={setPeriod}
              repeatedInstance={repeatedInstance}
              setRepeatedInstance={setRepeatedInstance}
              schoolStartDate={schoolStartDate}
              compact={false}
              onOpenSchoolData={onOpenSchoolData}
            />
          )}
          {dateTab === "calendar" && (
            <CalendarDatePanel
              fieldPrefix=""
              year={year}
              setYear={setYear}
              month={month}
              setMonth={setMonth}
              day={day}
              setDay={setDay}
              timeValue={calendarTime}
              setTimeValue={setCalendarTime}
              compact={false}
            />
          )}
        </div>
      </div>

      {/* Optional end date */}
      <div className={w} role="group" aria-labelledby="end-date-label">
        <div className="flex items-center gap-2 mb-2">
          <input id="todate-has-end-date" type="checkbox" checked={hasEndDate}
            onChange={(e) => setHasEndDate(e.target.checked)}
            className="rounded border-border text-primary focus:ring-focus cursor-pointer" />
          <label htmlFor="todate-has-end-date" id="end-date-label" className="text-sm font-medium text-on-surface cursor-pointer">
            End date
          </label>
        </div>
        {hasEndDate && renderDateFormatTabs('end-', endDateTab, setEndDateTab)}
        {hasEndDate && (
          <div className={`border border-t-0 border-border rounded-b-lg ${panelPad} ${datePanelH}`}>
            {endDateTab === "school" && (
              <SchoolYearDatePanel
                fieldPrefix="end-"
                grade={schoolYearEnd}
                setGrade={setSchoolYearEnd}
                period={periodEnd}
                setPeriod={setPeriodEnd}
                repeatedInstance={repeatedInstanceEnd}
                setRepeatedInstance={setRepeatedInstanceEnd}
                schoolStartDate={schoolStartDate}
                compact={false}
                onOpenSchoolData={onOpenSchoolData}
              />
            )}
            {endDateTab === "calendar" && (
              <CalendarDatePanel
                fieldPrefix="end-"
                year={yearEnd}
                setYear={setYearEnd}
                month={monthEnd}
                setMonth={setMonthEnd}
                day={dayEnd}
                setDay={setDayEnd}
                timeValue={calendarTimeEnd}
                setTimeValue={setCalendarTimeEnd}
                compact={false}
              />
            )}
          </div>
        )}
      </div>

      {/* Comment */}
      <div className={w}>
        <label htmlFor="todate-comment" className="block text-sm font-medium text-on-surface mb-0.5">
          Comment <span className="text-muted text-xs">(optional)</span>
        </label>
        <textarea id="todate-comment" value={comment} onChange={(e) => setComment(e.target.value)}
          className="w-full min-h-[80px] px-4 py-2 border border-border rounded-lg bg-surface-input text-on-surface placeholder:text-muted focus:border-focus focus:ring-2 focus:ring-focus/20 focus:outline-none resize-y"
          placeholder="Add a note..." rows={3} />
      </div>

      {/* Tags */}
      <div className={w}>
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span id="tags-label" className="text-sm font-medium text-on-surface">
            Tags <span className="text-muted text-xs">(optional)</span>
          </span>
          <NewButton className="w-fit h-fit" name="Tag" action={toggleTagModal} ariaLabel="Create new tag" icon={icons.tag} />
        </div>
        <p className="text-xs text-muted mb-2" id="tags-hint">
          The todate card uses the first tag&apos;s color. Multiple tags are supported for filtering.
        </p>
        <div
          className="relative border rounded-lg p-2 min-h-12 max-h-40 overflow-y-auto overscroll-contain bg-surface-input border-border"
          role="listbox"
          aria-labelledby="tags-label"
          aria-multiselectable
          aria-describedby="tags-hint"
        >
          {tagIds.length === 0 ? (
            <p className="text-sm text-muted py-2 w-fit" role="status">No tags yet. Create one or save without tags.</p>
          ) : tagIds.map((tagId) => {
            const tag = tags[tagId];
            const isSelected = selectedTags.some((t) => t._id === tag._id);
            return (
              <button key={tag._id} type="button" role="option" aria-selected={isSelected}
                onClick={() => toggleTag(tag)}
                className={`w-full text-left cursor-pointer px-3 py-2 rounded text-sm flex items-center gap-2 hover:bg-secondary/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-focus focus-visible:ring-inset touch-manipulation text-on-surface ${isSelected ? "bg-secondary/80" : ""}`}>
                <span className="inline-block w-3 h-3 rounded mr-0.5 shrink-0" style={{ backgroundColor: tag.color }} aria-hidden />
                <span className="flex-1 min-w-0 truncate">{tag.name}</span>
                {onEditTag ? (
                  <span role="button" tabIndex={0}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEditTag(tag); }}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onEditTag(tag); } }}
                    className="shrink-0 min-h-[32px] min-w-[32px] inline-flex items-center justify-center rounded hover:bg-secondary/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-focus cursor-pointer text-muted touch-manipulation"
                    aria-label={`Edit ${tag.name}`}>
                    <Icon src={icons.edit} className="w-4 h-4" />
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
            <span key={tag._id} className="px-3 py-1 rounded-full text-sm font-medium inline-flex items-center bg-secondary/80">
              <span className="inline-block w-3 h-3 rounded mr-2 shrink-0" style={{ backgroundColor: tag.color }} aria-hidden />
              {tag.name}
              <button type="button" onClick={() => removeTag(tag._id)}
                className="ml-1.5 min-h-[24px] min-w-[24px] inline-flex items-center justify-center rounded hover:bg-secondary/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-focus cursor-pointer"
                aria-label={`Remove ${tag.name} from selection`}>
                <span aria-hidden>&times;</span>
              </button>
            </span>
          ))}
        </div>
      )}

      <button type="submit"
        className="btn-primary w-full">
        {initialData ? "Update Todate" : "Save Todate"}
      </button>
    </form>
  );
};

export default TodateForm;
