import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlInputList',
  description: `A field that takes several values, each in a row of its own: a record's titles, the dates of an event,
several descriptions. People type in each row (an input of any type, or a text area with multiline), or pick each
value from options; Add a value adds a row and each row has its remove button. max caps how many rows there are.
values holds the rows filled in, in their order, and change fires with them. It goes in a jl-field, which gives it
its label, hint and error. For short words people pick or type, such as keywords, a jl-tag-input is lighter.`,
  events: [{ description: 'A value was typed, picked, added or removed.', detail: 'string[]', name: 'change' }],
  examples: [
    {
      description: 'Titles in several languages: one row each, more added as needed.',
      html: `
        <jl-field class="narrow" label="Titles" hint="One title per row.">
          <jl-input-list label="Title" values='["Letters to the council","Lettres au conseil"]'></jl-input-list>
        </jl-field>`,
      title: 'Typed values',
    },
    {
      description: 'Each value picked from a list, at most three.',
      html: `
        <jl-field class="narrow" label="Languages">
          <jl-input-list label="Language" max="3" values='["fr"]'
            options='[{"value":"de","label":"German"},{"value":"en","label":"English"},{"value":"fr","label":"French"},{"value":"it","label":"Italian"}]'></jl-input-list>
        </jl-field>`,
      title: 'Picked values',
    },
    {
      description: 'Long values on several lines; dates in date inputs; and locked, as a form shown read only.',
      html: `
        <div class="stack narrow">
          <jl-field label="Descriptions">
            <jl-input-list label="Description" multiline values='["The minutes of the town council, bound by year."]'></jl-input-list>
          </jl-field>
          <jl-field label="Dates">
            <jl-input-list label="Date" type="date" values='["1952-03-14","1957-12-02"]' disabled></jl-input-list>
          </jl-field>
        </div>`,
      title: 'Kinds of rows',
    },
    {
      description: 'Texts of another language.',
      html: `
        <jl-field class="narrow" label="Titres">
          <jl-input-list label="Titre" add-label="Ajouter une valeur" remove-label="Retirer cette valeur"></jl-input-list>
        </jl-field>`,
      title: 'Other words',
    },
  ],
  level: 'molecule',
  name: 'Input list',
  playground: { attributes: { label: 'Title', values: '["First","Second"]' } },
  props: [
    {
      attribute: 'values',
      control: { kind: 'json' },
      default: '[]',
      description: 'The values filled in, in their order; rows left empty are not among them.',
      name: 'values',
      type: 'string[]',
    },
    {
      attribute: 'type',
      control: { kind: 'select', options: ['text', 'number', 'date', 'url', 'email'] },
      default: "'text'",
      description: 'The input of each row, as a jl-input takes it.',
      name: 'type',
      type: 'InputType',
    },
    {
      attribute: 'multiline',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Each value on several lines, in a text area that grows with it.',
      name: 'multiline',
      type: 'boolean',
    },
    {
      attribute: 'options',
      control: { kind: 'json' },
      default: '[]',
      description: 'The values to pick from: each row is a select. None lets people type.',
      name: 'options',
      type: 'SelectOption[]',
    },
    {
      attribute: 'max',
      control: { kind: 'number', min: 0 },
      default: '0',
      description: 'How many values it takes at most; 0 takes any number.',
      name: 'max',
      type: 'number',
    },
    {
      attribute: 'placeholder',
      control: { kind: 'text' },
      default: "''",
      description: 'What an empty row shows.',
      name: 'placeholder',
      type: 'string',
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: "The name of each row for screen readers: the field's label.",
      name: 'label',
      type: 'string',
    },
    {
      attribute: 'disabled',
      control: { kind: 'boolean' },
      default: 'false',
      description: 'Locked: the values show, nothing can be added or removed.',
      name: 'disabled',
      type: 'boolean',
    },
    {
      attribute: 'add-label',
      control: { kind: 'text' },
      default: "''",
      description: "The add button's text. Empty: jlib's own text, in the language shown.",
      name: 'addLabel',
      type: 'string',
    },
    {
      attribute: 'remove-label',
      control: { kind: 'text' },
      default: "''",
      description:
        "What a screen reader says for each row's remove button. Empty: jlib's own text, in the language shown.",
      name: 'removeLabel',
      type: 'string',
    },
  ],
  styling: [{ description: 'The rows and the add button.', name: 'base' }],
  summary: 'A field with several values, each in its own row, added and removed.',
  tag: 'jl-input-list',
};
