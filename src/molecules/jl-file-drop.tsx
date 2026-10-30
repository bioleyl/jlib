import { css } from '@jadis/core';
import { CircleAlert, File, Image, Upload, X } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlFormControl } from '../base/jl-form-control';
import { clampedNumber, oneOf } from '../lib/attributes';
import { setOrRemove, uniqueId } from '../lib/dom';
import { checkFiles, describeAccept, formatFileSize, isSameFile } from '../lib/files';
import { registerIcons } from '../lib/icons';
import { pageLocale } from '../lib/locale';
import { CONTROL_SIZES } from '../lib/options';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-file-drop.css?raw';

import type { FileRefusal, FileRules, RefusedFile } from '../types/files.types';
import type { ControlSize } from '../types/options.types';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ 'circle-alert': CircleAlert, file: File, image: Image, upload: Upload, x: X });

const ZONE_ICON_SIZES: Record<ControlSize, number> = { lg: 26, md: 22, sm: 18 };
const FILE_ICON_SIZE = 16;
const REMOVE_ICON_SIZE = 14;
const ALERT_ICON_SIZE = 14;
const NO_LIMIT = 0;
const FILES_TYPE = 'Files';
const IMAGE_FAMILY = 'image/';

const REASONS: Record<FileRefusal, (rules: FileRules) => string> = {
  count: () => jlText('fileTooMany'),
  size: (rules) => jlText('fileTooLarge', { size: formatFileSize(rules.maxSize, pageLocale()) }),
  type: (rules) => jlText('fileWrongType', { types: describeAccept(rules.accept) }),
};

const hasFiles = (event: DragEvent): boolean => event.dataTransfer?.types.includes(FILES_TYPE) ?? false;

/**
 * A zone to drop files on, with a button that opens the file chooser. The chosen files are listed under it with
 * their size and a button to take each one back; refused files are listed with the reason. The form gets the
 * files under the field's name, as from a native file input.
 */
export class JlFileDrop extends JlFormControl {
  static readonly selector = 'jl-file-drop';

  readonly events = this.useEvents<{ change: File[] }>();

  /** The types it takes, as a native file input's `accept`: `image/*,.pdf`. */
  readonly accept = this.useChange(
    '',
    (value) => {
      this._refs.picker.accept = value;
      this.renderHint();
    },
    { attribute: 'accept' }
  );
  /** Takes several files; otherwise a new file replaces the one there. */
  readonly multiple = this.useChange(
    false,
    (value) => {
      this._refs.picker.multiple = value;
      this.renderText();
    },
    { attribute: 'multiple' }
  );
  /** The largest file it takes, in bytes; 0 for no limit. */
  readonly maxSize = this.useChange(NO_LIMIT, () => this.renderHint(), {
    attribute: 'max-size',
    parse: clampedNumber(NO_LIMIT, 0, Number.MAX_SAFE_INTEGER),
  });
  /** The text in the zone; by default it says to drop a file, or files. */
  readonly text = this.useChange('', () => this.renderText(), { attribute: 'text' });
  /** The name of the zone for screen readers, when its text is not enough. */
  readonly label = this.useChange('', (value) => setOrRemove(this._refs.zone, 'aria-label', value), {
    attribute: 'label',
  });
  readonly required = this.useChange(
    false,
    (value) => {
      this.reflect('required', value);
      this.renderValidity();
    },
    { attribute: 'required' }
  );
  readonly disabled = this.useChange(false, (value) => this.renderDisabled(value), { attribute: 'disabled' });
  /** Draws the zone in the danger colour, for an error the page found itself. */
  readonly invalid = this.useChange(false, (value) => this.reflect('invalid', value), { attribute: 'invalid' });
  readonly size = this.useChange<ControlSize>(
    'md',
    (value) => {
      this.reflect('size', value);
      this._refs.zoneIcon.size.set(ZONE_ICON_SIZES[value]);
    },
    { attribute: 'size', parse: oneOf(CONTROL_SIZES, 'md') }
  );

  private readonly _ids = { hint: uniqueId('jl-file-drop-hint'), text: uniqueId('jl-file-drop-text') };

  private readonly _state = { depth: 0, files: [] as File[], refused: [] as RefusedFile<File>[] };

  // The form's entries carry the field's name: they are written again when it changes.
  private readonly _nameWatch = new MutationObserver(() => this.renderFormValue());

