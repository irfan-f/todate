import { useState } from "react";
import type { TagType } from '../types';
import { randomUUID } from '../utils/id';

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
      addTag({ name, color, _id: randomUUID() as TagType['_id'] });
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
          <label htmlFor="tag-name" className="text-xs font-medium text-on-surface mb-0.5 block">
            Name
          </label>
          <input
            id="tag-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-2 py-1.5 text-sm border border-border rounded-lg bg-surface-input text-on-surface placeholder:text-muted focus:border-focus focus:ring-2 focus:ring-focus/20 focus:outline-none"
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
            className="h-8 w-8 min-w-8 cursor-pointer rounded border border-border focus:outline-none focus:ring-2 focus:ring-focus/20 focus:border-focus"
            aria-label="Tag color"
          />
        </div>
        <button
          type="submit"
          className="px-3 py-1.5 text-sm btn-primary text-white font-medium rounded-lg transition-colors cursor-pointer"
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
        <label htmlFor="tag-name" className="text-sm sm:text-base font-bold text-on-surface shrink-0">
          Name
        </label>
        <input
          id="tag-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 min-w-0 px-3 py-2 border border-border rounded-lg bg-surface-input text-on-surface placeholder:text-muted focus:border-focus focus:ring-2 focus:ring-focus/20 focus:outline-none invalid:border-red-500"
          placeholder="Enter tag name"
          required
          aria-required="true"
          autoComplete="off"
        />
        <div className="flex flex-row items-center gap-2">
          <label htmlFor="tag-color" className="text-sm sm:text-base font-bold text-on-surface shrink-0">
            Color
          </label>
          <input
            id="tag-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            onInput={(e) => setColor(e.currentTarget.value)}
            className="h-10 w-10 min-w-10 cursor-pointer rounded border border-border focus:outline-none focus:ring-2 focus:ring-focus/20 focus:border-focus"
            required
            aria-required="true"
            aria-label="Tag color"
          />
        </div>
      </div>
      <button
        type="submit"
        className="btn-primary w-full sm:w-auto sm:min-w-[140px]"
      >
        {initialTag ? "Update Tag" : "Save Tag"}
      </button>
    </form>
  );
}

export default TagForm;