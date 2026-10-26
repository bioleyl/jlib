import { describe, expect, it } from 'vitest';

import { starredParts } from '../src/lib/text';

describe('starredParts', () => {
  it('accents the words between asterisks', () => {
    expect(starredParts('Workflows that *ask* before they act.')).toEqual([
      { accent: false, text: 'Workflows that ' },
      { accent: true, text: 'ask' },
      { accent: false, text: ' before they act.' },
    ]);
  });

  it('accents a run at the end, and leaves out empty runs', () => {
    expect(starredParts('Order like a shop. *Pick with your phone.*')).toEqual([
      { accent: false, text: 'Order like a shop. ' },
      { accent: true, text: 'Pick with your phone.' },
    ]);
  });

  it('keeps plain text, and a lone asterisk, as they are', () => {
    expect(starredParts('Plain words.')).toEqual([{ accent: false, text: 'Plain words.' }]);
    expect(starredParts('Five * three')).toEqual([{ accent: false, text: 'Five * three' }]);
    expect(starredParts('Pick *fast* or * not')).toEqual([
      { accent: false, text: 'Pick ' },
      { accent: true, text: 'fast' },
      { accent: false, text: ' or * not' },
    ]);
    expect(starredParts('')).toEqual([]);
  });
});
