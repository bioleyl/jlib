import type { Tone } from './options.types';

export type TimelineItem = {
  title: string;
  /** When it happened, as text: `2 min ago`, `09:41`, `Mar 3`. */
  time?: string;
  description?: string;
  tone?: Tone;
  /** An icon in a circle instead of the dot. */
  icon?: string;
};
