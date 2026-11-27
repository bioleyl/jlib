const holdsText = (node: Node): boolean => !(node instanceof Element) && (node.textContent ?? '').trim() !== '';

/** Whether a slot holds something to show: an element, or text that is not only white space. */
export function hasSlotted(slot: HTMLSlotElement): boolean {
  return slot.assignedNodes({ flatten: true }).some((node) => node instanceof Element || holdsText(node));
}

/** The elements a slot holds that the page shows: those it keeps `hidden` are left out. */
export function shownSlotted(slot: HTMLSlotElement): Element[] {
  return slot.assignedElements({ flatten: true }).filter((element) => !element.hasAttribute('hidden'));
}

/** Whether a slot holds something that shows: an element that is not `hidden`, or text that is not only white space. */
export function showsSlotted(slot: HTMLSlotElement): boolean {
  return shownSlotted(slot).length > 0 || slot.assignedNodes({ flatten: true }).some(holdsText);
}
