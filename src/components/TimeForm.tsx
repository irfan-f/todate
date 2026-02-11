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

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col justify-center space-y-6"
    >
      {/* Title - Required */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Enter event title"
          required
        />
      </div>

      {/* Date and Time - Optional */}
      <div>
        <label htmlFor="datetime" className="block text-sm font-medium text-gray-700 mb-1">
          Date & Time
        </label>
        <input
          id="datetime"
          type="datetime-local"
          value={datetime}
          required={true}
          onChange={(e) => setDatetime(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Comment - Optional */}
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
          Comment (Optional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Add a note..."
          rows={3}
        />
      </div>

      {/* Tags Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>

        {/* Selected Tags Chips */}
        <div className="flex flex-wrap gap-2 mb-2 min-h-10">
          {selectedTags.map((tag) => {
            return (
              <span
                key={tag._id}
                className={`px-3 py-1 rounded-full text-sm font-medium flex items-center hover:bg-gray-100 cursor-default`}
              >
                <span
                  className={`inline-block w-3 h-3 rounded mr-2`}
                  style={{backgroundColor: tag.color}}
                  aria-hidden="true"
                ></span>
                {tag.name}
                <button
                  type="button"
                  onClick={() => removeTag(tag._id)}
                  className="ml-2 cursor-pointer"
                  aria-label={`Remove ${tag.name}`}
                >
                  &times;
                </button>
              </span>
            )
          })}
        </div>

        {/* Custom Dropdown */}
        <div className="relative">
          <div className="space-y-1 border border-gray-300 rounded-lg p-2 min-h-12 max-h-40 overflow-y-auto bg-white">
            {Object.keys(tags).map((tagId) => {
              const tag = tags[tagId];
              return (
                <div
                  key={tag._id}
                  onClick={() => toggleTag(tag)}
                  className={`cursor-pointer px-3 py-1 rounded text-sm flex items-center hover:bg-gray-100 ${
                    selectedTags.some((t) => t._id === tag._id) ? 'bg-gray-200' : ''
                  }`}
                >
                  <span
                    className={`inline-block w-3 h-3 rounded mr-2`}
                    style={{backgroundColor: tag.color}}
                    aria-hidden="true"
                  ></span>
                  {tag.name}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        Save Time
      </button>
    </form>
  );
}

export default TimeForm;