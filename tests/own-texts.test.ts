// @vitest-environment happy-dom
// The texts a component says on its own follow jlib's language: none stays in English in a French page.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { JlAvatar } from '../src/atoms/jl-avatar';
import { JlLink } from '../src/atoms/jl-link';
import { JlProgress } from '../src/atoms/jl-progress';
import { JlProgressRing } from '../src/atoms/jl-progress-ring';
import { jlTexts } from '../src/lib/texts';
import { JlFlow } from '../src/organisms/jl-flow';

/** Puts a component in the page, with the inputs a test needs written as attributes. */
function mount<Element extends HTMLElement>(tag: string, attributes: Record<string, string> = {}): Element {
  const element = document.createElement(tag) as Element;
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  document.body.append(element);
  return element;
}

const inside = (element: HTMLElement, selector: string): Element | null | undefined =>
  element.shadowRoot?.querySelector(selector);

describe('the texts components say on their own, in French', () => {
  // happy-dom gives elements no `part`, which the flow toggles on its nodes: one that keeps nothing stands in.
  beforeAll(() => {
    if (!('part' in HTMLElement.prototype)) {
      Object.defineProperty(HTMLElement.prototype, 'part', { get: () => ({ toggle: () => false }) });
    }
  });

  afterAll(() => jlTexts.setLocale('en'));

  it('follow the language: a link to a new tab, an avatar status, a progress without a label, a flow', async () => {
    const link = mount<JlLink>(JlLink.selector, { external: '', href: 'https://example.org' });
    const avatar = mount<JlAvatar>(JlAvatar.selector, { name: 'Ada Lovelace', status: 'away' });
    const bar = mount<JlProgress>(JlProgress.selector, { value: '40' });
    const ring = mount<JlProgressRing>(JlProgressRing.selector, { value: '40' });
    const flow = mount<JlFlow>(JlFlow.selector);
    flow.graph.set({
      edges: [],
      nodes: [{ id: 'fetch', label: 'Fetch', position: { x: 0, y: 0 }, status: 'done' }],
    });
    // The flow draws its graph a moment after it was given.
    await new Promise((resolve) => setTimeout(resolve));
    const said = (): Record<string, string | null | undefined> => ({
      addAfter: inside(flow, '.add')?.getAttribute('aria-label'),
      avatar: inside(avatar, '.avatar')?.getAttribute('aria-label'),
      bar: inside(bar, '[role="progressbar"]')?.getAttribute('aria-label'),
      link: inside(link, '.new-tab')?.textContent,
      ring: inside(ring, '[role="progressbar"]')?.getAttribute('aria-label'),
      status: inside(flow, '.status')?.getAttribute('title'),
    });
    expect(said()).toEqual({
      addAfter: 'Add after Fetch',
      avatar: 'Ada Lovelace, away',
      bar: 'Progress',
      link: '(opens in a new tab)',
      ring: 'Progress',
      status: 'Done',
    });
    await jlTexts.setLocale('fr');
    expect(said()).toEqual({
      addAfter: 'Ajouter après Fetch',
      avatar: 'Ada Lovelace, absent',
      bar: 'Progression',
      link: "(s'ouvre dans un nouvel onglet)",
      ring: 'Progression',
      status: 'Terminé',
    });
  });
});
