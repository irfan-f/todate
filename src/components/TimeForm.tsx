import { useState } from "react";
import type {
  TimeType,
  TagType,
  TagsType,
  DateValue,
  DatePrecision,
  SchoolStartDate,
} from "../types";
import { dateValueToIso } from "../utils/date";
import NewButton from "./NewButton";

const PRECISION_OPTIONS: { value: DatePrecision; label: string }[] = [
  { value: "school", label: "School year & quarter" },
  { value: "month", label: "Month & year" },
  { value: "day", label: "Month, day & year" },
  { value: "datetime", label: "Date & time" },
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface TimeFormProps {
  tags: TagsType;
  addTime: (t: TimeType) => void;
  toggleTagModal: () => void;
  schoolStartDate: SchoolStartDate;
  useSchoolYears: boolean;
}

const TimeForm = ({
  tags,
  addTime,
  toggleTagModal,
  schoolStartDate,
  useSchoolYears,
}: TimeFormProps) => {
  const [title, setTitle] = useState("");
  const [precision, setPrecision] = useState<DatePrecision>(useSchoolYears ? "school" : "day");
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);

  // School
  const [schoolYear, setSchoolYear] = useState<number>(1);
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(1);

  // Month
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());

  // Day
  const [day, setDay] = useState<number>(new Date().getDate());

  // Datetime
  const [datetime, setDatetime] = useState("");

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
    switch (precision) {
      case "school":
        return {
          kind: "school",
          schoolYear: Math.max(1, Math.floor(schoolYear) || 1),
          quarter,
        };
      case "month":
        return {
          kind: "month",
          year,
          month: Math.max(1, Math.min(12, month)),
        };
      case "day":
        return {
          kind: "day",
          year,
          month: Math.max(1, Math.min(12, month)),
          day: Math.max(1, Math.min(31, day)),
        };
      case "datetime":
        if (!datetime) return null;
        return { kind: "datetime", iso: new Date(datetime).toISOString() };
      default:
        return null;
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const dateValue = buildDateValue();
    if (!dateValue) return;
    const iso = dateValueToIso(dateValue, precision === "school" ? schoolStartDate : undefined);
    const id = crypto.randomUUID();
    const data: TimeType = {
      title,
      date: iso,
      dateDisplay: dateValue,
      comment: comment || undefined,
      tags: selectedTags,
      _id: id,
    };
    addTime(data);
  }

  const tagIds = Object.keys(tags);
  const currentYear = new Date().getFullYear();
  const daysInMonth = new Date(year, month, 0).getDate();

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col justify-center items-center gap-4 sm:gap-6"
    >
      {/* Title - Required */}
      <div className="w-11/12">
        <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-600" aria-hidden>*</span>
        </label>
        <input
          id="event-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus-visible:ring-1 invalid:border-red-500"
          placeholder="Enter event title"
          required
          aria-required="true"
          autoComplete="off"
        />
      </div>

      {/* Date format: tabbed box */}
      <div className="w-11/12" role="group" aria-labelledby="date-format-label">
        <p id="date-format-label" className="block text-sm font-medium text-gray-700 mb-2">
          When did this happen?
        </p>
        <div
          role="tablist"
          aria-label="Date format"
          className="flex border border-b-0 rounded-t-lg border-gray-300"
        >
          {PRECISION_OPTIONS.map((opt) => {
            const isSelected = precision === opt.value;
            const isSchool = opt.value === "school";
            if (isSchool && !useSchoolYears) return null;
            return (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={`panel-${opt.value}`}
                id={`tab-${opt.value}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setPrecision(opt.value)}
                className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  isSelected
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <div className="border border-t-0 border-gray-300 rounded-b-lg p-3 min-h-[72px]">
          {precision === "school" && (
            <div
              id="panel-school"
              role="tabpanel"
              aria-labelledby="tab-school"
              className="flex flex-wrap gap-2 items-center"
            >
              <label className="text-sm text-gray-700">School year</label>
              <input
                type="number"
                min={1}
                max={30}
                value={schoolYear}
                onChange={(e) => setSchoolYear(Math.max(1, Number(e.target.value) || 1))}
                className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-sm"
                aria-label="School year number"
              />
              <label className="text-sm text-gray-700">Quarter</label>
              <select
                value={quarter}
                onChange={(e) => setQuarter(Number(e.target.value) as 1 | 2 | 3 | 4)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                aria-label="Quarter (1–4)"
              >
                {([1, 2, 3, 4] as const).map((q) => (
                  <option key={q} value={q}>Q{q}</option>
                ))}
              </select>
            </div>
          )}

        {precision === "month" && (
          <div
            id="panel-month"
            role="tabpanel"
            aria-labelledby="tab-month"
            className="flex flex-wrap gap-2 items-center"
          >
            <select
              aria-label="Month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1990}
              max={currentYear + 20}
              aria-label="Year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value) || currentYear)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        )}

        {precision === "day" && (
          <div
            id="panel-day"
            role="tabpanel"
            aria-labelledby="tab-day"
            className="flex flex-wrap gap-2 items-center"
          >
            <select
              aria-label="Month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              max={daysInMonth}
              aria-label="Day"
              value={day}
              onChange={(e) =>
                setDay(Math.max(1, Math.min(daysInMonth, Number(e.target.value) || 1)))
              }
              className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <input
              type="number"
              min={1990}
              max={currentYear + 20}
              aria-label="Year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value) || currentYear)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        )}

        {precision === "datetime" && (
          <div
            id="panel-datetime"
            role="tabpanel"
            aria-labelledby="tab-datetime"
          >
            <label htmlFor="event-datetime" className="block text-sm font-medium text-gray-700 mb-1">
              Date & time
            </label>
            <input
              id="event-datetime"
              type="datetime-local"
              value={datetime}
              required={precision === "datetime"}
              onChange={(e) => setDatetime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        )}
        </div>
      </div>

      {/* Comment - Optional */}
      <div className="w-11/12">
        <label htmlFor="event-comment" className="block text-sm font-medium text-gray-700 mb-1">
          Comment <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <textarea
          id="event-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full min-h-[80px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none focus-visible:ring-1 resize-y"
          placeholder="Add a note..."
          rows={3}
          aria-describedby="comment-optional"
        />
        <span id="comment-optional" className="sr-only">Optional field</span>
      </div>

      {/* Tags */}
      <div className="w-11/12">
        <div className="flex flex-row items-center justify-between gap-2 mb-2 shrink-0">
          <span id="tags-label" className="block text-sm font-medium text-gray-700 mb-1">
            Tags
          </span>
          <NewButton className="w-fit h-fit" name="Tag" action={toggleTagModal} ariaLabel="Create new tag" />
        </div>

        <div
          className="relative border border-gray-300 rounded-lg p-2 min-h-12 max-h-40 overflow-y-auto bg-white"
          role="listbox"
          aria-labelledby="tags-label"
          aria-multiselectable
          aria-label="Available tags; click to toggle selection"
        >
          {tagIds.length === 0 ? (
            <p className="text-sm text-gray-500 py-2 w-fit" role="status">
              No tags yet. Create one first.
            </p>
          ) : (
            tagIds.map((tagId) => {
              const tag = tags[tagId];
              const isSelected = selectedTags.some((t) => t._id === tag._id);
              return (
                <div
                  key={tag._id}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                  onClick={() => toggleTag(tag)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleTag(tag);
                    }
                  }}
                  className={`cursor-pointer px-3 py-2 rounded text-sm flex items-center hover:bg-gray-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-inset touch-manipulation ${
                    isSelected ? "bg-gray-200" : ""
                  }`}
                >
                  <span
                    className="inline-block w-3 h-3 rounded mr-2 shrink-0"
                    style={{ backgroundColor: tag.color }}
                    aria-hidden
                  />
                  {tag.name}
                </div>
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
              className="px-3 py-1 rounded-full text-sm font-medium inline-flex items-center bg-gray-200"
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
                className="ml-2 min-h-[24px] min-w-[24px] inline-flex items-center justify-center rounded hover:bg-gray-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 cursor-pointer"
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
        className="w-full min-h-[44px] bg-blue-600 hover:bg-blue-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-2 text-white font-medium py-2 px-4 rounded-lg transition-colors touch-manipulation"
      >
        Save Event
      </button>
    </form>
  );
};

export default TimeForm;
