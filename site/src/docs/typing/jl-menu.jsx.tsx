import { Jadis } from '@jadis/core';
import { JlButton, JlMenu } from '@syware/jlib';

import type { MenuItem } from '@syware/jlib';

type FileAction = 'rename' | 'duplicate' | 'delete';

declare function renameFile(): void; // (not shown)
declare function duplicateFile(): void; // (not shown)
declare function deleteFile(): void; // (not shown)

const FILE_ACTIONS: MenuItem<FileAction>[] = [
  { icon: 'pencil', label: 'Rename', value: 'rename' },
  { icon: 'copy', label: 'Duplicate', value: 'duplicate' },
  { divider: true },
  { danger: true, icon: 'trash', label: 'Delete', value: 'delete' },
];

// One handler per action: TypeScript refuses this record while an action is missing.
const ACTIONS: Record<FileAction, () => void> = {
  delete: deleteFile,
  duplicate: duplicateFile,
  rename: renameFile,
};

export class FileRow extends Jadis {
  static readonly selector = 'file-row';

  templateHtml(): Node {
    return (
      <JlMenu<FileAction> label="File actions" items={FILE_ACTIONS} onSelect={(action) => ACTIONS[action]()}>
        <JlButton slot="trigger" variant="ghost" size="sm" icon="ellipsis" hint="More" />
      </JlMenu>
    );
  }
}

FileRow.register();
