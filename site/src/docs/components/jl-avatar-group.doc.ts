import type { ComponentDoc } from '../../types/docs.types';

const TEAM = JSON.stringify([
  { name: 'Ada Lovelace' },
  { name: 'Grace Hopper' },
  { name: 'Alan Turing' },
  { name: 'Margaret Hamilton' },
  { name: 'Linus Torvalds' },
  { name: 'Radia Perlman' },
  { name: 'Ken Thompson' },
]);

const PAIR = JSON.stringify([{ name: 'Barbara Liskov' }, { name: 'jlib', src: 'favicon.svg' }]);

export const doc: ComponentDoc = {
  className: 'JlAvatarGroup',
  description: `An avatar group shows who is in something (a project, a document, a call) in little room. The avatars
overlap, each ringed with the surface colour so they stay apart.

With max, the group shows that many avatars and a last one that counts the others; its tooltip names them, and screen
readers hear them. Set --ring-color when the group sits on another background than the surface.`,
  examples: [
    {
      description: 'Seven people, four shown: the last avatar counts the three others.',
      html: `<jl-avatar-group max="4" items='${TEAM}'></jl-avatar-group>`,
      title: 'With a max',
    },
    {
      html: `
        <div class="stack">
          <jl-avatar-group size="sm" max="5" items='${TEAM}'></jl-avatar-group>
          <jl-avatar-group size="md" max="5" items='${TEAM}'></jl-avatar-group>
          <jl-avatar-group size="lg" max="5" items='${TEAM}'></jl-avatar-group>
          <jl-avatar-group size="xl" max="3" items='${TEAM}'></jl-avatar-group>
        </div>`,
      title: 'Sizes',
    },
    {
      description: 'Pictures and initials mix; without max, everyone shows.',
      html: `<jl-avatar-group size="lg" items='${PAIR}'></jl-avatar-group>`,
      title: 'Pictures',
    },
    {
      description: 'Who works on a project, next to what they did.',
      html: `
        <div class="row">
          <jl-avatar-group size="sm" max="3" items='${TEAM}'></jl-avatar-group>
          <span class="muted">Ada, Grace and 5 others edited this page today</span>
        </div>`,
      title: 'Beside a sentence',
    },
  ],
  level: 'molecule',
  name: 'Avatar group',
  playground: { attributes: { items: TEAM, max: '4', size: 'lg' } },
  props: [
    {
      attribute: 'items',
      control: { kind: 'json' },
      default: '[]',
      description: 'The people, in order: [{ "name": "Ada Lovelace", "src": "/ada.jpg" }].',
      name: 'items',
      type: 'AvatarItem[]',
    },
    {
      attribute: 'max',
      control: { kind: 'number', min: 0 },
      default: '0',
      description: 'How many avatars show before the count; 0 shows them all.',
      name: 'max',
      type: 'number',
    },
    {
      attribute: 'size',
      control: { kind: 'select', options: ['sm', 'md', 'lg', 'xl'] },
      default: "'md'",
      description: 'The size of every avatar: 24, 32, 40 or 56 pixels.',
      name: 'size',
      type: "'sm' | 'md' | 'lg' | 'xl'",
    },
  ],
  styling: [
    { description: 'The row of avatars.', name: 'base' },
    { description: 'How far each avatar slides under the one before.', name: '--overlap' },
    { description: 'The ring between avatars: the background the group sits on.', name: '--ring-color' },
  ],
  summary: 'A few people at a glance: overlapping avatars, and a count for the others.',
  tag: 'jl-avatar-group',
};
