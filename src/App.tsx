import { useState } from 'react';
import { createPortal } from 'react-dom';
/* Types */
import type { TimeType, TimesType, TagType, TagsType, SchoolStartDate } from './types';
/* Components */
import TimeForm from './components/TimeForm';
import TagForm from './components/TagForm';
import TimeLine from './components/TimeLine';
import NewButton from './components/NewButton';
import Modal from './components/Modal';

const defaultSchoolStart: SchoolStartDate = {
  month: 9,
  day: 1,
  referenceYear: 2020,
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function App() {
  const [times, setTimes] = useState<TimesType>({});
  const [tags, setTags] = useState<TagsType>({});
  const [useSchoolYears, setUseSchoolYears] = useState(false);
  const [schoolStartDate, setSchoolStartDate] = useState<SchoolStartDate>(defaultSchoolStart);
  const [isTimeFormModalOpen, setIsTimeFormModalOpen] = useState(false);
  const [isTagFormModalOpen, setIsTagFormModalOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  function toggleTimeModal(): void {
    setIsTimeFormModalOpen(!isTimeFormModalOpen);
  }
  function toggleTagModal(): void {
    setIsTagFormModalOpen(!isTagFormModalOpen);
  }

  function addTime(timeToAdd: TimeType): void {
    setTimes({
      ...times,
      [timeToAdd._id]: timeToAdd,
    });
    toggleTimeModal();
  }

  function addTag(tagToAdd: TagType): void {
    setTags({
      ...tags,
      [tagToAdd._id]: tagToAdd,
    });
    toggleTagModal();
  }

  return (
    <>
      <header
        className="w-full shrink-0 p-3 sm:p-4 flex flex-row flex-wrap items-center justify-between gap-2 sm:gap-3 bg-gray-500"
        role="banner"
      >
        <h1 className="font-bold text-2xl sm:text-3xl md:text-4xl text-gray-100 shrink-0">
          Todate
        </h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink min-w-0">
          <label className="flex items-center gap-2 cursor-pointer text-gray-100 shrink-0">
            <input
              type="checkbox"
              checked={useSchoolYears}
              onChange={(e) => setUseSchoolYears(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              aria-describedby="use-school-years-desc"
            />
            <span id="use-school-years-desc">Use School Years</span>
          </label>
          {useSchoolYears && (
            <div className="flex flex-wrap items-center gap-2 pl-2 border-l border-gray-400" aria-label="Student's first year start">
              <span className="text-gray-200 text-sm shrink-0">Student&apos;s first year starts</span>
              <select
                aria-label="First year start month"
                value={schoolStartDate.month}
                onChange={(e) =>
                  setSchoolStartDate({
                    ...schoolStartDate,
                    month: Number(e.target.value),
                  })
                }
                className="px-2 py-1.5 rounded border border-gray-400 bg-gray-100 text-gray-800 text-sm shrink-0"
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                max={31}
                aria-label="School start day"
                value={schoolStartDate.day}
                onChange={(e) =>
                  setSchoolStartDate({
                    ...schoolStartDate,
                    day: Math.max(1, Math.min(31, Number(e.target.value) || 1)),
                  })
                }
                className="w-12 px-2 py-1.5 rounded border border-gray-400 bg-gray-100 text-gray-800 text-sm shrink-0"
              />
              <input
                type="number"
                min={1990}
                max={currentYear + 20}
                aria-label="First year start year"
                value={schoolStartDate.referenceYear}
                onChange={(e) =>
                  setSchoolStartDate({
                    ...schoolStartDate,
                    referenceYear: Number(e.target.value) || currentYear,
                  })
                }
                className="w-16 px-2 py-1.5 rounded border border-gray-400 bg-gray-100 text-gray-800 text-sm shrink-0"
              />
            </div>
          )}
        </div>
        <nav
          className="flex flex-row justify-center gap-2 sm:gap-4 shrink-0"
          aria-label="Create new event or tag"
        >
          <NewButton name="Event" action={toggleTimeModal} ariaLabel="Create new event" />
          <NewButton name="Tag" action={toggleTagModal} ariaLabel="Create new tag" />
        </nav>
      </header>
      <main id="main-content" className="flex-1 min-h-0 flex flex-col" role="main">
        <TimeLine data={times} schoolStartDate={useSchoolYears ? schoolStartDate : null} />
      </main>
      {isTimeFormModalOpen &&
        createPortal(<Modal title="Create an Event" closeFn={toggleTimeModal}><TimeForm tags={tags} addTime={addTime} toggleTagModal={toggleTagModal} schoolStartDate={schoolStartDate} useSchoolYears={useSchoolYears} /></Modal>, document.body)}
      {isTagFormModalOpen &&
        createPortal(<Modal title="Create a Tag" closeFn={toggleTagModal}><TagForm addTag={addTag} /></Modal>, document.body)}
    </>
  );
}

export default App;

