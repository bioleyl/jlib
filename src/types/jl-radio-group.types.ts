/**
 * One choice of a radio group, with an optional line that explains it. Typed by its values
 * (`RadioOption<'card' | 'invoice'>`), `value` is one of them.
 */
export type RadioOption<Value extends string = string> = {
  value: Value;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type RadioGroupOrientation = 'vertical' | 'horizontal';

/** `plain` draws a dot beside each label, `cards` a bordered card per option. */
export type RadioGroupVariant = 'plain' | 'cards';
