import { JlBadge } from '@syware/jlib';

import type { JlFacts } from '@syware/jlib';
import type { ComponentDoc } from '../../types/docs.types';

const OBJECT = JSON.stringify([
  { label: 'Kind', value: 'BasicContainer' },
  { label: 'Parent', value: 'info:fedora/archive' },
  { label: 'Size', value: '1.4 MB' },
  {
    code: true,
    label: 'SHA-512',
    value:
      '9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043',
  },
  { label: 'Deleted', value: null },
  { label: 'Created', value: '25 Oct 2026, 22:47' },
]);

const ORDER = JSON.stringify([
  { href: '#customer', label: 'Customer', value: 'Sara Monnier' },
  { code: true, label: 'Job', value: 'CH-2026-0160' },
  { label: 'Sent', value: '25 Oct, 22:47' },
  { label: 'Items', value: 4 },
]);

export const doc: ComponentDoc = {
  className: 'JlFacts',
  description: `The facts about one thing, each a label and its value: an archived object's kind, size and digest, an
order's customer and date. Give them as JSON in items, in the order people read them. A fact without a value (null
or empty) is left out, so a page can list every fact a thing may have; an element with none takes no room.

A value can be code (monospace, broken anywhere, for identifiers and digests), a link (href), or drawn by code: a
fact with a key is drawn by the renderer of that key in renderers (a badge, links, a list). Labels sit beside
their values and line up in one column; vertical puts each label over its value, the facts side by side, for a
summary under a heading. Narrower than 420 pixels, the labels go over their values either way.`,
  examples: [
    {
      description: 'An object of an archive: the deleted fact has no value, so it is left out.',
      html: `<jl-facts class="narrow" label="Object" items='${OBJECT}'></jl-facts>`,
      title: 'Labels beside values',
    },
    {
      description: 'vertical: each label over its value, the facts side by side.',
      html: `<jl-facts orientation="vertical" label="Order" items='${ORDER}'></jl-facts>`,
      title: 'Side by side',
    },
    {
      description: 'renderers draws the value of a fact by its key: here the state as a badge.',
      html: `<jl-facts class="demo-rendered narrow" label="Ingest"></jl-facts>`,
      script: `
        const facts = root.querySelector('jl-facts');
        facts.renderers.set({ state: (fact) => <JlBadge tone="ok" label={fact.value} /> });
        facts.items.set([
          { label: 'Package', value: 'Letters 1902' },
          { key: 'state', label: 'State', value: 'Committed' },
        ]);`,
      setup: (root) => {
        const facts = root.querySelector<JlFacts>('.demo-rendered');
        facts?.renderers.set({
          state: (fact) => {
            const badge = new JlBadge();
            badge.tone.set('ok');
            badge.label.set(String(fact.value));
            return badge;
          },
        });
        facts?.items.set([
          { label: 'Package', value: 'Letters 1902' },
          { key: 'state', label: 'State', value: 'Committed' },
        ]);
      },
      title: 'Values drawn by code',
    },
  ],
  level: 'molecule',
  name: 'Facts',
  playground: {
    attributes: { items: ORDER, label: 'Order', orientation: 'horizontal' },
    width: 440,
  },
  props: [
    {
      attribute: 'items',
      control: { kind: 'json' },
      default: '[]',
      description:
        'The facts: label and value, and optionally code (monospace), href (a link), hint (a tooltip) and key (for a renderer). A fact whose value is null or empty is left out.',
      name: 'items',
      type: 'Fact[]',
    },
    {
      attribute: 'orientation',
      control: { kind: 'select', options: ['horizontal', 'vertical'] },
      default: "'horizontal'",
      description: 'horizontal puts each label beside its value, vertical over it, the facts side by side.',
      name: 'orientation',
      type: "'horizontal' | 'vertical'",
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'The name of the list for screen readers.',
      name: 'label',
      type: 'string',
    },
    {
      default: '{}',
      description: "Draws the values of some facts by code, by the fact's key: (fact) => Node.",
      name: 'renderers',
      type: 'Record<string, FactRenderer>',
    },
  ],
  styling: [{ description: 'The description list.', name: 'base' }],
  summary: 'The facts about one thing, label and value, the ones without a value left out.',
  tag: 'jl-facts',
};
