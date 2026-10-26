import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlAvatar',
  description: `An avatar shows a picture when it has one, and the person's initials otherwise: while the picture
loads, and when it cannot. The background colour comes from the name, so the same person has the same colour on
every page.

Screen readers say the name (or the label) and the status. An avatar with neither is decoration and is skipped.
Slotted content, such as an icon or a count, replaces the initials.`,
  examples: [
    {
      description: '24, 32, 40 and 56 pixels.',
      html: `
        <div class="row">
          <jl-avatar size="sm" name="Ada Lovelace"></jl-avatar>
          <jl-avatar name="Grace Hopper"></jl-avatar>
          <jl-avatar size="lg" name="Alan Turing"></jl-avatar>
          <jl-avatar size="xl" name="Margaret Hamilton"></jl-avatar>
        </div>`,
      title: 'Sizes',
    },
    {
      description: 'Each name always picks the same soft colour. Without a name, a neutral person icon.',
      html: `
        <div class="row">
          <jl-avatar name="Ada Lovelace"></jl-avatar>
          <jl-avatar name="Linus Torvalds"></jl-avatar>
          <jl-avatar name="Radia Perlman"></jl-avatar>
          <jl-avatar name="Ken Thompson"></jl-avatar>
          <jl-avatar name="Barbara Liskov"></jl-avatar>
          <jl-avatar name="Dennis Ritchie"></jl-avatar>
          <jl-avatar></jl-avatar>
        </div>`,
      title: 'Initials and colours',
    },
    {
      description: 'A picture shows once loaded; a picture that cannot load leaves the initials.',
      html: `
        <div class="row">
          <jl-avatar size="lg" shape="square" name="jlib" src="favicon.svg"></jl-avatar>
          <jl-avatar size="lg" name="Frances Allen" src="missing-picture.jpg"></jl-avatar>
          <jl-avatar size="lg" shape="square" name="Design team"></jl-avatar>
        </div>`,
      title: 'Pictures and shapes',
    },
    {
      description: 'A dot ringed with the surface colour; screen readers hear it after the name.',
      html: `
        <div class="row">
          <jl-avatar size="lg" name="Ada Lovelace" status="online"></jl-avatar>
          <jl-avatar size="lg" name="Grace Hopper" status="busy"></jl-avatar>
          <jl-avatar size="lg" name="Alan Turing" status="away"></jl-avatar>
          <jl-avatar size="lg" name="Margaret Hamilton" status="offline"></jl-avatar>
          <jl-avatar size="lg" shape="square" name="Build bot" status="online"></jl-avatar>
        </div>`,
      title: 'Status',
    },
    {
      description: 'An avatar next to a name and a role, as in a comment or a member list.',
      html: `
        <div class="row">
          <jl-avatar size="lg" name="Radia Perlman" status="online"></jl-avatar>
          <div>
            <strong>Radia Perlman</strong>
            <div class="muted">Network architect · replied 5 min ago</div>
          </div>
        </div>`,
      title: 'With a name',
    },
  ],
  level: 'atom',
  name: 'Avatar',
  playground: { attributes: { name: 'Ada Lovelace', size: 'xl', status: 'online' } },
  props: [
    {
      attribute: 'name',
      control: { kind: 'text' },
      default: "''",
      description: 'The name: the initials, the background colour and what screen readers say.',
      name: 'name',
      type: 'string',
    },
    {
      attribute: 'src',
      control: { kind: 'text' },
      default: "''",
      description: 'A picture; the initials show while it loads and when it fails.',
      name: 'src',
      type: 'string',
    },
    {
      attribute: 'size',
      control: { kind: 'select', options: ['sm', 'md', 'lg', 'xl'] },
      default: "'md'",
      description: '24, 32, 40 or 56 pixels.',
      name: 'size',
      type: "'sm' | 'md' | 'lg' | 'xl'",
    },
    {
      attribute: 'shape',
      control: { kind: 'select', options: ['circle', 'square'] },
      default: "'circle'",
      description: 'A circle for people, a rounded square for teams, projects and bots.',
      name: 'shape',
      type: "'circle' | 'square'",
    },
    {
      attribute: 'status',
      control: { kind: 'select', options: ['', 'online', 'busy', 'away', 'offline'] },
      default: "''",
      description: 'A presence dot at the corner.',
      name: 'status',
      type: "'' | 'online' | 'busy' | 'away' | 'offline'",
    },
    {
      attribute: 'label',
      control: { kind: 'text' },
      default: "''",
      description: 'What screen readers say instead of the name.',
      name: 'label',
      type: 'string',
    },
  ],
  slots: [{ description: 'Content in place of the initials: an icon, a count.', name: '' }],
  styling: [
    { description: 'The avatar: the face and the status dot.', name: 'base' },
    { description: 'The width and height; any length, beyond the four sizes.', name: '--size' },
    {
      description: 'The colour of the ring around the face and the dot (the surface by default).',
      name: '--ring-color',
    },
    { description: 'The width of a ring around the face: avatar groups set it.', name: '--ring' },
  ],
  summary: 'A person, a team or a bot: a picture, or initials on a colour their name picks.',
  tag: 'jl-avatar',
};
