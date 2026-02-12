import { useState } from "react";
import type { TagType } from '../types';

const TagForm = ({ addTag }: { addTag: (t: TagType) => void }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#000000');

  function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    const id = crypto.randomUUID();
    const data: TagType = { name, color,  _id: id };
    addTag(data);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-stretch sm:items-center justify-center gap-6"
      noValidate
    >
      {/* Title - Required */}
      <div className="w-11/12 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2">
        <label htmlFor="tag-name" className="text-sm sm:text-base font-bold text-gray-700 shrink-0">
          Name
        </label>
        <input
          id="tag-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 invalid:border-red-500"
          placeholder="Enter tag name"
          required
          aria-required="true"
          autoComplete="off"
        />
        <div className="flex flex-row items-center gap-2">
          <label htmlFor="tag-color" className="text-sm sm:text-base font-bold text-gray-700 shrink-0">
            Color
          </label>
          <input
            id="tag-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            onInput={(e) => setColor(e.currentTarget.value)}
            className="h-10 w-10 min-w-10 cursor-pointer rounded border border-gray-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            required
            aria-required="true"
            aria-label="Tag color"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full sm:w-auto sm:min-w-[140px] min-h-[44px] bg-blue-600 hover:bg-blue-700 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:ring-offset-2 text-white font-medium py-2 px-4 rounded-lg transition-colors touch-manipulation"
      >
        Save Tag
      </button>
    </form>
  );
}

export default TagForm;