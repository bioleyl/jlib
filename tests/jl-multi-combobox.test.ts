// @vitest-environment jsdom
// jl-multi-combobox as an app's tests meet it, in jsdom: several values as chips, from the list or the keyboard.
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { JlMultiCombobox } from '../src/molecules/jl-multi-combobox';
import { CITIES, chipsOf, isOpen, nativeOf, press, pressOption, rootOf, statusOf, type } from './support/combobox';
import { fillBrowserGaps, settle } from './support/jsdom';

async function mountSeveral(
  setup: (combobox: JlMultiCombobox) => void = () => undefined
): Promise<JlMultiCombobox> {
  const combobox = new JlMultiCombobox();
  combobox.label.set('Cities');
  combobox.options.set(CITIES);
  setup(combobox);
  document.body.append(combobox);
  await settle();
  return combobox;
}

describe('jl-multi-combobox', () => {
  beforeAll(fillBrowserGaps);

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('adds a chip for each option chosen, and keeps the list open for the next one', async () => {
    const combobox = await mountSeveral();
    const heard: string[][] = [];
    combobox.events.register('change', (values) => heard.push(values));

    await type(combobox, 'b');
    await pressOption(combobox, 'Bern');
    expect(isOpen(combobox)).toBe(true);
    expect(nativeOf(combobox).value).toBe('');
    await pressOption(combobox, 'Zürich');

    expect(combobox.value.get()).toEqual(['be', 'zh']);
    expect(chipsOf(combobox).map((chip) => chip.label.get())).toEqual(['Bern', 'Zürich']);
    expect(heard).toEqual([['be'], ['be', 'zh']]);
    expect(statusOf(combobox)).toBe('Added Zürich');
    expect(rootOf(combobox).querySelector('.listbox')?.getAttribute('aria-multiselectable')).toBe('true');
  });

  it('takes out an option held when it is chosen again', async () => {
    const combobox = await mountSeveral((created) => created.value.set(['be', 'zh']));
    await press(combobox, 'ArrowDown');
    await pressOption(combobox, 'Bern');
    expect(combobox.value.get()).toEqual(['zh']);
    expect(chipsOf(combobox).map((chip) => chip.label.get())).toEqual(['Zürich']);
  });

  it('says which options are held with aria-selected, the active one by its id', async () => {
    const combobox = await mountSeveral((created) => created.value.set(['zh']));
    await press(combobox, 'ArrowDown');
    const selected = [...rootOf(combobox).querySelectorAll('.option')].map((item) =>
      item.getAttribute('aria-selected')
    );
    expect(selected).toEqual(['false', 'false', 'true']);
  });

  it('removes the last chip on Backspace in an empty field, and a chip by its ×', async () => {
    const combobox = await mountSeveral((created) => created.value.set(['be', 'bi', 'zh']));
    nativeOf(combobox).focus();

    await press(combobox, 'Backspace');
    expect(combobox.value.get()).toEqual(['be', 'bi']);
    expect(statusOf(combobox)).toBe('Removed Zürich');

    chipsOf(combobox)[0]?.shadowRoot?.querySelector<HTMLButtonElement>('.dismiss')?.click();
    await settle();
    expect(combobox.value.get()).toEqual(['bi']);
    expect(chipsOf(combobox).map((chip) => chip.label.get())).toEqual(['Biel/Bienne']);
  });

  it('leaves the chips alone on Backspace while the field holds text', async () => {
    const combobox = await mountSeveral((created) => created.value.set(['be']));
    await type(combobox, 'zu');
    await press(combobox, 'Backspace');
    expect(combobox.value.get()).toEqual(['be']);
  });

  it('works from the keyboard: arrows and Enter add, Escape closes', async () => {
    const combobox = await mountSeveral();
    await type(combobox, 'zü');
    await press(combobox, 'Enter');
    expect(combobox.value.get()).toEqual(['zh']);
    expect(isOpen(combobox)).toBe(true);
    await press(combobox, 'ArrowDown');
    await press(combobox, 'Enter');
    expect(combobox.value.get()).toEqual(['zh', 'be']);
    await press(combobox, 'Escape');
    expect(isOpen(combobox)).toBe(false);
  });

  it('reads its value from the attribute, a JSON list or one value', async () => {
    const listed = await mountSeveral((created) => created.setAttribute('value', '["be","zh"]'));
    expect(listed.value.get()).toEqual(['be', 'zh']);
    const single = await mountSeveral((created) => created.setAttribute('value', 'zh'));
    expect(single.value.get()).toEqual(['zh']);
  });

  it('works as the page finds the options, as jl-combobox does', async () => {
    const combobox = await mountSeveral((created) => {
      created.filter.set('none');
      created.options.set([]);
    });
    await type(combobox, 'zur');
    combobox.loading.set(true);
    await settle();
    expect(isOpen(combobox)).toBe(true);
    expect(statusOf(combobox)).toBe('Loading');
    combobox.options.set([
      { label: 'Zürich', value: 'zh' },
      { label: 'Bern', value: 'be' },
    ]);
    combobox.loading.set(false);
    await settle();
    expect(nativeOf(combobox).value).toBe('zur');
    expect(statusOf(combobox)).toBe('2 results');
  });

  it('holds a list from the start, and takes no multiple', async () => {
    const combobox = await mountSeveral();
    expect(combobox.value.get()).toEqual([]);
    expect('multiple' in combobox).toBe(false);
  });

  it('keeps its chips without their × while disabled, and gives them back', async () => {
    const combobox = await mountSeveral((created) => {
      created.value.set(['be', 'zh']);
      created.disabled.set(true);
    });
    expect(chipsOf(combobox).map((chip) => chip.removable.get())).toEqual([false, false]);
    combobox.disabled.set(false);
    expect(chipsOf(combobox).map((chip) => chip.removable.get())).toEqual([true, true]);
  });

  it("keeps a chip's label when the page gives other options", async () => {
    const combobox = await mountSeveral((created) => created.filter.set('none'));
    await type(combobox, 'ber');
    await pressOption(combobox, 'Bern');
    combobox.options.set([{ label: 'Genève', value: 'ge' }]);
    await settle();
    expect(chipsOf(combobox).map((chip) => chip.label.get())).toEqual(['Bern']);
  });
});
