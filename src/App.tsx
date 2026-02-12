import { useState } from 'react';
import { createPortal } from 'react-dom';
/* Types */
import type { TimeType, TimesType, TagType, TagsType } from './types';
/* Components */
import TimeForm from './components/TimeForm';
import TagForm from './components/TagForm';
import TimeLine from './components/TimeLine';
import NewButton from './components/NewButton';
import Modal from './components/Modal';

function App() {
  const [times, setTimes] = useState<TimesType>({});
  const [tags, setTags] = useState<TagsType>({});
  const [isTimeFormModalOpen, setIsTimeFormModalOpen] = useState(false);
  const [isTagFormModalOpen, setIsTagFormModalOpen] = useState(false);

  function toggleTimeModal(): void {
    if (isTagFormModalOpen) {
      toggleTagModal();
    }
    setIsTimeFormModalOpen(!isTimeFormModalOpen);
  }
  function toggleTagModal(): void {
    if (isTimeFormModalOpen) {
      toggleTimeModal();
    }
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
        className="w-full shrink-0 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between sm:items-center bg-gray-500"
        role="banner"
      >
        <h1 className="font-bold text-2xl sm:text-3xl md:text-4xl text-gray-100 order-1 sm:order-0">
          Todate
        </h1>
        <nav
          className="flex flex-row justify-center sm:justify-center gap-2 sm:gap-4 order-2 sm:order-0"
          aria-label="Create new event or tag"
        >
          <NewButton name="Event" action={toggleTimeModal} ariaLabel="Create new event" />
          <NewButton name="Tag" action={toggleTagModal} ariaLabel="Create new tag" />
        </nav>
      </header>
      <main id="main-content" className="flex-1 min-h-0 flex flex-col" role="main">
        <TimeLine data={times} />
      </main>
      {isTimeFormModalOpen &&
        createPortal(<Modal title="Create an Event" closeFn={toggleTimeModal}><TimeForm tags={tags} addTime={addTime} /></Modal>, document.body)}
      {isTagFormModalOpen &&
        createPortal(<Modal title="Create a Tag"closeFn={toggleTagModal}><TagForm addTag={addTag} /></Modal>, document.body)}
    </>
  );
}

export default App;

