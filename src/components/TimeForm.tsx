import { useState } from "react";
import type { TimeType, TagType, TagsType } from '../types';

const TimeForm = ({ tags, addTime }: { tags: TagsType, addTime: (t: TimeType) => void }) => {
  const [title, setTitle] = useState('');
  const [datetime, setDatetime] = useState('');
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<TagType[]>([]);

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

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    const id = crypto.randomUUID();
    const data: TimeType = { title, date: datetime, comment, tags: selectedTags, _id: id };
    addTime(data);
  };

  const tagIds = Object.keys(tags);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col justify-center gap-4 sm:gap-6"
      noValidate
    >
      {/* Title - Required */}
      <div>
        <label htmlFor="event-title" className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-600" aria-hidden>*</span>
        </label>
        <input
          id="event-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus-visible:ring-2 invalid:border-red-500"
          placeholder="Enter event title"
          required
          aria-required="true"
          autoComplete="off"
        />
      </div>

      {/* Date and Time - Required */}
      <div>
        <label htmlFor="event-datetime" className="block text-sm font-medium text-gray-700 mb-1">
          Date & Time
        </label>
        <input
          id="event-datetime"
          type="datetime-local"
          value={datetime}
          required
          onChange={(e) => setDatetime(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus-visible:ring-2 invalid:border-red-500"
          aria-required="true"
        />
      </div>

      {/* Comment - Optional */}
      <div>
        <label htmlFor="event-comment" className="block text-sm font-medium text-gray-700 mb-1">
          Comment <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <textarea
          id="event-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full min-h-[80px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none focus-visible:ring-2 resize-y"
          placeholder="Add a note..."
          rows={3}
          aria-describedby="comment-optional"
        />
        <span id="comment-optional" className="sr-only">Optional field</span>
      </div>

      {/* Tags */}
      <div>
        <span id="tags-label" className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </span>

        {/* Selected Tags Chips */}
        {selectedTags.length > 0 ? (
          <div
            className="flex flex-wrap gap-2 mb-2 min-h-10"
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
                  className="ml-2 min-h-[24px] min-w-[24px] inline-flex items-center justify-center rounded hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                  aria-label={`Remove ${tag.name} from selection`}
                >
                  <span aria-hidden>&times;</span>
                </button>
              </span>
            ))}
          </div>
        ) : null}

        {/* Tag picker list */}
        <div
          className="relative border border-gray-300 rounded-lg p-2 min-h-12 max-h-40 overflow-y-auto bg-white"
          role="listbox"
          aria-labelledby="tags-label"
          aria-multiselectable
          aria-label="Available tags; click to toggle selection"
        >
          {tagIds.length === 0 ? (
            <p className="text-sm text-gray-500 py-2" role="status">
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
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleTag(tag);
                    }
                  }}
                  className={`cursor-pointer px-3 py-2 rounded text-sm flex items-center hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset touch-manipulation ${
                    isSelected ? 'bg-gray-200' : ''
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

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full min-h-[44px] bg-blue-600 hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 text-white font-medium py-2 px-4 rounded-lg transition-colors touch-manipulation"
      >
        Save Event
      </button>
    </form>
  );
}

export default TimeForm;