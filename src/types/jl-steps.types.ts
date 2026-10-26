/** One step of a process. */
export type StepItem = {
  label: string;
  description?: string;
};

export type StepsOrientation = 'horizontal' | 'vertical';

/** Where a step stands against the current one. */
export type StepStatus = 'done' | 'current' | 'upcoming';
