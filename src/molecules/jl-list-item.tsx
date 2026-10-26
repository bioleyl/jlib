import { css } from '@jadis/core';
import { ChevronRight } from 'lucide';

import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { setOrRemove } from '../lib/dom';
import { registerIcons } from '../lib/icons';
import { hasSlotted } from '../lib/slots';
import { isActivationKey, startedOnControl } from '../lib/surface';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-list-item.css?raw';

// The icons it draws itself: a page registers only the names it writes.
registerIcons({ 'chevron-right': ChevronRight });

const ICON_SIZE = 16;
const CHEVRON_SIZE = 16;
// What a link row is called by screen readers when it has no heading to name it.
const DEFAULT_LINK_NAME = 'Open';

/**
 * A row of a list: an icon or an avatar, a heading and a description, a short note at the end and trailing
 * controls. With `href` the row is a link; with `interactive` it fires `press`. Rows next to each other are
 * separated by a line.
 */
export class JlListItem extends JlElement {
  static readonly selector = 'jl-list-item';

  readonly events = this.useEvents<{ press: undefined }>();

  readonly heading = this.useChange(
    '',
    (value) => {
      this._refs.heading.textContent = value;
      this._refs.linkName.textContent = value || DEFAULT_LINK_NAME;
    },
    { attribute: 'heading' }
  );
  readonly description = this.useChange(
    '',
    (value) => {
      this._refs.description.textContent = value;
      this._refs.description.hidden = value === '';
    },
    { attribute: 'description' }
  );
  /** An icon at the start; `slot="start"` takes an avatar instead. */
  readonly icon = this.useChange('', () => this.renderStart(), { attribute: 'icon' });
  /** A short note at the end: a time, a count, a size. */
  readonly meta = this.useChange(
    '',
    (value) => {
      this._refs.meta.textContent = value;
      this._refs.meta.hidden = value === '';
    },
    { attribute: 'meta' }
  );
  /** Makes the row a link, named by its heading. The trailing controls stay pressable on their own. */
  readonly href = this.useChange('', () => this.renderInteraction(), { attribute: 'href' });
  /** Can be focused and pressed as a whole, and fires `press`. */
  readonly interactive = this.useChange(false, () => this.renderInteraction(), { attribute: 'interactive' });
  /** The current row: the open page of a menu, the shown item of a master list. */
  readonly selected = this.useChange(
    false,
    (value) => {
      this.reflect('selected', value);
      this.renderInteraction();
    },
    { attribute: 'selected' }
  );

  private readonly _refs = this.useRefs((ref) => ({
    chevron: ref<JlIcon>('.chevron'),
    description: ref('.description'),
    end: ref('.end'),
    endSlot: ref<HTMLSlotElement>('slot[name="end"]'),
    heading: ref('.heading'),
    icon: ref<JlIcon>('.icon'),
    iconBox: ref('.icon-box'),
    item: ref('.item'),
    link: ref<HTMLAnchorElement>('.link'),
    linkName: ref('.link-name'),
    meta: ref('.meta'),
    start: ref('.start'),
    startSlot: ref<HTMLSlotElement>('slot[name="start"]'),
  }));

  override focus(options?: FocusOptions): void {
    const target = this.href.get() === '' ? this._refs.item : this._refs.link;
    target.focus(options);
  }

  templateHtml(): Node {
    return (
      <div class="item" attrs={{ part: 'base' }}>
        {/* biome-ignore lint/a11y/useValidAnchor: the href is an input, set when the page gives one */}
        <a class="link" aria-describedby="description" hidden>
          <span class="link-name sr-only" />
        </a>
        <span class="start" hidden>
          <span class="icon-box">
            <JlIcon class="icon" size={ICON_SIZE} />
          </span>
          <slot name="start" />
        </span>
        <span class="text">
          <span class="heading" id="heading" />
          <span class="description" id="description" hidden />
        </span>
        <span class="meta" hidden />
        <span class="end" hidden>
          <slot name="end" />
        </span>
        <JlIcon class="chevron" name="chevron-right" size={CHEVRON_SIZE} hidden />
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    const item = this._refs.item;
    // The first slotchange can come before onConnect: draw the slots now, then follow the changes.
    this.renderStart();
    this.renderEnd();
    this.on(this._refs.startSlot, 'slotchange', () => this.renderStart());
    this.on(this._refs.endSlot, 'slotchange', () => this.renderEnd());
    this.on(item, 'click', (event) => {
      if (this.pressable() && !startedOnControl(event, item)) {
        this.events.emit('press');
      }
    });
    this.on(item, 'keydown', (event) => {
      if (this.pressable() && event.composedPath()[0] === item && isActivationKey(event)) {
        event.preventDefault();
        this.events.emit('press');
      }
    });
  }

  /** An interactive row without a link fires `press`; a link row leaves the press to the link. */
  private pressable(): boolean {
    return this.interactive.get() && this.href.get() === '';
  }

  private renderInteraction(): void {
    const href = this.href.get();
    const item = this._refs.item;
    const link = this._refs.link;
    const selected = this.selected.get();
    setOrRemove(link, 'href', href);
    link.hidden = href === '';
    this._refs.chevron.hidden = href === '';
    this.reflect('clickable', this.interactive.get() || href !== '');
    setOrRemove(link, 'aria-current', selected ? 'page' : '');
    if (!this.pressable()) {
      item.removeAttribute('tabindex');
      item.removeAttribute('role');
      item.removeAttribute('aria-labelledby');
      item.removeAttribute('aria-current');
      return;
    }
    item.tabIndex = 0;
    item.setAttribute('role', 'button');
    item.setAttribute('aria-labelledby', 'heading');
    setOrRemove(item, 'aria-current', selected ? 'true' : '');
  }

  /** The start holds an avatar when one is slotted, otherwise the icon, otherwise nothing. */
  private renderStart(): void {
    const icon = this.icon.get();
    const slotted = hasSlotted(this._refs.startSlot);
    this._refs.icon.name.set(icon);
    this._refs.iconBox.hidden = slotted || icon === '';
    this._refs.start.hidden = !slotted && icon === '';
  }

  private renderEnd(): void {
    this._refs.end.hidden = !hasSlotted(this._refs.endSlot);
  }
}

JlListItem.register();
