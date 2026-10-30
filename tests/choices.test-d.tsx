// Type tests: `npm run typecheck` checks them, nothing runs them. A component that chooses among values, typed by
// them, takes options of those values only and gives its event and its value as one of them.
import { describe, expectTypeOf, it } from 'vitest';

import type { JlSelect } from '../src/atoms/jl-select';
import type { JlChipGroup } from '../src/molecules/jl-chip-group';
import type { JlRadioGroup } from '../src/molecules/jl-radio-group';
import type { JlSegmented } from '../src/molecules/jl-segmented';
import type { View } from './types/choices.types';

declare const select: JlSelect<View>;

describe('a select typed by its values', () => {
  it('takes options of those values only, and gives change one of them', () => {
    select.options.set([{ label: 'List', value: 'list' }]);
    // @ts-expect-error: not one of the values
    select.options.set([{ label: 'Table', value: 'table' }]);
    select.events.register('change', (value) => expectTypeOf(value).toEqualTypeOf<View>());
    expectTypeOf(select.value.get()).toEqualTypeOf<View | ''>();
  });
});

declare const segmented: JlSegmented<View>;
declare const untyped: JlSegmented;
declare const Segmented: typeof JlSegmented;

describe('a segmented control typed by its values', () => {
  it('takes options of those values only, and gives change one of them', () => {
    segmented.options.set([{ label: 'List', value: 'list' }]);
    // @ts-expect-error: not one of the values
    segmented.options.set([{ label: 'Table', value: 'table' }]);
    segmented.events.register('change', (value) => expectTypeOf(value).toEqualTypeOf<View>());
    expectTypeOf(segmented.value.get()).toEqualTypeOf<View | ''>();
    // @ts-expect-error: not one of the values
    segmented.value.set('table');
  });

  it('reads the values from the options in JSX', () => {
    expectTypeOf(<Segmented options={[{ value: 'list' }]} value="list" />).toBeAny();
    // @ts-expect-error: not one of the options' values
    expectTypeOf(<Segmented<View> options={[{ value: 'list' }]} value="table" />).toBeAny();
  });

  it('stays a string without a type', () => {
    untyped.options.set([{ value: 'anything' }]);
    untyped.events.register('change', (value) => expectTypeOf(value).toEqualTypeOf<string>());
  });
});

declare const radios: JlRadioGroup<View>;

describe('a radio group typed by its values', () => {
  it('takes options of those values only, and gives change one of them', () => {
    radios.options.set([{ label: 'List', value: 'list' }]);
    // @ts-expect-error: not one of the values
    radios.options.set([{ label: 'Table', value: 'table' }]);
    radios.events.register('change', (value) => expectTypeOf(value).toEqualTypeOf<View>());
    expectTypeOf(radios.value.get()).toEqualTypeOf<View | ''>();
  });
});

declare const chips: JlChipGroup<View>;

describe('a chip group typed by its values', () => {
  it('takes options of those values only, and gives change a list of them', () => {
    chips.options.set([{ label: 'List', value: 'list' }]);
    // @ts-expect-error: not one of the values
    chips.options.set([{ label: 'Table', value: 'table' }]);
    chips.events.register('change', (values) => expectTypeOf(values).toEqualTypeOf<View[]>());
    expectTypeOf(chips.value.get()).toEqualTypeOf<View[]>();
  });
});
