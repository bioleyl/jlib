/** One choice of a radio group, with an optional line that explains it. */
export type RadioOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type RadioGroupOrientation = 'vertical' | 'horizontal';

/** `plain` draws a dot beside each label, `cards` a bordered card per option. */
export type RadioGroupVariant = 'plain' | 'cards';
