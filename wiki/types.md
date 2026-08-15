# Types & Interfaces

All types are defined in `core/types.ts`. Utility functions are in `core/utils.ts`.

---

## Schema Definition

The top-level schema object passed to `AbsForm`:

```ts
interface FormSchema {
  fields: FormFieldSchema[];
  buttons?: FormButton[];
}
```

Usage:

```ts
const schema = {
  fields: [
    { name: 'firstName', label: 'First Name', widget: 'text', mandatory: true, colSpan: 6 },
    { name: 'email', label: 'Email', widget: 'text', validate: (v) => !v ? 'Required' : undefined },
  ],
  buttons: [
    { id: 'submit', label: 'Save', signal: 'save', position: 'primary', color: 'primary', icon: 'i-fa-disk-save' },
  ],
};
```

---

## Theme Types

### `ThemeColor`

```ts
type ThemeColor =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark';
```

Used for button colors, field accent colors, and status indicators.

### `ThemeVariant`

```ts
type ThemeVariant = 'solid' | 'outline' | 'link' | 'ghost' | 'underline';
```

Visual style variant for buttons and interactive elements.

### `ThemeSize`

```ts
type ThemeSize = 'sm' | 'md' | 'lg';
```

Size preset for components. Maps to Tailwind padding/font-size classes.

---

## Form Types

### `FormMode`

```ts
type FormMode = 'edit' | 'view';
```

Determines whether the form is editable or read-only.

---

## Field Types

### `FieldValidator`

```ts
type FieldValidator = (
  value: unknown,
  data: Record<string, unknown>,
) => string | undefined;
```

A validation function. Returns `undefined` if valid, or an error message string if invalid. Receives the field value and the full form data (for cross-field validation).

**Example:**

```ts
const emailValidator: FieldValidator = (value) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(String(value))) {
    return 'Email is invalid';
  }
  return undefined;
};
```

### `FieldCondition`

```ts
type FieldCondition = (
  value: unknown,
  formValues: Record<string, unknown>,
) => boolean;
```

A function that evaluates a condition based on the field value and form data. Used for `show`, `disabled`, and `readonly` properties.

**Example:**

```ts
// Show field only if another field is "yes"
const showIfYes: FieldCondition = (value, formValues) => {
  return formValues.otherField === 'yes';
};
```

### `FieldOption`

```ts
interface FieldOption {
  label: string;
  value: unknown;
  description?: string;
  disable?: boolean;
}
```

An option for select/radio/checkbox group fields.

### `FieldTransform`

```ts
interface FieldTransform {
  onRead?: (value: unknown) => unknown;
  onWrite?: (value: unknown) => unknown;
}
```

Transforms applied when reading or writing field values. `onRead` transforms data from the form to the widget. `onWrite` transforms data from the widget to the form.

**Example:**

```ts
// Store date as ISO string, display as formatted date
transform: {
  onRead: (value) => new Date(value as string).toLocaleDateString(),
  onWrite: (value) => new Date(value as string).toISOString(),
}
```

### `FieldState`

```ts
interface FieldState {
  value: unknown;
  initialValue: unknown;
  errors: string[];
  touched: boolean;
  dirty: boolean;
  disabled: boolean;
  readonly: boolean;
  visible: boolean;
}
```

The runtime state of a field. Managed by the `Field` class, exposed as reactive state by the Vue adapter.

| Property | Description |
|----------|-------------|
| `value` | Current value (after onRead transform) |
| `initialValue` | Value at form reset / initial load |
| `errors` | Array of validation error messages |
| `touched` | Whether the field has been blurred |
| `dirty` | Whether value differs from initialValue |
| `disabled` | Whether the field is disabled |
| `readonly` | Whether the field is read-only |
| `visible` | Whether the field is visible |

---

## Schema Types

### `FormFieldSchema`

```ts
interface FormFieldSchema {
  name: string;
  widget?: string;
  label?: string;
  placeholder?: string;
  help?: string;
  mandatory?: boolean;
  colSpan?: number;
  color?: ThemeColor;
  variant?: ThemeVariant;
  size?: ThemeSize;
  cssClass?: string;
  validate?: FieldValidator;
  options?: FieldOption[] | ((value: unknown, formValues: Record<string, unknown>) => FieldOption[]);
  disabled?: boolean | FieldCondition;
  readonly?: boolean | FieldCondition;
  show?: FieldCondition;
  transform?: FieldTransform;
  attrs?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  widgetOptions?: Record<string, any>;
}
```

| Property | Required | Description |
|----------|----------|-------------|
| `name` | Yes | Unique field name, used as dot-notation path key |
| `widget` | No | Widget type identifier (default: `'text'`). Common values: `'text'`, `'number'`, `'email'`, `'password'`, `'url'`, `'phone'`, `'select'`, `'textarea'`, `'checkbox'`, `'radio'`, `'date'`, `'datetime'` |
| `label` | No | Display label above the field (rendered by layout) |
| `placeholder` | No | Placeholder text |
| `help` | No | Help text below the field (rendered by layout) |
| `mandatory` | No | If `true`, auto-adds a required validator (default: false) |
| `colSpan` | No | Grid columns to span (1-12, default: 12) |
| `color` | No | Theme color for the field |
| `variant` | No | Theme variant |
| `size` | No | Theme size |
| `cssClass` | No | Additional CSS classes applied to the input element |
| `validate` | No | Single validation function |
| `options` | No | Static array or dynamic function returning options |
| `disabled` | No | Static boolean or condition function |
| `readonly` | No | Static boolean or condition function |
| `show` | No | Condition function controlling visibility |
| `transform` | No | Read/write value transforms |
| `attrs` | No | Additional HTML attributes passed to the widget |
| `meta` | No | Arbitrary metadata (extensible) |
| `widgetOptions` | No | Widget-specific configuration (e.g., `{ rows: 4 }`, `{ min: '2024-01-01' }`) |

