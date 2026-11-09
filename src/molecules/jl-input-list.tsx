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
import styles from './jl-input-list.css?inline';

import type { InputType } from '../types/jl-input.types';
import type { SelectOption } from '../types/jl-select.types';

registerIcons({ plus: Plus, x: X });

const NO_LIMIT = 0;
const MAX_LIMIT = 1000;

/** The control of each row: a select among the options, a text area when multiline, or an input. */
type RowKind = 'select' | 'textarea' | 'input';
type RowControl = JlSelect | JlTextarea | JlInput;
/** A row drawn: its control, and the button that removes it. */
type DrawnRow = { control: RowControl; remove: JlButton };

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
  readonly type = this.useChange<InputType>('text', () => this.drawRows(), {
    attribute: 'type',
    parse: oneOf(INPUT_TYPES, 'text'),
  });
  /** Each value on several lines, in a text area. */
  readonly multiline = this.useChange(false, () => this.drawRows(), { attribute: 'multiline' });
  /** The values to pick from, each row a select; none lets people type. */
  readonly options = this.useChange<SelectOption[]>([], () => this.drawRows(), {
    attribute: 'options',
    parse: jsonOf<SelectOption[]>([]),
  });
  /** How many values it takes at most; 0 takes any number. */
  readonly max = this.useChange(NO_LIMIT, () => this.renderAdd(), {
    attribute: 'max',
    parse: clampedNumber(NO_LIMIT, NO_LIMIT, MAX_LIMIT),
  });
  readonly placeholder = this.useChange('', () => this.drawRows(), { attribute: 'placeholder' });
  /** The name of each row for screen readers: the field's label. */
  readonly label = this.useChange('', () => this.drawRows(), { attribute: 'label' });
  readonly disabled = this.useChange(false, (value) => this.renderDisabled(value), { attribute: 'disabled' });
  /** The add button's text; jlib's own when empty. */
  readonly addLabel = this.useChange('', () => this.renderAdd(), { attribute: 'add-label' });
  /** The text a screen reader says for each row's remove button; jlib's own when empty. */
  readonly removeLabel = this.useChange('', () => this.drawRows(), {
    attribute: 'remove-label',
  });

  // The rows shown, those left empty included: `values` keeps the filled ones.
  private readonly _state = { rows: [''] };
  // The rows as drawn and their kind of control: the inputs change them in place.
  private readonly _drawn: { kind: RowKind | undefined; rows: DrawnRow[] } = { kind: undefined, rows: [] };

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

  protected drawTexts(): void {
    this.drawRows();
  }

  /**
   * Draws the rows as the inputs say: in place, or built again for another kind of control. Every input's callback
   * runs as the list appears: a build in each made about ten per list.
   */
  private drawRows(): void {
    if (this._drawn.kind !== this.rowKind()) {
      this.renderRows();
      return;
    }
    for (const row of this._drawn.rows) {
      this.drawRow(row);
    }
    this.renderAdd();
  }

  /** Builds every row again, from the values in `_state`. */
  private renderRows(): void {
    this._drawn.kind = this.rowKind();
    this._drawn.rows = this._state.rows.map((value, index) => this.row(value, index));
    this._refs.rows.replaceChildren(
      ...this._drawn.rows.map(({ control, remove }) => (
        <div class="row">
          {control}
          {remove}
        </div>
      ))
    );
    this.renderAdd();
  }

  /** The add button: its text, and hidden at `max`; the CSS hides it in a disabled list. */
  private renderAdd(): void {
    const add = this._refs.add;
    add.label.set(this.addLabel.get() || jlText('addValue'));
    add.hidden = !canAddRow(this._state.rows.length, this.max.get());
  }

  private renderDisabled(disabled: boolean): void {
    this.reflect('disabled', disabled);
    this.drawRows();
  }

  private row(value: string, index: number): DrawnRow {
    const control = this.control(value, (text) => this.change(index, text));
    const remove = (<JlButton class="remove" variant="ghost" size="sm" icon="x" />) as JlButton;
    remove.events.register('press', () => this.removeRow(index));
    const row = { control, remove };
    this.drawRow(row);
    return row;
  }

  /** Gives a row the list's label, placeholder, type, options and state; the CSS shows or hides its remove button. */
  private drawRow({ control, remove }: DrawnRow): void {
    control.label.set(this.label.get());
    control.disabled.set(this.disabled.get());
    remove.hint.set(this.removeLabel.get() || jlText('removeValue'));
    if (control instanceof JlSelect) {
      control.options.set(this.options.get());
      return;
    }
    control.placeholder.set(this.placeholder.get());
    if (control instanceof JlInput) {
      control.type.set(this.type.get());
    }
  }

  private rowKind(): RowKind {
    if (this.options.get().length > 0) {
      return 'select';
    }
    return this.multiline.get() ? 'textarea' : 'input';
  }

  /** A row's control, of the list's kind, holding `value`; `onInput` hears it. drawRow gives it the rest. */
  private control(value: string, onInput: (text: string) => void): RowControl {
    const controls: Record<RowKind, () => RowControl> = {
      input: () => {
        const input = (<JlInput type={this.type.get()} value={value} />) as JlInput;
        input.events.register('input', onInput);
        return input;
      },
      select: () => {
        // Its options first: the value is chosen among them.
        const select = (<JlSelect options={this.options.get()} />) as JlSelect;
        select.value.set(value);
        select.events.register('change', onInput);
        return select;
      },
      textarea: () => {
        const area = (<JlTextarea value={value} autosize />) as JlTextarea;
        area.events.register('input', onInput);
        return area;
      },
    };
    return controls[this.rowKind()]();
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
