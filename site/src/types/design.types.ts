/** A colour of the palette: its token, what it is for, and the colour it is read against (for its contrast). */
export type ColourRole = { token: string; name: string; use: string; against?: string };

export type ColourFamily = { label: string; description: string; roles: readonly ColourRole[] };

/** A step of the type scale, as the site and the components use it. */
export type TypeStep = {
  name: string;
  size: number;
  lineHeight: number;
  weight: number;
  use: string;
  sample: string;
  token?: string;
  mono?: boolean;
  caps?: boolean;
  muted?: boolean;
};

export type SpaceStep = { token: string; px: number; use: string };

export type RadiusStep = { token: string; use: string };

export type Elevation = { level: string; name: string; token: string; use: string };

export type MotionUse = { what: string; duration: string; how: string };

export type KeyPattern = { components: string; keys: string };

export type WritingRule = { title: string; text: string; good: string; bad: string };
