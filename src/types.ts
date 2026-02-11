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
export type TimesType = Record<string, TimeType>;
export type TagsType = Record<string, TagType>;