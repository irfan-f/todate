import { useState } from 'react'
import { createPortal } from 'react-dom';
import TimeForm from './components/TimeForm';
import TagForm from './components/TagForm';
import Time from './components/Time';

export interface TagType {
  _id: `${string}-${string}-${string}-${string}-${string}`,
  name: string,
  color: string
}

// Date by Seasons and years
// Allow shortcuts by setting school first day
// Allow Date Time

// Define the Event type structure
export interface TimeType {
  _id: string;
  title: string;
  date: string;
  comment?: string;
  tags: TagType[];
}

// Define the events object type using Record for better type safety
export type Times = Record<string, TimeType>;
export type Tags = Record<string, TagType>;

function App() {
  const [times, setTimes] = useState<Times>({})
  const [tags, setTags] = useState<Tags>({});
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
      [timeToAdd._id]: timeToAdd
    })
    toggleTimeModal();
  }

  function addTag(tagToAdd: TagType): void {
    setTags({
      ...tags,
      [tagToAdd._id]: tagToAdd
    })
    toggleTagModal();
  }

  return (
    <>
      {isTimeFormModalOpen && createPortal(<TimeForm tags={tags} addTime={addTime} />, document.body)}
      {isTagFormModalOpen && createPortal(<TagForm addTag={addTag} />, document.body)}
      <div className="sticky top-0 h-1/12 w-full p-4 flex flex-row justify-between items-center bg-gray-500">
        <div className="w-1/3 flex justify-start font-bold text-4xl">
          Todate
        </div>
        <div className="w-1/3 flex justify-center">
          <button onClick={() => toggleTimeModal()} className="bg-gray-400 hover:bg-gray-300 font-bold py-2 px-4 rounded inline-flex items-center cursor-pointer">
            <svg className="fill-current w-5 h-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M440-280h80v-160h160v-80H520v-160h-80v160H280v80h160v160Zm40 200q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
            Event
          </button>
        </div>
        <div className="w-1/3 flex justify-end">
          <button onClick={() => toggleTagModal()} className="bg-gray-400 hover:bg-gray-300 font-bold py-2 px-4 rounded inline-flex items-center cursor-pointer">
            <svg className="fill-current w-5 h-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="M440-280h80v-160h160v-80H520v-160h-80v160H280v80h160v160Zm40 200q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
            Tag
          </button>
        </div>
      </div>
    <div className="h-full w-full flex flex-col justify-between items-center">
      {Object.keys(times).map((index) => {
        // Render each event with its title
        return (
          <Time data={times[index]} key={index} />
        )
      })}
    </div>
    </>
  )
}

export default App
