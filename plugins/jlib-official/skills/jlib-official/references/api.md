# The API beside the components

What `@syware/jlib` exports besides its 76 components (each has its reference in `components/<tag>.md`). The
installed declarations are the last word: `node_modules/@syware/jlib/dist/index.d.ts` and `dist/lib/`.

## Contents

- Feedback and questions
- Icons
- jlib's texts
- Tables
- The app's icon
- Formats
- For your own components
- Shared values
- Types

## Feedback and questions

| Export | Signature | Does |
|---|---|---|
| `toast` | `toast(options: ToastOptions): ToastHandle` | Shows a notification in the page's toaster (made on first use, in the document). `ToastOptions`: `heading`, `text`, `tone` (`neutral`, `ok`, `warn`, `danger`, `info`), `icon`, `duration` (ms; 0 until closed), `closable`, `actionLabel` + `onAction`, `working`, `progress`. `ToastHandle`: `update(changes)`, `dismiss()` |
| `confirmDialog` | `confirmDialog(options: ConfirmOptions): Promise<boolean>` | Asks a yes or no in a modal and resolves `true` for confirm. `ConfirmOptions`: `heading` (required), `text`, `confirmLabel`, `cancelLabel`, `tone` (`accent` or `danger`) |
| `guardLeave` | `guardLeave(options: LeaveGuardOptions): () => Promise<boolean>` | Guards a form: closing or reloading the tab asks the browser's question; the function it returns asks "Leave without saving?" in the page and is the page's `canLeave`. `LeaveGuardOptions`: `isDirty`, `signal` (required), `heading`, `text`, `leaveLabel`, `stayLabel` |
| `download` | `download(url: string, options?: DownloadOptions): Promise<DownloadResult>` | Downloads with its progress and **Cancel** in a toast, then saves under the server's name. `DownloadOptions`: `title`, `fileName`, `init` (the request's options), `texts`. `DownloadResult`: `{ outcome: 'saved', name, size }`, `{ outcome: 'failed', error }` or `{ outcome: 'canceled' }` |
| `downloadTexts` | `downloadTexts(): DownloadTexts` | What `download` says, in jlib's language |
| `JlLoadState.whenSettled` | `JlLoadState.whenSettled(root: ParentNode, signal?: AbortSignal): Promise<void>` | Resolves once every load state under the root that can be seen has left loading (shadow roots included) |

## Icons

| Export | Signature | Does |
|---|---|---|
| `registerIcons` | `registerIcons(icons: Record<string, IconNode>): void` | Registers lucide icons by name: `registerIcons({ 'refresh-cw': RefreshCw })` |
| `COMMON_ICONS` | `Record<string, IconNode>` | About 90 usual icons (about 5 kB): `registerIcons(COMMON_ICONS)` |
| `hasIcon` | `hasIcon(name: string): boolean` | Whether a name is registered |
| `iconNames` | `iconNames(): string[]` | The names registered, sorted |
| `iconElement` | `iconElement(name: string, size: number): SVGElement` | An icon as an SVG element, for code that draws outside a component |

## jlib's texts

| Export | Signature | Does |
|---|---|---|
| `jlTexts.setLocale` | `setLocale(locale: string): Promise<void>` | Shows jlib's texts in a locale (`fr-CH` shows French); throws for one jlib has no texts for |
| `jlTexts.follow` | `follow(translator): Promise<void>` | Follows a Jadis `Translator`, now and at each of its changes |
| `jlTexts.add` | `add(locale, 'en' \| 'fr' \| 'de')` or `add(locale, loader)` | A language jlib does not translate: one of its own shown for it, or all its texts |
| `jlTexts.fix` | `fix(locale: string, fixes: Partial<…>): void` | Changes a few texts of one locale |
| `jlTexts.locale` | `string` | The locale shown |
| `jlText` | `jlText(key, params?): string` | One of jlib's texts in the language shown, its placeholders filled |
| `DEFAULT_TEXTS` | | Every key, with its English text |
| `JL_LANGUAGES` | `['en', 'fr', 'de']` | jlib's own languages |

