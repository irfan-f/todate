import { useState } from 'react';
import { createPortal } from 'react-dom';
/* Types */
import type { TimeType, TimesType, TagType, TagsType } from './types';
/* Components */
import TimeForm from './components/TimeForm';
import TagForm from './components/TagForm';
import TimeLine from './components/TimeLine';
import NewButton from './components/NewButton';

function App() {
  const [times, setTimes] = useState<TimesType>({});
  const [tags, setTags] = useState<TagsType>({});
  const [isTimeFormModalOpen, setIsTimeFormModalOpen] = useState(false);
  const [isTagFormModalOpen, setIsTagFormModalOpen] = useState(false);

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
      <div className='sticky top-0 h-1/12 w-full p-4 flex flex-row justify-between items-center bg-gray-500'>
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
        createPortal(<TimeForm tags={tags} addTime={addTime} />, document.body)}
      {isTagFormModalOpen &&
        createPortal(<TagForm addTag={addTag} />, document.body)}
    </>
  );
}

export default App;

