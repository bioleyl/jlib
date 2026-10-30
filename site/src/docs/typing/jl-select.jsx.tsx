import { Jadis } from '@jadis/core';
import { JlSelect } from '@syware/jlib';

import type { SelectOption } from '@syware/jlib';

type Currency = 'chf' | 'eur';

declare function setCurrency(currency: Currency): void; // (not shown)

const CURRENCIES: SelectOption<Currency>[] = [
  { label: 'Swiss franc', value: 'chf' },
  { label: 'Euro', value: 'eur' },
];

export class InvoiceForm extends Jadis {
  static readonly selector = 'invoice-form';

  private readonly _refs = this.useRefs((ref) => ({ currency: ref<JlSelect<Currency>>('.currency') }));

  templateHtml(): Node {
    // value="usd" does not compile. Without <Currency>, the type is read from the options.
    return <JlSelect<Currency> class="currency" label="Currency" options={CURRENCIES} value="chf" />;
  }

  onConnect(): void {
    this._refs.currency.events.register('change', (value) => setCurrency(value));
  }
}

InvoiceForm.register();
