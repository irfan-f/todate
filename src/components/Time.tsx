import type { TimeType } from '../types';

const Time = ({ data }: { data: TimeType }) => {
  return (
    <div className="w-fit h-fit m-4 p-2 rounded-2xl bg-gray-400">
      <p className="text-2xl font-bold inline">{data.title}</p>
      <p className="pl-4 inline">{new Date(data.date).toLocaleString()}</p>
      <p>{data.comment}</p>
      {/* Selected Tags Chips */}
      <div className="flex flex-wrap gap-2 mb-2 min-h-10">
        {data.tags.map((tag) => (
          <span
            key={tag._id}
            className={`px-3 py-1 rounded-full text-sm font-medium flex items-center hover:bg-gray-100`}
          >
          <span
            className={`inline-block w-3 h-3 rounded mr-2`}
            style={{backgroundColor: tag.color}}
            aria-hidden="true"
          ></span>
            {tag.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default Time;