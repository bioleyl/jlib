// Type tests: `npm run typecheck` checks them, nothing runs them. A component that chooses among values, typed by
// them, takes options of those values only and gives its event and its value as one of them.
import { describe, expectTypeOf, it } from 'vitest';

import type { JlSelect } from '../src/atoms/jl-select';
import type { JlChipGroup } from '../src/molecules/jl-chip-group';
import type { JlMenu } from '../src/molecules/jl-menu';
import type { JlRadioGroup } from '../src/molecules/jl-radio-group';
import type { JlSegmented } from '../src/molecules/jl-segmented';
import type { JlCommandPalette } from '../src/organisms/jl-command-palette';
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

declare const menu: JlMenu<'edit' | 'delete'>;

describe('a menu typed by its values', () => {
  it('takes actions of those values only, and gives select one of them, for a mapper that misses none', () => {
    menu.items.set([{ label: 'Edit', value: 'edit' }, { divider: true }, { label: 'Delete', value: 'delete' }]);
    // @ts-expect-error: not an action of the menu
    menu.items.set([{ label: 'Copy', value: 'copy' }]);
    const actions: Record<'edit' | 'delete', () => void> = { delete: () => undefined, edit: () => undefined };
    menu.events.register('select', (value) => actions[value]());
  });
});

declare const palette: JlCommandPalette<'theme' | `open:${string}`>;

describe('a command palette typed by its ids', () => {
  it('takes commands of those ids only, and gives select one of them', () => {
    palette.commands.set([{ id: 'open:42', label: 'Order 42' }]);
    // @ts-expect-error: not a command of the palette
    palette.commands.set([{ id: 'quit', label: 'Quit' }]);
    palette.events.register('select', (id) => expectTypeOf(id).toEqualTypeOf<'theme' | `open:${string}`>());
  });
});
