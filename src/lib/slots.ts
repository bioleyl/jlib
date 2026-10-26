/** Whether a slot holds something to show: an element, or text that is not only white space. */
export function hasSlotted(slot: HTMLSlotElement): boolean {
  return slot
    .assignedNodes({ flatten: true })
    .some((node) => node instanceof Element || (node.textContent ?? '').trim() !== '');
}
