import type { Tone } from './options.types';

/**
 * How one state of something shows as a badge: its word, its tone, its icon, and a sentence on what it means. One
 * exhaustive map per kind of thing (`Record<OrderStatus, StatusLook>`) keeps every view saying a state the same way.
 */
export type StatusLook = { label: string; tone: Tone; icon?: string; hint?: string };
