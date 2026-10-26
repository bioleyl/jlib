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
  indicator.style.setProperty('--x', `${target.offsetLeft}px`);
  indicator.style.setProperty('--y', `${target.offsetTop}px`);
  indicator.style.setProperty('--w', `${target.offsetWidth}px`);
  indicator.style.setProperty('--h', `${target.offsetHeight}px`);
  const measured = target.offsetWidth > 0;
  if (measured && indicator.dataset.placed === undefined) {
    requestAnimationFrame(() => {
      indicator.dataset.placed = '';
    });
  }
}