### `FormButton`

```ts
interface FormButton {
  id: string;
  label: string;
  hint?: string;
  signal: string;
  icon?: string;
  color?: ThemeColor;
  variant?: ThemeVariant;
  size?: ThemeSize;
  disabled?: boolean | FieldCondition;
  visible?: boolean | FieldCondition;
  position: 'primary' | 'secondary' | 'left' | 'right';
}
```

Describes a form action button (submit, cancel, etc.).

| Property | Description |
|----------|-------------|
| `id` | Unique button identifier |
| `label` | Button text |
| `hint` | Tooltip or aria-label text |
| `signal` | Signal name emitted on click (e.g., `'save'`, `'cancel'`) |
| `icon` | Icon class name (e.g., `'i-fa-disk-save'`) |
| `color` | Theme color |
| `variant` | Theme variant |
| `size` | Theme size |
| `disabled` | Static or conditional disabled state |
| `visible` | Static or conditional visibility |
| `position` | Layout position: `'primary'` (right), `'secondary'` (left of primary), `'left'`, `'right'` |

---

## Form Types

### `FormConfig`

```ts
interface FormConfig {
  action?: string;
  method?: 'post' | 'put' | 'patch';
  onSubmit?: (data: Record<string, unknown>) => void | Promise<void>;
  onError?: (errors: Record<string, string[]>) => void;
  validateOnChange?: boolean;
}
```

| Property | Description |
|----------|-------------|
| `action` | URL for auto-submit via AJAX POST. If omitted, form emits `submit` event. |
| `method` | HTTP method for auto-submit (default: `'post'`) |
| `onSubmit` | Callback invoked on valid submit |
| `onError` | Callback invoked on validation failure |
| `validateOnChange` | Whether to validate all fields on any change (default: false) |

### `FormState`

```ts
interface FormState {
  data: Record<string, unknown>;
  errors: Record<string, string[]>;
  dirty: boolean;
  submitting: boolean;
  valid: boolean;
}
```

The reactive form state exposed to Vue components.

### `FieldController`

```ts
interface FieldController {
  state: FieldState;
  setValue(value: unknown): void;
  validate(): string[];
  reset(): void;
}
```

Interface for the Vue adapter to interact with a field.

---

## Utility Functions (`core/utils.ts`)

### `deepGet(obj, path)`

```ts
function deepGet(obj: unknown, path: string): unknown;
```

Retrieves a value from a nested object using dot-notation path.

```ts
deepGet({ address: { city: 'Rome' } }, 'address.city');
// → 'Rome'
```

### `deepSet(obj, path, value)`

```ts
function deepSet(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown>;
```

Returns a new object with the value set at the given dot-notation path. Does not mutate the original.

```ts
deepSet({}, 'address.city', 'Rome');
// → { address: { city: 'Rome' } }
```

### `merge(...objects)`

```ts
function merge(...objects: object[]): Record<string, unknown>;
```

Deep merges multiple plain objects. Later objects override earlier ones.

### `Comparator`

```ts
class Comparator {
  keys: string[];
  constructor(...keys: string[]);
  signature(object: any): string;
  compare(x: any, y: any): number;
  equal(x: any, y: any): boolean;
  indexOf(object: any, list: any[]): number;
  includes(object: any, list: any[]): boolean;
}
```

Utility for comparing objects by specific keys. Used for option matching and deduplication.

---

## Widget Registry (`core/WidgetRegistry.ts`)

### `WidgetRegistry`

```ts
class WidgetRegistry {
  registerWidget(name: string, component: any): void;
  getWidget(name: string): any | undefined;
  getWidgets(): Record<string, any>;

  registerLayout(name: string, component: any): void;
  getLayout(name: string): any | undefined;
  getLayouts(): Record<string, any>;
}
```

Framework-agnostic registry for widget and layout components. A singleton instance is exported as `registry`.

```ts
import { registry } from '@abs-forms/core';

registry.registerWidget('text', MyInput);
registry.registerLayout('custom', MyLayout);
```

---

## Date & DateTime Widget Notes (`@abs-forms/nuxtui`)

### Date Widget

When using the `date` widget with `@abs-forms/nuxtui`, the underlying `UInputDate` component expects `CalendarDate` objects from `@internationalized/date`. The `AbsDate` widget handles the conversion automatically:

- **Form storage**: `Date` object or `null`
- **Widget display**: `CalendarDate` instance
- **Conversion**: two-way computed property in `AbsDate.vue` converts between the two formats

If you need to set initial date values, use `Date` objects:

```ts
const data = ref({ birthDate: new Date('1990-05-15') });
```

### DateTime Widget

When using the `datetime` widget with `@abs-forms/nuxtui`, the component combines `UInput` for date and time inputs, plus a `UPopover` with `UCalendar` when `showCalendar: true`.

- **Form storage**: `Date` object or `null`
- **Widget display**: `CalendarDateTime` instance for calendar popover
- **Conversion**: two-way computed property in `AbsDateTime.vue` handles the conversion

#### Widget Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showCalendar` | `boolean` | `false` | Show calendar popover picker |
| `min` | `string` | - | Minimum date (YYYY-MM-DD) |
| `max` | `string` | - | Maximum date (YYYY-MM-DD) |

#### Schema Example

```ts
const schema = {
  fields: [
    {
      name: 'appointment',
      label: 'Appointment',
      widget: 'datetime',
      widgetOptions: {
        showCalendar: true,
      },
    },
  ],
};
```
