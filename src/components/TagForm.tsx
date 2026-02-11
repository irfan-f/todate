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
      className="flex flex-col items-center justify-center space-y-6"
    >
      {/* Title - Required */}
      <div className="flex flex-row items-center">
        <label htmlFor="name" className="block text-md font-bold text-gray-700 pr-2">
          Name:
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="px-1 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          placeholder="Enter Tag name"
          required
        />
        <label htmlFor="color" className="block text-md font-bold text-gray-700 mb-1 pl-2">
          Color:
        </label>
        <input
          id="color"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          onInput={(e) => setColor(e.currentTarget.value)}
          className="justify-self-center h-10 w-10 ml-1"
          required
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-1/3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
      >
        Save Tag
      </button>
    </form>
  );
}

export default TagForm;