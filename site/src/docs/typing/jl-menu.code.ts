import type { JlMenu } from '@syware/jlib';

type FileAction = 'rename' | 'duplicate' | 'delete';

declare function renameFile(): void; // (not shown)
declare function duplicateFile(): void; // (not shown)
declare function deleteFile(): void; // (not shown)

// One handler per action: TypeScript refuses this record while an action is missing.
const ACTIONS: Record<FileAction, () => void> = {
  delete: deleteFile,
  duplicate: duplicateFile,
  rename: renameFile,
};

const menu = document.querySelector<JlMenu<FileAction>>('jl-menu.file');
menu?.items.set([
  { icon: 'pencil', label: 'Rename', value: 'rename' },
  { icon: 'copy', label: 'Duplicate', value: 'duplicate' },
  { divider: true },
  { danger: true, icon: 'trash', label: 'Delete', value: 'delete' },
]);
// @ts-expect-error: 'share' is not an action of the menu
menu?.items.set([{ label: 'Share', value: 'share' }]);
menu?.events.register('select', (action) => ACTIONS[action]());
