// @vitest-environment jsdom
// jl-combobox as an app's tests meet it, in jsdom: options the page finds, and while they load.
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { JlCombobox } from '../src/molecules/jl-combobox';
import {
  CITIES,
  FOUND,
  isOpen,
  isShown,
  nativeOf,
  press,
  pressOption,
  rootOf,
  shownLabels,
  statusOf,
  type,
} from './support/combobox';
import { fillBrowserGaps, settle } from './support/jsdom';

const DEBOUNCE_MS = 30;

async function mountCombobox(setup: (combobox: JlCombobox) => void): Promise<JlCombobox> {
  const combobox = new JlCombobox();
  combobox.label.set('City');
  setup(combobox);
  document.body.append(combobox);
  await settle();
  return combobox;
}

describe('jl-combobox, options the page finds', () => {
  beforeAll(fillBrowserGaps);

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('shows every option given, whatever was typed, the typed text staying while they load', async () => {
    const combobox = await mountCombobox((created) => created.filter.set('none'));
    const heard: string[] = [];
    combobox.events.register('input', (text) => heard.push(text));

    await type(combobox, 'zur');
    combobox.loading.set(true);
    await settle();
    expect(nativeOf(combobox).value).toBe('zur');

    combobox.options.set(FOUND);
    combobox.loading.set(false);
    await settle();
    expect(heard).toEqual(['zur']);
    expect(shownLabels(combobox)).toEqual(['Zürich', 'Bern']);
    expect(nativeOf(combobox).value).toBe('zur');
    expect(isOpen(combobox)).toBe(true);
  });

  it('highlights each word typed in the options the page found', async () => {
    const combobox = await mountCombobox((created) => created.filter.set('none'));
    await type(combobox, 'arch com');
    combobox.options.set([
      { label: 'Archives communales de Briningen', value: '1' },
      { label: 'Commune de Laudorf, archives', value: '2' },
    ]);
    await settle();
    const marks = [...rootOf(combobox).querySelectorAll('[role="option"]')].map((option) =>
      [...option.querySelectorAll('mark')].map((mark) => mark.textContent)
    );
    expect(marks).toEqual([
      ['Arch', 'com'],
      ['Com', 'arch'],
    ]);
  });

  it('narrows the options itself in local mode, the default', async () => {
    const combobox = await mountCombobox((created) => created.options.set(CITIES));
    await type(combobox, 'bi');
    expect(combobox.filter.get()).toBe('local');
    expect(shownLabels(combobox)).toEqual(['Biel/Bienne']);
  });

  it('says it is loading in the open list, busy, and says so to screen readers', async () => {
    const combobox = await mountCombobox((created) => created.filter.set('none'));
    await type(combobox, 'zur');
    combobox.loading.set(true);
    await settle();

    expect(isOpen(combobox)).toBe(true);
    expect(isShown(combobox, '.loading')).toBe(true);
    expect(isShown(combobox, '.empty')).toBe(false);
    expect(rootOf(combobox).querySelector('.listbox')?.getAttribute('aria-busy')).toBe('true');
    expect(rootOf(combobox).querySelector('.loading-text')?.textContent).toBe('Loading');
    expect(statusOf(combobox)).toBe('Loading');
  });

  it('shows the empty text when the answer is empty, and says how many options came', async () => {
    const combobox = await mountCombobox((created) => {
      created.filter.set('none');
      created.emptyText.set('No city of that name');
    });
    await type(combobox, 'zzz');
    combobox.loading.set(true);
    await settle();
    combobox.options.set([]);
    combobox.loading.set(false);
    await settle();
    expect(isShown(combobox, '.loading')).toBe(false);
    expect(isShown(combobox, '.empty')).toBe(true);
    expect(rootOf(combobox).querySelector('.listbox')?.hasAttribute('aria-busy')).toBe(false);
    expect(statusOf(combobox)).toBe('No city of that name');

    combobox.options.set(FOUND);
    await settle();
    expect(statusOf(combobox)).toBe('2 results');
    combobox.options.set(FOUND.slice(0, 1));
    await settle();
    expect(statusOf(combobox)).toBe('1 result');
  });

  it('tells what was typed once the typing pauses, the last text alone', async () => {
    const combobox = await mountCombobox((created) => {
      created.filter.set('none');
      created.debounce.set(DEBOUNCE_MS);
    });
    const heard: string[] = [];
    combobox.events.register('input', (text) => heard.push(text));

    await type(combobox, 'z');
    await type(combobox, 'zu');
    await type(combobox, 'zur');
    expect(heard).toEqual([]);
    await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS * 2));
    expect(heard).toEqual(['zur']);
  });

  it('tells nothing of a text a choice came before the pause of', async () => {
    const combobox = await mountCombobox((created) => {
      created.options.set(CITIES);
      created.debounce.set(DEBOUNCE_MS);
    });
    const heard: string[] = [];
    combobox.events.register('input', (text) => heard.push(text));

    await type(combobox, 'ber');
    await press(combobox, 'Enter');
    await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS * 2));
    expect(combobox.value.get()).toBe('be');
    expect(heard).toEqual([]);
  });

  it('shows the last options the page set', async () => {
    const combobox = await mountCombobox((created) => created.filter.set('none'));
    await type(combobox, 'b');
    combobox.options.set(CITIES);
    await type(combobox, 'be');
    combobox.options.set(CITIES.slice(0, 1));
    await settle();
    expect(shownLabels(combobox)).toEqual(['Bern']);
  });

  it("keeps a chosen option's label when the page gives other options", async () => {
    const combobox = await mountCombobox((created) => {
      created.filter.set('none');
      created.options.set(CITIES);
    });
    await type(combobox, 'ber');
    await pressOption(combobox, 'Bern');
    expect(combobox.value.get()).toBe('be');

    combobox.options.set([{ label: 'Genève', value: 'ge' }]);
    await settle();
    expect(nativeOf(combobox).value).toBe('Bern');
  });
});
