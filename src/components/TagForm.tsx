import { useState } from "react";
import type { TagType } from '../types';

interface TagFormProps {
  addTag: (t: TagType) => void;
  initialTag?: TagType | null;
  updateTag?: (t: TagType) => void;
  compact?: boolean;
}

const TagForm = ({ addTag, initialTag, updateTag, compact }: TagFormProps) => {
  const [name, setName] = useState(initialTag?.name ?? '');
  const [color, setColor] = useState(initialTag?.color ?? '#000000');

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (updateTag && initialTag) {
      updateTag({ _id: initialTag._id, name, color });
    } else {
      addTag({ name, color, _id: crypto.randomUUID() });
    }
  }

  if (compact) {
    return (
      <form
        onSubmit={handleSubmit}
        className="flex flex-wrap items-end gap-2"
        noValidate
      >
        <div className="flex-1 min-w-[120px]">
          <label htmlFor="tag-name" className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-0.5 block">
            Name
          </label>
          <input
            id="tag-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            placeholder="Tag name"
            required
            autoComplete="off"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <input
            id="tag-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            onInput={(e) => setColor(e.currentTarget.value)}
            className="h-8 w-8 min-w-8 cursor-pointer rounded border border-gray-300 dark:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            aria-label="Tag color"
          />
        </div>
        <button
          type="submit"
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white font-medium rounded-lg transition-colors cursor-pointer"
        >
          {initialTag ? "Update" : "Save"}
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col items-stretch sm:items-center justify-center gap-6"
      noValidate
    >
      <div className="w-11/12 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2">
        <label htmlFor="tag-name" className="text-sm sm:text-base font-bold text-gray-700 dark:text-gray-300 shrink-0">
          Name
        </label>
        <input
          id="tag-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none invalid:border-red-500"
          placeholder="Enter tag name"
          required
          aria-required="true"
          autoComplete="off"
        />
        <div className="flex flex-row items-center gap-2">
          <label htmlFor="tag-color" className="text-sm sm:text-base font-bold text-gray-700 dark:text-gray-300 shrink-0">
            Color
          </label>
          <input
            id="tag-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            onInput={(e) => setColor(e.currentTarget.value)}
            className="h-10 w-10 min-w-10 cursor-pointer rounded border border-gray-300 dark:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            required
            aria-required="true"
            aria-label="Tag color"
          />
        </div>
      </div>
      <button
        type="submit"
        className="w-full sm:w-auto sm:min-w-[140px] min-h-[44px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 text-white font-medium py-2 px-4 rounded-lg transition-colors touch-manipulation cursor-pointer"
      >
        {initialTag ? "Update Tag" : "Save Tag"}
      </button>
    </form>
  );
}

export default TagForm;