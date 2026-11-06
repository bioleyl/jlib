import { css } from '@jadis/core';

import { JlElement } from '../base/jl-element';
import { jsonOf, oneOf } from '../lib/attributes';
import { setOrRemove } from '../lib/dom';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-facts.css?inline';

import type { Fact, FactRenderer, FactsOrientation } from '../types/jl-facts.types';

export const FACTS_ORIENTATIONS: readonly FactsOrientation[] = ['horizontal', 'vertical'];

const hasValue = (fact: Fact): boolean => fact.value !== null && fact.value !== undefined && fact.value !== '';

/**
 * The facts about one thing, label and value: an object's size and digest, an order's customer and date. Facts
 * without a value are left out, and an element with none takes no room. Values can be code (monospace, broken
 * anywhere), links, or drawn by code (`renderers`, by a fact's `key`). Narrower than 420 pixels, labels go over
 * their values. A fact with an `id` instead of an `href` is a link the app follows: the facts fire `select` with it.
 */
export class JlFacts extends JlElement {
  static readonly selector = 'jl-facts';

  readonly events = this.useEvents<{ select: string }>();

  readonly items = this.useChange<Fact[]>([], () => this.render(), {
    attribute: 'items',
    parse: jsonOf<Fact[]>([]),
  });
  readonly orientation = this.useChange<FactsOrientation>(
    'horizontal',
    (value) => this.reflect('orientation', value),
    { attribute: 'orientation', parse: oneOf(FACTS_ORIENTATIONS, 'horizontal') }
  );
  /** Draws the values of some facts by code, by their `key`: `{ type: (fact) => <JlBadge label={…} /> }`. */
  readonly renderers = this.useChange<Record<string, FactRenderer>>({}, () => this.render());
  /** The list's name for screen readers. */
  readonly label = this.useChange('', (value) => setOrRemove(this._refs.list, 'aria-label', value), {
    attribute: 'label',
  });

  private readonly _refs = this.useRefs((ref) => ({ list: ref('dl') }));

  templateHtml(): Node {
    return <dl class="facts" attrs={{ part: 'base' }} />;
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this.on(this._refs.list, 'click', (event) => {
      const id = (event.target as Element).closest<HTMLElement>('button.link')?.dataset.id;
      const fact = this.items.get().find((candidate) => candidate.id !== undefined && candidate.id === id);
      if (fact?.id !== undefined) {
        this.events.emit('select', fact.id);
      }
    });
  }

  private render(): void {
    const shown = this.items.get().filter(hasValue);
    this._refs.list.replaceChildren(
      ...shown.map((fact) => (
        <div class="fact">
          <dt>{fact.label}</dt>
          <dd title={fact.hint}>{this.valueNode(fact)}</dd>
        </div>
      ))
    );
    this.reflect('empty', shown.length === 0);
  }

  private valueNode(fact: Fact): Node {
    const renderer = fact.key === undefined ? undefined : this.renderers.get()[fact.key];
    if (renderer !== undefined) {
      return renderer(fact);
    }
    const text = String(fact.value);
    const content = fact.code ? <code>{text}</code> : document.createTextNode(text);
    if (fact.href !== undefined) {
      return <a href={fact.href}>{content}</a>;
    }
    return fact.id === undefined ? (
      content
    ) : (
      <button type="button" class="link" data-id={fact.id}>
        {content}
      </button>
    );
  }
}

JlFacts.register();
