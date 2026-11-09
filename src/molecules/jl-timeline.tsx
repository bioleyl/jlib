import { css } from '@jadis/core';

import { JlIcon } from '../atoms/jl-icon';
import { JlElement } from '../base/jl-element';
import { jsonOf } from '../lib/attributes';
import { setOrRemove } from '../lib/dom';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-timeline.css?inline';

import type { TimelineItem } from '../types/jl-timeline.types';

/**
 * What happened, in order, along a vertical line: each event a dot (or an icon in a circle) in its tone's colour,
 * its time beside the marker (the times in one column), a title and an optional description. `compact` tightens it
 * for side panels.
 */
export class JlTimeline extends JlElement {
  static readonly selector = 'jl-timeline';

  readonly items = this.useChange<TimelineItem[]>([], (value) => this.renderItems(value), {
    attribute: 'items',
    parse: jsonOf<TimelineItem[]>([]),
  });
  /** Smaller markers and less space between events. */
  readonly compact = this.useChange(false, (value) => this.reflect('compact', value), { attribute: 'compact' });
  /** The list's name for screen readers. */
  readonly label = this.useChange('', (value) => setOrRemove(this._refs.list, 'aria-label', value), {
    attribute: 'label',
  });

  // The items the events show: the same list again (an attribute's second call at connection) makes none.
  private readonly _drawn: { items?: TimelineItem[] } = {};

  private readonly _refs = this.useRefs((ref) => ({ list: ref('ol') }));

  templateHtml(): Node {
    return <ol class="timeline" attrs={{ part: 'base' }} />;
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  private renderItems(items: TimelineItem[]): void {
    if (items === this._drawn.items) {
      return;
    }
    this._drawn.items = items;
    this._refs.list.replaceChildren(...items.map((item) => this.itemNode(item)));
  }

  /** An event; the CSS sizes its icon, smaller when compact (--icon-size). */
  private itemNode(item: TimelineItem): Node {
    const marker =
      item.icon === undefined ? (
        <span class="marker dot" aria-hidden="true" />
      ) : (
        <span class="marker circle" aria-hidden="true">
          <JlIcon name={item.icon} />
        </span>
      );
    return (
      <li class="event" data-tone={item.tone ?? 'neutral'}>
        <span class="rail">{marker}</span>
        {item.time === undefined ? null : <time class="time">{item.time}</time>}
        <div class="content">
          <p class="title">{item.title}</p>
          {item.description === undefined ? null : <p class="description">{item.description}</p>}
        </div>
      </li>
    );
  }
}

JlTimeline.register();
