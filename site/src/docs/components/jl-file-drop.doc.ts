import type { JlButton, JlFileDrop } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const TWO_MB = String(2 * 1024 * 1024);
const TEN_MB = String(10 * 1024 * 1024);

export const doc: ComponentDoc = {
  className: 'JlFileDrop',
  description: `A zone to drop files on, with a Browse button for those who would rather pick them. It turns blue while
files are dragged over it. The files it takes are listed under it, with their size and a button to take each one
back; the ones it refuses (not of an accepted type, larger than max-size, one too many) are listed with the reason.

Without multiple, a new file replaces the one there. In a form, the files are entries under the field's name, as
from a native file input, so a multipart submission sends them. Read them with the files property.`,
  events: [{ description: 'Files were added or taken back: the whole list.', detail: 'File[]', name: 'change' }],
  examples: [
    {
      description: 'Images up to 2 MB, several at once. Drop a text file or a large photo to see it refused.',
      html: `
        <div class="narrow">
          <jl-file-drop label="Screenshots" accept="image/*" max-size="${TWO_MB}" multiple></jl-file-drop>
        </div>`,
      title: 'Several images',
    },
    {
      description: 'One PDF, with a text of its own; a second file replaces the first.',
      html: `
        <div class="narrow">
          <jl-file-drop accept=".pdf" max-size="${TEN_MB}" text="Drop your CV here"></jl-file-drop>
        </div>`,
      title: 'A single file',
    },
    {
      description: 'The paragraph lists what change gives; the button empties the field with clear().',
      html: `
        <div class="stack narrow">
          <jl-file-drop class="demo-files" size="sm" multiple text="Attachments"></jl-file-drop>
          <div class="row">
            <jl-button class="demo-clear" size="sm" icon="trash" label="Remove all"></jl-button>
            <span class="muted demo-files-out">No attachment.</span>
          </div>
        </div>`,
      script: `
        const drop = root.querySelector('.demo-files');
        const out = root.querySelector('.demo-files-out');
        drop.events.register('change', (files) => {
          const total = files.reduce((sum, file) => sum + file.size, 0);
          out.textContent = \`\${files.length} file(s), \${total} bytes.\`;
        });
        root.querySelector('.demo-clear').events.register('press', () => {
          drop.clear();
          out.textContent = 'No attachment.';
        });`,
      setup: (root) => {
        const drop = root.querySelector<JlFileDrop>('.demo-files');
        const out = root.querySelector('.demo-files-out');
        const show = (text: string): void => {
          if (out !== null) {
            out.textContent = text;
          }
        };
        drop?.events.register('change', (files) => {
          const total = files.reduce((sum, file) => sum + file.size, 0);
          show(`${files.length} file(s), ${total} bytes.`);
        });
        root.querySelector<JlButton>('.demo-clear')?.events.register('press', () => {
          drop?.clear();
          show('No attachment.');
        });
      },
      title: 'Compact, and listening',
    },
    {
      description: 'The form data holds the files under the name "photos".',
      html: `
        <form class="stack narrow demo-upload">
          <jl-file-drop name="photos" accept="image/*" multiple required></jl-file-drop>
          <div class="row">
            <jl-button type="submit" variant="primary" icon="upload" label="Upload"></jl-button>
          </div>
          <p class="muted demo-upload-out">Choose images, then upload.</p>
        </form>`,
      script: `
        const form = root.querySelector('.demo-upload');
        const out = root.querySelector('.demo-upload-out');
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          const names = new FormData(form).getAll('photos').map((file) => file.name);
          out.textContent = \`Would upload: \${names.join(', ')}\`;
        });`,
      setup: (root) => {
        const form = root.querySelector<HTMLFormElement>('.demo-upload');
        const out = root.querySelector('.demo-upload-out');
        form?.addEventListener('submit', (event) => {
          event.preventDefault();
          const names = new FormData(form)
            .getAll('photos')
            .map((entry) => (entry instanceof File ? entry.name : entry));
          if (out !== null) {
            out.textContent = `Would upload: ${names.join(', ')}`;
          }
        });
      },
      title: 'In a form',
    },
    {
      html: `
        <div class="stack narrow">
          <jl-file-drop disabled text="Uploads are paused"></jl-file-drop>
          <jl-file-drop invalid size="sm" text="A file is required"></jl-file-drop>
        </div>`,
      title: 'States',
    },
  ],
  level: 'molecule',
  methods: [
    { description: 'Opens the file chooser.', name: 'browse', signature: 'browse(): void' },
    {
      description:
        'Takes files as a drop would, such as files dropped elsewhere on the page: those it accepts fire change, the others say why not.',
      name: 'add',
      signature: 'add(files: File[]): void',
    },
    {
      description: 'Takes every file back and empties the list of refused ones; fires nothing.',
      name: 'clear',
      signature: 'clear(): void',
    },
    { description: 'Focuses the Browse button.', name: 'focus', signature: 'focus(options?: FocusOptions): void' },
    {
      description: 'Whether a required field has a file.',
      name: 'checkValidity',
      signature: 'checkValidity(): boolean',
    },
  ],
  name: 'File drop',
  playground: {
    attributes: { accept: 'image/*,.pdf', 'max-size': TEN_MB, multiple: true },
  },
  props: [
    {
      default: '[]',
      description: 'The files it holds, in the order they came (read only).',
      name: 'files',
      type: 'File[]',
    },
    {
      attribute: 'accept',
      control: { kind: 'text' },
      default: "''",
      description:
        'The types it takes, as a file input’s accept: extensions, MIME types, families such as image/*.',
      name: 'accept',
      type: 'string',
    },
    {
      attribute: 'multiple',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Takes several files; otherwise a new one replaces the file there.',
      name: 'multiple',
      type: 'boolean',
    },
    {
      attribute: 'max-size',
      control: { kind: 'number', min: 0, step: 1024 },
      default: '0',
      description: 'The largest file it takes, in bytes; 0 for no limit.',
      name: 'maxSize',
      type: 'number',
    },
    {
      attribute: 'text',
      control: { kind: 'text' },
      default: "''",
      description: 'The text in the zone; by default "Drop a file here" (or files).',
      name: 'text',
      type: 'string',
    },
    {
      attribute: 'size',
      control: { kind: 'select', options: ['sm', 'md', 'lg'] },
      default: "'md'",
      description: 'How roomy the zone is.',
      name: 'size',
      type: "'sm' | 'md' | 'lg'",
    },
    {
      attribute: 'name',
      default: "''",
      description: "The field's name in the form's data: each file is an entry under it.",
      name: 'name',
      type: 'string',
    },
    {
      attribute: 'label',
      default: "''",
      description: 'The accessible name of the zone, when its text is not enough.',
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'required',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'The form cannot be submitted without a file.',
      name: 'required',
      type: 'boolean',
    },
    {
      attribute: 'disabled',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Takes no file; the chosen ones stay listed.',
      name: 'disabled',
      type: 'boolean',
    },
    {
      attribute: 'invalid',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'The zone drawn in the danger colour, for an error the page found.',
      name: 'invalid',
      type: 'boolean',
    },
  ],
  styling: [{ description: 'The drop zone.', name: 'base' }],
  summary: 'A zone to drop files on or browse for them, with the chosen files listed under it.',
  tag: 'jl-file-drop',
};
