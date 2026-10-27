import { css } from '@jadis/core';
import { Plus, X } from 'lucide';

import { JlButton } from '../atoms/jl-button';
import { INPUT_TYPES, JlInput } from '../atoms/jl-input';
import { JlSelect } from '../atoms/jl-select';
import { JlTextarea } from '../atoms/jl-textarea';
import { JlElement } from '../base/jl-element';
import { clampedNumber, jsonOf, oneOf } from '../lib/attributes';
import { registerIcons } from '../lib/icons';
import { canAddRow, filledValues, rowsOf, sameValues, withoutRowAt, withRowAt } from '../lib/input-list';
import { jlText } from '../lib/texts';
import { BASE_STYLES } from '../styles/shared';
import styles from './jl-input-list.css?raw';

import type { InputType } from '../types/jl-input.types';
import type { SelectOption } from '../types/jl-select.types';

registerIcons({ plus: Plus, x: X });

const NO_LIMIT = 0;
const MAX_LIMIT = 1000;

/**
 * A field with several values, each in its own row: typed in an input (or a text area when `multiline`), or picked
 * from `options`. People add a row and remove one; `max` caps how many. `values` holds those filled in, in their
 * order, and `change` fires with them. Put it in a `jl-field` for its label, hint and error.
 */
export class JlInputList extends JlElement {
  static readonly selector = 'jl-input-list';

  readonly events = this.useEvents<{ change: string[] }>();

  /** The values filled in, in their order; rows left empty are not among them. */
  readonly values = this.useChange<string[]>([], (values) => this.follow(values), {
    attribute: 'values',
    parse: jsonOf<string[]>([]),
  });
  /** The input of each row: text, a number, a date, a link… */
  readonly type = this.useChange<InputType>('text', () => this.renderRows(), {
    attribute: 'type',
    parse: oneOf(INPUT_TYPES, 'text'),
  });
  /** Each value on several lines, in a text area. */
  readonly multiline = this.useChange(false, () => this.renderRows(), { attribute: 'multiline' });
  /** The values to pick from, each row a select; none lets people type. */
  readonly options = this.useChange<SelectOption[]>([], () => this.renderRows(), {
    attribute: 'options',
    parse: jsonOf<SelectOption[]>([]),
  });
  /** How many values it takes at most; 0 takes any number. */
  readonly max = this.useChange(NO_LIMIT, () => this.renderAdd(), {
    attribute: 'max',
    parse: clampedNumber(NO_LIMIT, NO_LIMIT, MAX_LIMIT),
  });
  readonly placeholder = this.useChange('', () => this.renderRows(), { attribute: 'placeholder' });
  /** The name of each row for screen readers: the field's label. */
  readonly label = this.useChange('', () => this.renderRows(), { attribute: 'label' });
  readonly disabled = this.useChange(false, (value) => this.renderDisabled(value), { attribute: 'disabled' });
  /** The add button's text. */
  readonly addLabel = this.useChange(jlText('addValue'), () => this.renderAdd(), { attribute: 'add-label' });
  /** The text a screen reader says for each row's remove button. */
  readonly removeLabel = this.useChange(jlText('removeValue'), () => this.renderRows(), {
    attribute: 'remove-label',
  });

  // The rows shown, those left empty included: `values` keeps the filled ones.
  private readonly _state = { rows: [''] };

  private readonly _refs = this.useRefs((ref) => ({ add: ref<JlButton>('.add'), rows: ref('.rows') }));

  templateHtml(): Node {
    return (
      <div class="list" attrs={{ part: 'base' }}>
        <div class="rows" />
        <div>
          <JlButton class="add" variant="ghost" size="sm" icon="plus" />
        </div>
      </div>
    );
  }

  templateCss(): string {
    return css`${BASE_STYLES}${styles}`;
  }

  onConnect(): void {
    this._refs.add.events.register('press', () => this.addRow());
  }

  /** Values set from outside start the rows again; those the rows themselves gave change nothing. */
  private follow(values: string[]): void {
    if (sameValues(values, filledValues(this._state.rows))) {
      return;
    }
    this._state.rows = rowsOf(values);
    this.renderRows();
  }

  private renderRows(): void {
    this._refs.rows.replaceChildren(...this._state.rows.map((value, index) => this.row(value, index)));
    this.renderAdd();
  }

  private renderAdd(): void {
    const add = this._refs.add;
    add.label.set(this.addLabel.get());
    add.hidden = this.disabled.get() || !canAddRow(this._state.rows.length, this.max.get());
  }

  private renderDisabled(disabled: boolean): void {
    this.reflect('disabled', disabled);
    this.renderRows();
  }

  private row(value: string, index: number): Node {
    const control = this.control(value, (text) => this.change(index, text));
    const remove = (
      <JlButton class="remove" variant="ghost" size="sm" icon="x" hint={this.removeLabel.get()} />
    ) as JlButton;
    remove.events.register('press', () => this.removeRow(index));
    remove.hidden = this.disabled.get() || this._state.rows.length === 1;
    return (
      <div class="row">
        {control}
        {remove}
      </div>
    );
  }

  /** The control of a row: a select among the options, a text area, or an input of the type; `onInput` hears it. */
  private control(value: string, onInput: (text: string) => void): Node {
    const label = this.label.get();
    const disabled = this.disabled.get();
    const options = this.options.get();
    if (options.length > 0) {
      const select = (<JlSelect label={label} options={options} disabled={disabled} />) as JlSelect;
      select.value.set(value);
      select.events.register('change', onInput);
      return select;
    }
    if (this.multiline.get()) {
      const area = (
        <JlTextarea
          label={label}
          value={value}
          placeholder={this.placeholder.get()}
          disabled={disabled}
          autosize
        />
      ) as JlTextarea;
      area.events.register('input', onInput);
      return area;
    }
    const input = (
      <JlInput
        label={label}
        value={value}
        type={this.type.get()}
        placeholder={this.placeholder.get()}
        disabled={disabled}
      />
    ) as JlInput;
    input.events.register('input', onInput);
    return input;
  }

  private change(index: number, text: string): void {
    this._state.rows = withRowAt(this._state.rows, index, text);
    this.publish();
  }

  private addRow(): void {
    if (!canAddRow(this._state.rows.length, this.max.get())) {
      return;
    }
    this._state.rows = [...this._state.rows, ''];
    this.renderRows();
    const added = this._refs.rows.lastElementChild?.firstElementChild;
    if (added instanceof HTMLElement) {
      added.focus();
    }
  }

  private removeRow(index: number): void {
    this._state.rows = withoutRowAt(this._state.rows, index);
    this.renderRows();
    this.publish();
  }

  private publish(): void {
    const values = filledValues(this._state.rows);
    this.values.set(values);
    this.events.emit('change', values);
  }
}

JlInputList.register();
