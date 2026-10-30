import type { JlSelect } from '@syware/jlib';

type Currency = 'chf' | 'eur';

declare function setCurrency(currency: Currency): void; // (not shown)

const currency = document.querySelector<JlSelect<Currency>>('jl-select.currency');
currency?.options.set([
  { label: 'Swiss franc', value: 'chf' },
  { label: 'Euro', value: 'eur' },
]);
// @ts-expect-error: 'usd' is not a currency of the list
currency?.options.set([{ label: 'US dollar', value: 'usd' }]);
currency?.events.register('change', (value) => setCurrency(value)); // value: Currency
