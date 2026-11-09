import { watchSizes } from './resize';

/** An indicator kept over a target that changes; see `followTarget`. */
interface IndicatorFollower {
  /** Asks for a move at the next frame: many asks before it make one move. */
  place(): void;
  /** Moves the indicator again whenever this element changes size. */
  watch(element: Element): void;
  /** Forgets the move asked for and stops watching. */
  stop(): void;
}

/**
 * Puts a sliding indicator (the underline of a tab, the thumb of a segmented control) over the chosen element:
 * its offset and size become `--x`, `--y`, `--w` and `--h`, which the component's styles use. The indicator gets
 * `data-placed` once it has a first position, so the styles can animate its later moves only.
 */
export function moveIndicator(indicator: HTMLElement, target: HTMLElement | null): void {
  indicator.hidden = target === null;
  if (target === null) {
    return;
  }
  // Every offset read before the first write: a read after a write lays the page out again.
  const { offsetHeight, offsetLeft, offsetTop, offsetWidth } = target;
  indicator.style.setProperty('--x', `${offsetLeft}px`);
  indicator.style.setProperty('--y', `${offsetTop}px`);
  indicator.style.setProperty('--w', `${offsetWidth}px`);
  indicator.style.setProperty('--h', `${offsetHeight}px`);
  if (offsetWidth > 0 && indicator.dataset.placed === undefined) {
    requestAnimationFrame(() => {
      indicator.dataset.placed = '';
    });
  }
}

/**
 * Keeps an indicator over its target, which `target` finds at the time of the move. A component's inputs each ask for
 * a move (several at its connection): measuring the target at each would lay the page out once per input, in the
 * middle of the changes. The move waits for the next frame instead, where the browser lays the page out anyway.
 */
export function followTarget(indicator: () => HTMLElement, target: () => HTMLElement | null): IndicatorFollower {
  const frame = { id: 0 };
  // A size change is reported once the layout is done: the move reads it at no cost.
  const sizes = watchSizes(() => moveIndicator(indicator(), target()));
  return {
    place: () => {
      if (frame.id !== 0) {
        return;
      }
      frame.id = requestAnimationFrame(() => {
        frame.id = 0;
        moveIndicator(indicator(), target());
      });
    },
    stop: () => {
      cancelAnimationFrame(frame.id);
      frame.id = 0;
      sizes.disconnect();
    },
    watch: (element) => sizes.observe(element),
  };
}
