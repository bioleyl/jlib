/**
 * Scrolls a list just enough to show one of its items, without scrolling the page as `scrollIntoView` may. The
 * list must be the item's offset parent (`position: relative`).
 */
export function keepInView(list: HTMLElement, item: HTMLElement): void {
  const top = item.offsetTop;
  const bottom = top + item.offsetHeight;
  if (top < list.scrollTop) {
    list.scrollTop = top;
    return;
  }
  if (bottom > list.scrollTop + list.clientHeight) {
    list.scrollTop = bottom - list.clientHeight;
  }
}
