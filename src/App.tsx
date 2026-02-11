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
      <div className='h-1/12 w-full p-4 flex flex-row justify-between items-center bg-gray-500'>
        <div className='w-1/3 flex justify-start font-bold text-4xl'>
          Todate
        </div>
        <div className='w-1/3 flex justify-center'>
          <NewButton name='Event' action={toggleTimeModal} />
        </div>
        <div className='w-1/3 flex justify-end'>
          <NewButton name='Tag' action={toggleTagModal} />
        </div>
      </div>
      <TimeLine data={times} />
      {isTimeFormModalOpen &&
        createPortal(<Modal title="Create an Event" closeFn={toggleTimeModal}><TimeForm tags={tags} addTime={addTime} /></Modal>, document.body)}
      {isTagFormModalOpen &&
        createPortal(<Modal title="Create a Tag"closeFn={toggleTagModal}><TagForm addTag={addTag} /></Modal>, document.body)}
    </>
  );
}

export default App;

