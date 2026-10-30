import { fillText } from './text';

import type { JlTextKey, JlTexts } from '../types/texts.types';

/**
 * Every text jlib's components show or say on their own, in English: labels for screen readers, buttons, states,
 * the defaults of their text inputs. `{placeholders}` are filled when the text is shown.
 */
export const DEFAULT_TEXTS = {
  addTag: 'Add at least one tag.',
  addValue: 'Add a value',
  back: 'Back',
  breadcrumb: 'Breadcrumb',
  browse: 'Browse',
  chooseDate: 'Choose a date',
  chooseDateMissing: 'Choose a date.',
  chooseFile: 'Choose a file.',
  chooseOption: 'Choose an option.',
  chooseRating: 'Choose a rating.',
  chosenFiles: 'Chosen files',
  clear: 'Clear',
  clearSearch: 'Clear the search',
  close: 'Close',
  closeMenu: 'Close the menu',
  collapseMenu: 'Collapse the menu',
  commandPalette: 'Command palette',
  commandPlaceholder: 'Type a command or search…',
  commands: 'Commands',
  copied: 'Copied',
  copy: 'Copy',
  decrease: 'Decrease',
  details: 'Details',
  detailsOf: 'Details of {name}',
  dismiss: 'Dismiss',
  downloadCancel: 'Cancel',
  downloadFailed: 'Not downloaded: {error}',
  downloadPreparing: 'Preparing the file… {time}',
  downloadReceived: '{received} received',
  downloadReceivedOf: '{received} of {total}',
  downloadSaved: 'Saved as {name}, {size}',
  dragToConnect: 'Drag to another node to connect',
  dropFile: 'Drop a file here',
  dropFiles: 'Drop files here',
  expandMenu: 'Expand the menu',
  failedStep: ', failed',
  fileTooLarge: 'is larger than {size}',
  fileTooMany: 'is one too many: the field takes a single file',
  fileUpTo: 'up to {size}',
  fileWrongType: 'is not an accepted type ({types})',
  fillField: 'Please fill in this field.',
  fitView: 'Show every node',
  flow: 'Flow',
  hidePassword: 'Hide the password',
  increase: 'Increase',
  leave: 'Leave',
  leaveText: 'Your changes are lost.',
  loadError: 'This could not be loaded.',
  loading: 'Loading',
  loadingMore: 'Loading…',
  loadStateError: 'Check the connection, then try again. Nothing was changed.',
  mainNavigation: 'Main',
  menu: 'Menu',
  navigation: 'Navigation',
  nextMonth: 'Next month',
  nextPage: 'Next page',
  noCommands: 'No matching commands',
  noData: 'No data',
  noResults: 'No results',
  notifications: 'Notifications',
  pagination: 'Pagination',
  previousMonth: 'Previous month',
  previousPage: 'Previous page',
  progress: 'Progress',
  rating: 'Rating',
  remove: 'Remove',
  removeEdge: 'Remove this edge',
  removeNamed: 'Remove {name}',
  removeValue: 'Remove this value',
  resizePanes: 'Resize the panes',
  retry: 'Try again',
  search: 'Search',
  selectOption: 'Please select one of these options.',
  shortcuts: 'Shortcuts',
  showMore: 'Show more',
  showMoreCount: 'Show {count} more',
  shownOfTotal: '{shown} of {total}',
  showOptions: 'Show the options',
  showPassword: 'Show the password',
  stay: 'Keep editing',
  stepCurrent: ', current step',
  stepDone: ', completed',
  tidyLayout: 'Tidy up the layout',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
} as const;

const current: Record<JlTextKey, string> = { ...DEFAULT_TEXTS };

/**
 * Gives jlib's components their texts in the page's language, before they are drawn: once at start, as a page
 * reads its own messages. A text left out stays English.
 */
export function setTexts(texts: JlTexts): void {
  Object.assign(current, texts);
}

/** One of jlib's texts, in the language the page set, its `{placeholders}` filled. */
export const jlText = (key: JlTextKey, values: Readonly<Record<string, string>> = {}): string =>
  fillText(current[key], values);
