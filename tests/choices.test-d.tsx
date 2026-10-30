// Type tests: `npm run typecheck` checks them, nothing runs them. A component that chooses among values, typed by
// them, takes options of those values only and gives its event and its value as one of them.
import { describe, expectTypeOf, it } from 'vitest';

import type { JlSelect } from '../src/atoms/jl-select';
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
