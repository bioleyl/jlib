// Type tests: `npm run typecheck` checks them, nothing runs them. In JSX (Jadis 1.6), a component's events are `on…`
// props, their handlers given the event's detail, typed as the component is.
import { describe, expectTypeOf, it } from 'vitest';

import type { JlButton } from '../src/atoms/jl-button';
import type { JlSelect } from '../src/atoms/jl-select';
import type { JlLoadState } from '../src/molecules/jl-load-state';
import type { JlPageOutlet } from '../src/organisms/jl-page-outlet';
import type { LoadState } from '../src/types/jl-load-state.types';
import type { View } from './types/choices.types';

declare const Button: typeof JlButton;
declare const Select: typeof JlSelect;
declare const Loader: typeof JlLoadState;
declare const Outlet: typeof JlPageOutlet;

describe("a component's events in JSX", () => {
  it('give each handler the detail of its event', () => {
    expectTypeOf(<Button onPress={(detail) => expectTypeOf(detail).toEqualTypeOf<undefined>()} />).toBeAny();
    expectTypeOf(<Loader onState={(state) => expectTypeOf(state).toEqualTypeOf<LoadState>()} />).toBeAny();
    expectTypeOf(<Outlet onShow={(page) => expectTypeOf(page).toEqualTypeOf<HTMLElement>()} />).toBeAny();
  });

  it('type the detail as the component is typed', () => {
    expectTypeOf(<Select<View> onChange={(value) => expectTypeOf(value).toEqualTypeOf<View>()} />).toBeAny();
    // @ts-expect-error: the handler of change takes one of the values
    expectTypeOf(<Select<View> onChange={(value: number) => value} />).toBeAny();
  });

  it('have no prop for an event the component does not emit', () => {
    // @ts-expect-error: a button emits press, not select
    expectTypeOf(<Button onSelect={() => undefined} />).toBeAny();
  });
});
