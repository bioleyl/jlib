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

  templateHtml(): Node {
    // value="usd" does not compile. Without <Currency>, the type is read from the options.
    return (
      <JlSelect<Currency>
        label="Currency"
        options={CURRENCIES}
        value="chf"
        onChange={(value) => setCurrency(value)}
      />
    );
  }
}

InvoiceForm.register();
