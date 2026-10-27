/** One step of a process. */
export type StepItem = {
  label: string;
  description?: string;
  /** The step ended in failure (a payment refused, a transaction rolled back): an × in the danger colour. */
  failed?: boolean;
};

export type StepsOrientation = 'horizontal' | 'vertical';

/** Where a step stands against the current one. */
export type StepStatus = 'done' | 'current' | 'upcoming';
