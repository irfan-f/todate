import type { TimeType } from "../App";

const Time = ({ data }: { data: TimeType }) => {
  return (
    <div className="w-4/6 h-fit">
      <h1>{data.title}</h1>
      <h2>{data.date}</h2>
      <p>{data.comment}</p>
      {/* Selected Tags Chips */}
      <div className="flex flex-wrap gap-2 mb-2 min-h-10">
        {data.tags.map((tag) => (
          <span
            key={tag._id}
            className={`text-white px-3 py-1 rounded-full text-sm font-medium ${tag.color} flex items-center`}
          >
            {tag.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default Time;