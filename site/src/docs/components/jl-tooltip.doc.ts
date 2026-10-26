import type { ComponentDoc } from '../../types/docs.types';

export const doc: ComponentDoc = {
  className: 'JlTooltip',
  description: `Wrap the element that needs a hint: the tooltip shows after delay when the pointer rests on it or
when the keyboard focuses it, and hides when the pointer leaves, the focus moves on, or Escape is pressed. The pointer
can move onto the bubble without it closing.

The bubble floats in the top layer, so no overflow or stacking context cuts it. It goes on the placement side and
flips when there is no room; its arrow points at the trigger. The trigger gets the text as its accessible description:
a tooltip adds to a name, it never replaces it, so an icon-only button still needs its own (a jl-button's hint).
While the pointer or the focus is on the trigger, its own title (that hint) steps aside, so the browser's tooltip does
not show over the bubble.

Touch screens have no hover. There, pressing and holding the trigger shows the bubble, and the press does not act;
the bubble stays a moment after the finger lifts. A trigger that does nothing on a tap (a word, an icon) shows or
hides its bubble on a tap. A tap elsewhere puts it away.`,
  examples: [
    {
      html: `
        <div class="row">
          <jl-tooltip text="Copy the link to this page">
            <jl-button icon="link" label="Share"></jl-button>
          </jl-tooltip>
          <jl-tooltip text="Rerun the failed jobs only">
            <jl-button variant="primary" icon="refresh" label="Rerun"></jl-button>
          </jl-tooltip>
        </div>`,
      title: 'On buttons',
    },
    {
      description: 'The bubble flips to the other side when the asked side has no room.',
      html: `
        <div class="row">
          <jl-tooltip text="On top" placement="top"><jl-button label="Top"></jl-button></jl-tooltip>
          <jl-tooltip text="Underneath" placement="bottom"><jl-button label="Bottom"></jl-button></jl-tooltip>
          <jl-tooltip text="On the left" placement="left"><jl-button label="Left"></jl-button></jl-tooltip>
          <jl-tooltip text="On the right" placement="right"><jl-button label="Right"></jl-button></jl-tooltip>
          <jl-tooltip text="Aligned with the start edge" placement="bottom-start"><jl-button label="Bottom start"></jl-button></jl-tooltip>
        </div>`,
      title: 'Placements',
    },
    {
      description:
        'Icon buttons in a toolbar: the hint names them, the tooltip shows it. delay="0" shows at once.',
      html: `
        <div class="row">
          <jl-tooltip text="Bold (⌘B)" delay="0"><jl-button variant="ghost" icon="pencil" hint="Bold"></jl-button></jl-tooltip>
          <jl-tooltip text="Insert a link (⌘K)" delay="0"><jl-button variant="ghost" icon="link" hint="Insert a link"></jl-button></jl-tooltip>
          <jl-tooltip text="Add an image" delay="0"><jl-button variant="ghost" icon="image" hint="Add an image"></jl-button></jl-tooltip>
        </div>`,
      title: 'A toolbar',
    },
    {
      description:
        'Any element can be the trigger; text that is not focusable gets tabindex to reach it by keyboard.',
      html: `
        <p>
          Billed every month on the
          <jl-tooltip text="The day you subscribed, or the last day of shorter months">
            <span tabindex="0" style="text-decoration: underline dotted; text-underline-offset: 3px">anniversary date</span>
          </jl-tooltip>.
        </p>`,
      title: 'On a word',
    },
  ],
  level: 'molecule',
  methods: [
    { description: 'Shows the bubble now, without the delay.', name: 'show', signature: 'show(): void' },
    { description: 'Hides the bubble now.', name: 'hide', signature: 'hide(): void' },
  ],
  name: 'Tooltip',
  playground: {
    attributes: { placement: 'top', text: 'Saved to your drafts' },
    content: '<jl-button icon="bookmark" label="Save draft"></jl-button>',
    height: 240,
  },
  props: [
    {
      attribute: 'text',
      control: { kind: 'text' },
      default: "''",
      description: 'The hint; nothing shows while it is empty.',
      name: 'text',
      type: 'string',
    },
    {
      attribute: 'placement',
      control: {
        kind: 'select',
        options: ['top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end', 'left', 'right'],
      },
      default: "'top'",
      description: 'The side of the trigger the bubble goes on, and where along it.',
      name: 'placement',
      type: 'Placement',
    },
    {
      attribute: 'delay',
      control: { kind: 'number', max: 2000, min: 0, step: 100 },
      default: '300',
      description:
        'How long the pointer or the focus rests on the trigger before the bubble shows, in milliseconds.',
      name: 'delay',
      type: 'number',
    },
  ],
  slots: [{ description: 'The trigger: the element the hint is about.', name: '' }],
  styling: [{ description: 'The bubble.', name: 'base' }],
  summary:
    'A short hint in a dark bubble, shown when the pointer rests on its trigger or the keyboard reaches it.',
  tag: 'jl-tooltip',
};
