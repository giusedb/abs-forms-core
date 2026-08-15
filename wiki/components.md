# Component Reference

## AbsForm

Main form wrapper component. Manages form state, validation, and submission.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `schema` | `FormSchema` | *required* | Form schema with `fields` and optional `buttons` |
| `modelValue` | `Record<string, unknown>` | `{}` | Form data (v-model binding) |
| `action` | `string` | - | URL for auto-submit via POST JSON |
| `method` | `'post' \| 'put' \| 'patch'` | `'post'` | HTTP method for auto-submit |
| `layout` | `string` | `'row'` | Layout name from registry |
| `disabled` | `boolean` | `false` | Disable all fields |

### Emits

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `Record<string, unknown>` | v-model update on data change |
| `submit` | `Record<string, unknown>` | Emitted on valid form submission (when no `action` prop) |
| `error` | `Record<string, string[]>` | Emitted on validation failure |
| `change` | `{ name: string, value: unknown }` | Emitted on any field change |
| `signal` | `string` | Emitted when a button is clicked (passes the button's `signal` value) |

### Usage

```vue
<template>
  <AbsForm
    :schema="schema"
    v-model="data"
    @submit="onSubmit"
    @error="onError"
  />
</template>

<script setup>
import { ref } from 'vue';
import { AbsForm } from '@abs-forms/vue';

const schema = {
  fields: [
    { name: 'firstName', label: 'First Name', widget: 'text', colSpan: 6 },
    { name: 'email', label: 'Email', widget: 'text', colSpan: 6 },
  ],
  buttons: [
    { id: 'submit', label: 'Save', signal: 'save', position: 'primary', color: 'primary', icon: 'i-fa-disk-save' },
  ],
};

const data = ref({});

function onSubmit(formData) {
  console.log('Submitted:', formData);
}

function onError(errors) {
  console.error('Validation errors:', errors);
}
</script>
```

### Auto-submit with action URL

```vue
<AbsForm
  :schema="schema"
  v-model="data"
  action="/api/users"
  method="post"
/>
```

When `action` is set, the form automatically POSTs JSON to the URL on valid submission.

### Button signals

When a button is clicked, AbsForm emits a `signal` event with the button's `signal` value:

```vue
<AbsForm
  :schema="schema"
  v-model="data"
  @submit="onSubmit"
  @signal="onSignal"
/>

<script setup>
function onSubmit(data) {
  console.log('Form valid, submitted:', data);
}

function onSignal(signal) {
  if (signal === 'save') { /* handle save */ }
  if (signal === 'cancel') { /* handle cancel */ }
}
</script>
```

---

## AbsRowsLayout

Grid-based layout component. Arranges fields in a CSS grid. **Responsible for rendering labels, help text, and validation errors.**

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `form` | `Form` | *required* | Form instance (provides fields, data, errors) |
| `disabled` | `boolean` | `false` | Disable all rendered fields |

### Behavior

- Uses `grid grid-cols-12` CSS grid
- Each field spans `col-span-{colSpan}` columns (default: 12)
- Fields with `show` condition returning `false` are removed from DOM (v-if)
- Renders `<label>` with `abs-label` class for each field with a `label`
- Renders `<p class="abs-help">` for fields with `help`
- Renders `<p class="abs-error">` for each validation error
- Gets errors from `form.state.errors[field.name]`

### Field Derivation

The layout reads fields directly from the `Form` instance:

```ts
const fields = computed(() => props.form.fields);          // Map<string, Field>
const fieldDefs = computed(() => [...fields.value.values().map(f => f.schema)]);  // FormFieldSchema[]
```

### Grid Examples

```
Full width:     colSpan: 12  →  12/12 columns
Half width:     colSpan: 6   →  6/12 columns
Third width:    colSpan: 4   →  4/12 columns
Quarter width:  colSpan: 3   →  3/12 columns
```

### Rendered HTML

```html
<div class="grid grid-cols-12 gap-2">
  <div class="col-span-6">
    <label for="abs-field-firstName" class="abs-label">First Name</label>
    <input id="abs-field-firstName" type="text" class="..." />
    <p class="abs-help">Enter your first name</p>
    <p class="abs-error">Required</p>
  </div>
  <div class="col-span-6">
    <label for="abs-field-email" class="abs-label">Email</label>
    <input id="abs-field-email" type="text" class="..." />
  </div>
</div>
```

### Usage

AbsRowsLayout is the default layout. You don't need to reference it directly:

```vue
<AbsForm :schema="schema" layout="row" />
```

---

## AbsField

Generic field dispatcher. Resolves the correct widget component based on the `widget` property.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `field` | `FormFieldSchema` | *required* | Field schema definition |
| `form` | `Form` | *required* | Form instance |
| `disabled` | `boolean` | `false` | Disable the field |

### Behavior

1. Uses `useField()` composable to get reactive field state
2. Resolves widget component from `field.widget` via `WidgetRegistry`
3. Renders widget via `<component :is="widgetComponent">`
4. Passes `v-model` binding, field schema, disabled/readonly state, errors, and options to widget
5. On blur, triggers field validation

### Widget Resolution

```ts
const widget = props.field.widget ?? 'text';
return registry.getWidget(widget);
```

### Widget Contract

Each widget component receives these props:

| Prop | Type | Description |
|------|------|-------------|
| `modelValue` | `unknown` | Current field value |
| `field` | `FormFieldSchema` | Field schema |
| `disabled` | `boolean` | Disabled state |
| `readonly` | `boolean` | Readonly state (where applicable) |
| `errors` | `string[]` | Validation errors |
| `options` | `FieldOption[]` | Options (select/radio only) |

And emits:

| Event | Payload | Description |
|-------|---------|-------------|
| `update:modelValue` | `unknown` | Value change |
| `blur` | - | Field blurred |

### Widget Registry

Registered widgets (from `@abs-forms/tailwind` or `@abs-forms/nuxtui`):

```ts
{
  text: AbsInput,
  number: AbsNumber,
  email: AbsInput,
  password: AbsInput,
  url: AbsInput,
  phone: AbsInput,
  date: AbsDate,
  datetime: AbsDateTime,
  select: AbsSelect,
  textarea: AbsTextarea,
  checkbox: AbsCheckbox,
  radio: AbsRadio,
}
```

---

## Widget Components

All widget components are **pure input elements**. They do NOT render labels, help text, or errors — those are handled by the layout.

### AbsInput

Text-based input field. Handles multiple HTML input types.

#### Supported Widget Types

| `field.widget` | HTML input type |
|----------------|-----------------|
| `text` (default) | `text` |
| `email` | `email` |
| `password` | `password` |
| `url` | `url` |
| `phone` | `tel` |

#### Rendered HTML

```html
<input
  id="abs-field-name"
  type="text"
  class="abs-input ..."
  placeholder="..."
  :disabled="disabled"
  :readonly="readonly"
/>
```

---

### AbsNumber

Numeric input field with increment/decrement buttons. Wraps Nuxt UI's `UInputNumber`.

#### Widget Options

Configure via `field.widgetOptions`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `min` | `number` | - | Minimum allowed value |
| `max` | `number` | - | Maximum allowed value |
| `step` | `number` | - | Increment/decrement step size |
| `positive` | `boolean` | `false` | Enforce `min: 0` (explicit `min` takes precedence) |
| `integer` | `boolean` | `false` | Enforce `step: 1` and `formatOptions: { maximumFractionDigits: 0 }` |
| `formatOptions` | `Intl.NumberFormatOptions` | - | Number formatting options (e.g. `{ maximumFractionDigits: 2 }`) |
| `locale` | `string` | - | Locale for number formatting |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout of increment/decrement buttons |
| `disableWheelChange` | `boolean` | - | Prevent value change on scroll |

#### Schema Examples

Basic number:
```ts
{ name: 'quantity', label: 'Quantity', widget: 'number', colSpan: 6 }
```

Positive integer:
```ts
{ name: 'age', label: 'Age', widget: 'number', colSpan: 6, widgetOptions: { positive: true, integer: true } }
```

Bounded decimal:
```ts
{ name: 'price', label: 'Price', widget: 'number', colSpan: 6, widgetOptions: { min: 0, max: 9999.99, formatOptions: { maximumFractionDigits: 2 } } }
```

---

### AbsSelect

Dropdown select field. Options come from the layout via the `options` prop.

#### Rendered HTML

```html
<select id="abs-field-name" class="abs-select ..." :disabled="disabled">
  <option value="" disabled>Select...</option>
  <option value="opt1">Option 1</option>
  <option value="opt2" disabled>Option 2 (disabled)</option>
</select>
```

---

### AbsTextarea

Multi-line text input.

#### Widget Options

Configure via `field.widgetOptions`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rows` | `number` | `4` | Number of rows |

#### Rendered HTML

```html
<textarea id="abs-field-name" class="abs-textarea ..." rows="4" placeholder="..." />
```

---

### AbsCheckbox

Boolean checkbox field.

#### Rendered HTML

```html
<input
  id="abs-field-name"
  type="checkbox"
  class="abs-checkbox ..."
/>
```

---

### AbsRadio

Radio button group field. Options come from the layout.

#### Rendered HTML

```html
<div class="flex flex-col gap-2">
  <label class="flex items-center">
    <input type="radio" name="abs-radio-name" value="opt1" class="abs-radio ..." />
    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Option 1</span>
  </label>
  <label class="flex items-center">
    <input type="radio" name="abs-radio-name" value="opt2" class="abs-radio ..." />
    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Option 2</span>
  </label>
</div>
```

---

### AbsDate

Date picker field.

**Nuxt UI v4 variant (`@abs-forms/nuxtui`)**: Uses `UInputDate` from `@nuxt/ui` v4 with `@internationalized/date` / `CalendarDate`. The component is written with Options API (not `<script setup>`) due to Nuxt auto-import resolution constraints. A two-way computed (`dateCalendar`) converts the Date model value to/from `CalendarDate` for the underlying `UInputDate`. When `showCalendar: true`, adds a calendar icon button that opens a `UPopover` with `UCalendar` for visual date selection.

**Tailwind variant (`@abs-forms/tailwind`)**: Uses a native `<input type="date">`. When `showCalendar: true`, adds a calendar icon button that opens a custom popover with a month grid calendar.

#### Widget Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showCalendar` | `boolean` | `false` | Show calendar popover picker |
| `min` | `string` | - | Minimum date (YYYY-MM-DD) |
| `max` | `string` | - | Maximum date (YYYY-MM-DD) |

#### Schema Example

```ts
{
  name: 'birthDate',
  label: 'Birth Date',
  widget: 'date',
  colSpan: 6,
  widgetOptions: {
    showCalendar: true,
  },
}
```

#### Rendered HTML (Tailwind)

```html
<div class="relative inline-flex items-center gap-2">
  <input
    id="abs-field-name"
    type="date"
    class="abs-input ..."
    min="2024-01-01"
    max="2024-12-31"
  />
  <!-- Optional calendar toggle button (when showCalendar: true) -->
  <button type="button" class="...">
    <svg>...</svg>
  </button>
  <!-- Optional popover calendar (when showCalendar: true) -->
  <div class="absolute z-50 ...">
    <!-- Calendar grid -->
  </div>
</div>
```

#### Rendered HTML (Nuxt UI)

```html
<div class="flex items-center gap-2">
  <UInputDate
    id="abs-field-name"
    v-model="dateCalendar"
    placeholder="..."
    :disabled="disabled"
    :readonly="readonly"
    :highlight="hasErrors"
  />
  <!-- Optional calendar toggle button (when showCalendar: true) -->
  <UPopover>
    <UButton icon="i-heroicons-calendar" ... />
    <template #content>
      <UCalendar v-model="calendarDate" />
    </template>
  </UPopover>
</div>
```

---

### AbsDateTime

Date and time picker field. Combines date and time selection in one widget.

**Nuxt UI v4 variant (`@abs-forms/nuxtui`)**: Uses `UInputDate` for date and `UInputTime` for time inputs. When `showCalendar: true`, adds a calendar icon button that opens a `UPopover` with `UCalendar` for visual date selection. The component is written with Options API due to Nuxt auto-import constraints.

**Tailwind variant (`@abs-forms/tailwind`)**: Uses a native `<input type="datetime-local">` as the base input. When `showCalendar: true`, adds a calendar icon button that opens a custom popover with a month grid calendar.

#### Widget Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `showCalendar` | `boolean` | `false` | Show calendar popover picker |
| `min` | `string` | - | Minimum date (YYYY-MM-DD) |
| `max` | `string` | - | Maximum date (YYYY-MM-DD) |

#### Schema Example

```ts
{
  name: 'appointment',
  label: 'Appointment',
  widget: 'datetime',
  colSpan: 12,
  widgetOptions: {
    showCalendar: true,
    min: '2024-01-01',
    max: '2025-12-31',
  },
}
```

#### Rendered HTML (Tailwind)

```html
<div class="relative inline-flex items-center gap-2">
  <input
    id="abs-field-name"
    type="datetime-local"
    class="abs-input ..."
    min="2024-01-01"
    max="2025-12-31"
  />
  <!-- Optional calendar toggle button (when showCalendar: true) -->
  <button type="button" class="...">
    <svg>...</svg>
  </button>
  <!-- Optional popover calendar (when showCalendar: true) -->
  <div class="absolute z-50 ...">
    <!-- Calendar grid -->
  </div>
</div>
```

#### Rendered HTML (Nuxt UI)

```html
<div class="flex items-center gap-2">
  <UInputDate
    id="abs-field-name-date"
    v-model="inputDateValue"
    placeholder="..."
    :disabled="disabled"
    :readonly="readonly"
    :highlight="hasErrors"
  />
  <!-- Optional calendar toggle button (when showCalendar: true) -->
  <UPopover>
    <UButton icon="i-heroicons-calendar" ... />
    <template #content>
      <UCalendar v-model="calendarDateTime" />
    </template>
  </UPopover>
  <UInputTime
    id="abs-field-name-time"
    v-model="inputTimeValue"
    :disabled="disabled"
    :readonly="readonly"
    :highlight="hasErrors"
  />
</div>
```

---

## Nuxt UI Widgets (`@abs-forms/nuxtui`)

The `@abs-forms/nuxtui` package provides the same widget components, but wraps Nuxt UI v4 components instead of raw HTML elements. All accept the same `{ modelValue, field, disabled, readonly, errors }` widget contract.

| Component | Wraps | Notes |
|-----------|-------|-------|
| AbsInput | `UInput` | Maps widget type to HTML input type |
| AbsNumber | `UInputNumber` | Increment/decrement buttons; min/max/step; positive/integer widgetOptions |
| AbsSelect | `USelect` | Passes options through; delegates styling to Nuxt UI |
| AbsTextarea | `UTextarea` | Passes `rows` from `widgetOptions` |
| AbsCheckbox | `UCheckbox` | Boolean toggle via Nuxt UI checkbox |
| AbsRadio | `URadioGroup` / `URadio` | Renders radio options via Nuxt UI |
| AbsDate | `UInputDate` | Options API; two-way computed converts Date↔`CalendarDate`; optional calendar popover |
| AbsDateTime | `UInputDate` + `UInputTime` | Options API; text-based inputs + optional calendar popover; uses `CalendarDateTime` |

These widgets are auto-registered when the Nuxt module is loaded — no manual `registerWidget()` calls needed.