  private readonly _refs = this.useRefs((ref) => ({
    browse: ref<HTMLButtonElement>('.browse'),
    files: ref('.files'),
    hint: ref('.hint'),
    picker: ref<HTMLInputElement>('.picker'),
    refused: ref('.refused'),
    text: ref('.text'),
    zone: ref('.zone'),
    zoneIcon: ref<JlIcon>('.zone-icon'),
  }));

  /** The files chosen, in the order they came. */
  get files(): File[] {
    return [...this._state.files];
  }

  override focus(options?: FocusOptions): void {
    this._refs.browse.focus(options);
  }

  /** Opens the file chooser. */
  browse(): void {
    this.whenRendered(() => {
      if (!this.disabled.get()) {
        this._refs.picker.click();
      }
    });
  }

  /**
   * Takes files as a drop would, such as files dropped elsewhere on the page: the ones it accepts join the list (or
   * replace the file there) and fire `change`, the others say why not.
   */
  add(files: readonly File[]): void {
    this.whenRendered(() => this.take([...files]));
  }

  /** Takes every file back, and empties the list of refused ones. */
  clear(): void {
    this.whenRendered(() => {
      this.renderRefused([]);
      this.setFiles([]);
    });
  }

  templateHtml(): Node {
    return (
      <>
        {/* biome-ignore lint/a11y/useSemanticElements: a fieldset groups form fields; this is one drop zone */}
        <div
          class="zone"
          role="group"
          aria-labelledby={this._ids.text}
          aria-describedby={this._ids.hint}
          attrs={{ part: 'base' }}>
          <JlIcon class="zone-icon" name="upload" size={ZONE_ICON_SIZES.md} />
          <p class="text" id={this._ids.text} />
          <p class="hint" id={this._ids.hint} hidden />
          <button class="browse" type="button" aria-describedby={this._ids.hint} />
        </div>
        <input class="picker" type="file" tabIndex={-1} hidden />
        <ul class="refused" aria-live="polite" hidden />
        <ul class="files" hidden />
      </>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    const zone = this._refs.zone;
    this._nameWatch.observe(this, { attributeFilter: ['name'], attributes: true });
    this.renderFormValue();
    this.on(zone, 'click', () => this.browse());
    this.on(zone, 'dragenter', (event) => this.onDragEnter(event));
    this.on(zone, 'dragover', (event) => this.onDragOver(event));
    this.on(zone, 'dragleave', () => this.onDragLeave());
    this.on(zone, 'drop', (event) => this.onDrop(event));
    this.on(this._refs.picker, 'change', () => this.onPicked());
    this.on(this._refs.files, 'click', (event) => this.onFilesClick(event));
  }

  onDisconnect(): void {
    this._nameWatch.disconnect();
  }

  protected resetValue(): void {
    this.renderRefused([]);
    this.setFiles([]);
  }

  protected setDisabledByForm(disabled: boolean): void {
    // A disabled field gets this call as it upgrades, before its template exists: wait for it.
    this.whenRendered(() => {
      this._refs.browse.disabled = disabled || this.disabled.get();
    });
  }

  private canDrop(event: DragEvent): boolean {
    return hasFiles(event) && !this.disabled.get();
  }

  private onDragEnter(event: DragEvent): void {
    if (!this.canDrop(event)) {
      return;
    }
    event.preventDefault();
    // Entering a child of the zone leaves the zone itself: count, so the state holds until the pointer is out.
    this._state.depth += 1;
    this.reflect('dragging', true);
  }

  private onDragOver(event: DragEvent): void {
    if (!this.canDrop(event)) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer !== null) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  private onDragLeave(): void {
    this._state.depth = Math.max(0, this._state.depth - 1);
    if (this._state.depth === 0) {
      this.reflect('dragging', false);
    }
  }

  private onDrop(event: DragEvent): void {
    event.preventDefault();
    this._state.depth = 0;
    this.reflect('dragging', false);
    if (this.disabled.get()) {
      return;
    }
    this.take([...(event.dataTransfer?.files ?? [])]);
  }

  private onPicked(): void {
    const picker = this._refs.picker;
    this.take([...(picker.files ?? [])]);
    // Emptied, so that picking the same file again is still a change.
    picker.value = '';
  }

  private onFilesClick(event: MouseEvent): void {
    const button = (event.target as Element).closest<HTMLElement>('.file-remove');
    if (button === null) {
      return;
    }
    const index = Number(button.dataset.index);
    this.setFiles(this._state.files.filter((_, position) => position !== index));
    this.events.emit('change', this.files);
    this.focusAfterRemoval(index);
  }

  private focusAfterRemoval(index: number): void {
    const buttons = this._refs.files.querySelectorAll<HTMLElement>('.file-remove');
    const next = buttons[Math.min(index, buttons.length - 1)];
    if (next === undefined) {
      this.focus();
      return;
    }
    next.focus();
  }

  private rules(): FileRules {
    return { accept: this.accept.get(), maxSize: this.maxSize.get(), multiple: this.multiple.get() };
  }

  /** Files dropped or picked: the good ones join the list (or replace the file there), the others say why not. */
  private take(incoming: File[]): void {
    if (incoming.length === 0) {
      return;
    }
    const rules = this.rules();
    const kept = this._state.files;
    const fresh = rules.multiple
      ? incoming.filter((file) => !kept.some((known) => isSameFile(known, file)))
      : incoming;
    const check = checkFiles(fresh, rules);
    this.renderRefused(check.refused);
    if (check.accepted.length === 0) {
      return;
    }
    this.setFiles(rules.multiple ? [...kept, ...check.accepted] : check.accepted);
    this.events.emit('change', this.files);
  }

  private setFiles(files: File[]): void {
    this._state.files = files;
    this.renderFiles();
    this.renderFormValue();
    this.renderValidity();
  }

  private renderFiles(): void {
    const files = this._state.files;
    const editable = !this.disabled.get();
    const locale = pageLocale();
    this._refs.files.hidden = files.length === 0;
    this._refs.files.replaceChildren(
      ...files.map((file, index) => (
        <li class="file">
          <JlIcon
            class="file-icon"
            name={file.type.startsWith(IMAGE_FAMILY) ? 'image' : 'file'}
            size={FILE_ICON_SIZE}
          />
          <span class="file-name" title={file.name}>
            {file.name}
          </span>
          <span class="file-size">{formatFileSize(file.size, locale)}</span>
          {editable ? (
            <button
              class="file-remove"
              type="button"
              aria-label={jlText('removeNamed', { name: file.name })}
              data-index={String(index)}>
              <JlIcon name="x" size={REMOVE_ICON_SIZE} />
            </button>
          ) : null}
        </li>
      ))
    );
  }

  private renderRefused(refused: RefusedFile<File>[]): void {
    this._state.refused = refused;
    const rules = this.rules();
    this._refs.refused.hidden = refused.length === 0;
    this._refs.refused.replaceChildren(
      ...refused.map(({ file, reason }) => (
        <li class="refusal">
          <JlIcon name="circle-alert" size={ALERT_ICON_SIZE} />
          <span>
            <span class="refused-name">{file.name}</span> {REASONS[reason](rules)}
          </span>
        </li>
      ))
    );
  }

  protected drawTexts(): void {
    this._refs.browse.textContent = jlText('browse');
    this._refs.files.setAttribute('aria-label', jlText('chosenFiles'));
    this.renderText();
    this.renderHint();
    this.renderFiles();
    this.renderRefused(this._state.refused);
    this.renderValidity();
  }

  private renderText(): void {
    const text = this.text.get();
    const fallback = jlText(this.multiple.get() ? 'dropFiles' : 'dropFile');
    this._refs.text.textContent = text === '' ? fallback : text;
  }

  /** What it takes, under the text: `PNG, JPG · up to 5 MB`. */
  private renderHint(): void {
    const types = describeAccept(this.accept.get());
    const maxSize = this.maxSize.get();
    const limit = maxSize === NO_LIMIT ? '' : jlText('fileUpTo', { size: formatFileSize(maxSize, pageLocale()) });
    const hint = [types, limit].filter((part) => part !== '').join(' · ');
    this._refs.hint.textContent = hint;
    this._refs.hint.hidden = hint === '';
  }

  /** Each file is its own entry under the field's name, as from a native file input. */
  private renderFormValue(): void {
    const name = this.getAttribute('name') ?? '';
    if (name === '') {
      this.internals.setFormValue(null);
      return;
    }
    const data = new FormData();
    for (const file of this._state.files) {
      data.append(name, file);
    }
    this.internals.setFormValue(data);
  }

  private renderValidity(): void {
    if (this.required.get() && this._state.files.length === 0) {
      this.internals.setValidity({ valueMissing: true }, jlText('chooseFile'), this._refs.browse);
      return;
    }
    this.internals.setValidity({});
  }

  private renderDisabled(disabled: boolean): void {
    this._refs.browse.disabled = disabled;
    this.reflect('disabled', disabled);
    this.renderFiles();
  }
}

JlFileDrop.register();
