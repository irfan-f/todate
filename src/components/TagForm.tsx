import { useState } from "react";
import type { TagType } from '../types';

const TagForm = ({ addTag }: { addTag: (t: TagType) => void }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#000000');


  // const removeTag = (tagId: TagType["_id"]) => {
  //   setSelectedTags((prev) => prev.filter((t) => t._id !== tagId));
  // };

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    const id = crypto.randomUUID();
    const data: TagType = { name, color,  _id: id };
    addTag(data);
  };

  return (
    <div className="flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white rounded-xl shadow-lg p-6 space-y-6"
      >
        <h2 className="text-2xl font-bold text-gray-800">Create Event</h2>

        {/* Title - Required */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            id="title"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Enter Tag name"
            required
          />
        </div>
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Color
          </label>
          <input
            id="title"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            onInput={(e) => setColor(e.currentTarget.value)}
            className="justify-self-center h-10 w-10"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Save Tag
        </button>
      </form>
    </div>
  );
}

export default TagForm;