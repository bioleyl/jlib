import { css } from '@jadis/core';

import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { jsonOf } from '../lib/attributes';
import { setOrRemove } from '../lib/dom';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-timeline.css?raw';

import type { TimelineItem } from '../types/jl-timeline.types';

const ICON_SIZE = 14;
const COMPACT_ICON_SIZE = 12;

/**
 * What happened, in order, along a vertical line: each event a dot (or an icon in a circle) in its tone's colour,
 * a title, an optional description, and its time on the right. `compact` tightens it for side panels.
 */
export class JlTimeline extends JlElement {
  static readonly selector = 'jl-timeline';

  readonly items = this.useChange<TimelineItem[]>([], () => this.render(), {
    attribute: 'items',
    parse: jsonOf<TimelineItem[]>([]),
  });
  /** Smaller markers and less space between events. */
  readonly compact = this.useChange(
    false,
    (value) => {
      this.reflect('compact', value);
      this.render();
    },
    { attribute: 'compact' }
  );
  /** The list's name for screen readers. */
  readonly label = this.useChange('', (value) => setOrRemove(this._refs.list, 'aria-label', value), {
    attribute: 'label',
  });

  private readonly _refs = this.useRefs((ref) => ({ list: ref('ol') }));

  templateHtml(): Node {
    return <ol class="timeline" attrs={{ part: 'base' }} />;
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  private render(): void {
    this._refs.list.replaceChildren(...this.items.get().map((item) => this.itemNode(item)));
  }

  private itemNode(item: TimelineItem): Node {
    const size = this.compact.get() ? COMPACT_ICON_SIZE : ICON_SIZE;
    const marker =
      item.icon === undefined ? (
        <span class="marker dot" aria-hidden="true" />
      ) : (
        <span class="marker circle" aria-hidden="true">
          <JlIcon name={item.icon} size={size} />
        </span>
      );
    return (
      <li class="event" data-tone={item.tone ?? 'neutral'}>
        <span class="rail">{marker}</span>
        <div class="content">
          <div class="line">
            <p class="title">{item.title}</p>
            {item.time === undefined ? null : <time class="time">{item.time}</time>}
          </div>
          {item.description === undefined ? null : <p class="description">{item.description}</p>}
        </div>
      </li>
    );
  }
}

JlTimeline.register();