## Tables

| Export | Signature | Does |
|---|---|---|
| `cellOf` | `cellOf<Row>(draw: (row: Row) => Node): TableCellRenderer` | Types a renderer of a table that does not say its type |
| `TABLE_SORT_DIRECTIONS`, `TABLE_EXPANSIONS` | `readonly` lists | The values of `sortDirection` and `expandable` |

## The app's icon

| Export | Signature | Does |
|---|---|---|
| `setFavicon` | `setFavicon(icon: string): void` | Makes the app's tile (the glyph of a registered icon on `--jl-brand`) the tab's icon |

## Formats

| Export | Signature | Does |
|---|---|---|
| `formatDuration` | `formatDuration(milliseconds: number, locale?: string): string` | A duration as people read it: "< 1 sec", "33 sec", "2 min" |
| `formatRelativeTime` | `formatRelativeTime(date: Date \| number \| string, now: Date \| number, locale?: string): string` | "5 minutes ago", "yesterday" |

## For your own components

| Export | Signature | Does |
|---|---|---|
| `JlElement` | abstract class | The base of jlib's components: tokens adopted, `whenRendered`, `reflect`, `drawTexts` ([views.md](views.md#your-own-components-on-jlelement)) |
| `JlFormControl` | abstract class | A form-associated `JlElement`: `name`, `internals`, reset and disabled by a fieldset |
| `define` | `define(...components): void` | Registers the tags of the classes given, and keeps them in the bundle |
| `oneOf` | `oneOf(allowed, fallback)` | An attribute parser for an enum: `useChange('md', …, { attribute: 'size', parse: oneOf(SIZES, 'md') })` |
| `jsonOf` | `jsonOf(fallback)` | An attribute parser for a list or an object written as JSON |
| `clampedNumber` | `clampedNumber(fallback, min, max)` | An attribute parser for a number within bounds |
| `followAnchor` | `followAnchor(anchor, floating, placement, signal, gap?)` | Keeps what floats beside its anchor until the signal aborts; `PLACEMENTS` lists the placements |
| `computePosition`, `placeFloating` | | The same, once |
| `adoptTokens` | `adoptTokens(): void` | Gives the document jlib's tokens now (a component's registration does it) |
| `BASE_STYLES`, `CONTROL_STYLES`, `FLOATING_STYLES`, `TOKEN_STYLES` | CSS text | jlib's shared styles: box sizing, focus ring, `hidden`, `.sr-only`; a text field's frame; what floats; the tokens themselves (for a `data-theme` inside a shadow root) |

## Shared values

`TONES` (`neutral`, `accent`, `ok`, `warn`, `danger`, `info`), `CONTROL_SIZES` (`md`, `sm`, `lg`), `TONE_ICONS` (each
tone's icon) and `TONE_ICON_FILLED`, and each component's own lists (`BUTTON_VARIANTS`, `PAGE_WIDTHS`, `DIALOG_SIZES`,
`LOAD_SKELETONS`…), for a control that lets people choose among them.

## Types

Every type is exported from `@syware/jlib`: the components' items and options (`TableColumn<Row, Extra>`,
`TableRenderers`, `SelectOption<Value>`, `ChipGroupOption<Value>`, `RadioOption<Value>`, `SegmentedOption<Value>`,
`MenuItem<Value>`, `SideNavSection<Id>`, `SideNavItem<Id>`, `TabBarItem<Id>`, `BreadcrumbItem<Id>`, `PaletteCommand<Id>`,
`TreeItem`, `TreeLoader`, `Fact`, `StepItem`), the options of the functions (`ToastOptions`, `ConfirmOptions`,
`LeaveGuardOptions`, `DownloadOptions`), and the shared ones (`Tone`, `ControlSize`, `Placement`, `StatusLook`).
Import them with `import type`.
