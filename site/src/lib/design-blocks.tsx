import { JlIcon } from '@syware/jlib';

type Guidance = 'do' | 'dont';

const GUIDANCE: Record<Guidance, { icon: string; label: string }> = {
  do: { icon: 'circle-check', label: 'Do' },
  dont: { icon: 'circle-x', label: "Don't" },
};

/** The header of a guide page: the section it belongs to, its title and its lead. */
export const sectionIntro = (section: string, title: string, lead: string): Node => (
  <header class="intro">
    <p class="label">{section}</p>
    <h1>{title}</h1>
    <p class="lead">{lead}</p>
  </header>
);

/** The header of a design system page. */
export const designIntro = (title: string, lead: string): Node => sectionIntro('Design system', title, lead);

/** A guideline: a live preview of what to do, or not, over the sentence that says why (none when it says itself). */
export function guideline(kind: Guidance, preview: string, text: string | readonly (Node | string)[] = ''): Node {
  const area = <div class="rule-preview" />;
  area.innerHTML = preview;
  return (
    <div class={`rule ${kind}`}>
      <p class="rule-head">
        <JlIcon name={GUIDANCE[kind].icon} size={15} />
        {GUIDANCE[kind].label}
      </p>
      {area}
      {text.length === 0 ? null : <p class="rule-text">{text}</p>}
    </div>
  );
}
