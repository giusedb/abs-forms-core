# Implementation Guide

## File Structure

```
abs-forms/
├── core/
│   ├── types.ts              ← all TypeScript interfaces
│   ├── utils.ts              ← deepGet, deepSet, merge, Comparator
│   ├── Field.ts              ← field state, validation, transforms
│   ├── Form.ts               ← form data, field management, submit
│   ├── WidgetRegistry.ts     ← widget + layout registration
│   └── index.ts              ← barrel exports
│
├── vue/
│   ├── index.ts              ← barrel exports
│   ├── plugin.ts             ← AbsFormPlugin (registers AbsForm, AbsField)
│   ├── src/
│   │   ├── composables/
│   │   │   ├── useForm.ts    ← reactive Form wrapper
│   │   │   └── useField.ts   ← reactive Field wrapper
│   │   └── components/
│   │       ├── AbsForm.vue   ← form wrapper, v-model, buttons
│   │       └── AbsField.vue  ← widget dispatcher
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── tailwind/
│   ├── index.ts              ← barrel exports
│   ├── base.css              ← label/help/error utility classes
│   ├── theme.ts              ← button/widget class generators + dark mode
│   ├── src/
│   │   ├── plugin.ts         ← AbsTailwindPlugin
│   │   ├── components/
│   │   │   ├── AbsInput.vue  ← text/number/email/password/url/phone
│   │   │   ├── AbsSelect.vue
│   │   │   ├── AbsTextarea.vue
│   │   │   ├── AbsCheckbox.vue
│   │   │   ├── AbsRadio.vue
│   │   │   └── AbsDate.vue
│   │   └── layouts/
│   │       └── AbsRowsLayout.vue  ← CSS grid layout
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── nuxtui/
│   ├── index.ts              ← barrel exports
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── module.ts         ← defineNuxtModule (Nuxt module entry)
│   │   ├── plugin.ts         ← Vue plugin for non-Nuxt usage
│   │   ├── runtime/
│   │   │   └── plugin.ts     ← Nuxt plugin: auto-registers widgets/layouts
│   │   ├── components/
│   │   │   ├── AbsInput.vue  ← wraps UInput
│   │   │   ├── AbsSelect.vue ← wraps USelect
│   │   │   ├── AbsTextarea.vue ← wraps UTextarea
│   │   │   ├── AbsCheckbox.vue ← wraps UCheckbox
│   │   │   ├── AbsRadio.vue  ← wraps URadio
│   │   │   └── AbsDate.vue   ← wraps UInputDate (Options API, CalendarDate)
│   │   └── layouts/
│   │       └── AbsRowsLayout.vue ← reuses layout with @nuxt/ui styles
│   └── dist/
│
├── test-app/
│   ├── src/
│   │   ├── main.ts           ← uses AbsTailwindPlugin
│   │   ├── App.vue
│   │   └── style.css
│   ├── tailwind.config.js    ← safelist for col-span-*
│   ├── package.json
│   └── vite.config.ts
│
└── wiki/
    ├── index.md
    ├── architecture.md
    ├── types.md
    ├── implementation-guide.md
    ├── components.md
    ├── extensibility.md
    └── getting-started.md
```

---

## Implementation Steps

### Phase 1: Core Library

#### Step 1: Extend `core/types.ts`

Add the new types: `FormSchema`, `FormConfig`, `FormState`, `FieldController`. Keep all existing types unchanged.

Update `FormFieldSchema` to use `widget` (not `type`), `validate` (single function, not array), and add `mandatory: boolean`.

Update `FormButton` to include `icon?: string`.

#### Step 2: Create `core/Field.ts`

```ts
export class Field {
  schema: FormFieldSchema;
  state: FieldState;

  constructor(schema: FormFieldSchema, initialValue?: unknown);

  setValue(value: unknown): void;
  validate(allValues: Record<string, unknown>): string[];
  reset(): void;
  computeVisible(formValues: Record<string, unknown>): boolean;
  computeDisabled(formValues: Record<string, unknown>): boolean;
  computeReadonly(formValues: Record<string, unknown>): boolean;
  computeOptions(formValues: Record<string, unknown>): FieldOption[];
  applyReadTransform(value: unknown): unknown;
  applyWriteTransform(value: unknown): unknown;
}
```

Key behaviors:
- `setValue` applies `onWrite` transform, stores value, marks dirty if changed from initialValue
- `validate` runs `schema.validate` function if present, checks `mandatory` if set, returns `string[]` of errors
- `computeVisible` evaluates `show` condition (default: true)
- `computeDisabled` evaluates `disabled` condition (default: false)
- `computeReadonly` evaluates `readonly` condition (default: false)
- `computeOptions` resolves static array or calls dynamic function
- Mandatory validation: if `schema.mandatory === true` and value is empty/null/undefined, adds "Required" error

#### Step 3: Create `core/Form.ts`

```ts
export class Form {
  config: FormConfig;
  fields: Map<string, Field>;
  data: Record<string, unknown>;
  buttons: FormButton[];

  constructor(schema: FormSchema, config?: FormConfig);

  getData(): Record<string, unknown>;
  setData(data: Record<string, unknown>): void;
  getValue(path: string): unknown;
  setValue(path: string, value: unknown): void;
  validate(): Record<string, string[]>;
  validateField(path: string): string[];
  submit(): Promise<void>;
  reset(): void;
  toJSON(): Record<string, unknown>;
  getErrors(): Record<string, string[]>;
  isDirty(): boolean;
  isValid(): boolean;
}
```

Key behaviors:
- Constructor creates `Field` instances from schema fields, stores in `fields` Map
- Stores `schema.buttons` in `buttons` property
- `setValue` uses `deepSet` to update `data`, propagates to the Field
- `validate` iterates all fields, calls `field.validate(data)`, collects errors
- `submit` validates first; if valid calls `config.onSubmit(data)` or POSTs to `config.action`
- POST uses `fetch` with `Content-Type: application/json`

#### Step 4: Create `core/WidgetRegistry.ts`

```ts
export class WidgetRegistry {
  private widgets = new Map<string, any>();
  private layouts = new Map<string, any>();

  registerWidget(name: string, component: any): void;
  getWidget(name: string): any | undefined;
  getWidgets(): Record<string, any>;

  registerLayout(name: string, component: any): void;
  getLayout(name: string): any | undefined;
  getLayouts(): Record<string, any>;
}

export const registry = new WidgetRegistry();
```

#### Step 5: Create `core/index.ts`

Barrel export for `Form`, `Field`, `WidgetRegistry`, `registry`, all types, and utilities (`deepGet`, `deepSet`, `merge`, `Comparator`).

---

### Phase 2: Vue Adapter

#### Step 6: Project scaffolding

Create `vue/package.json`:
```json
{
  "name": "@abs-forms/vue",
  "version": "0.1.0",
  "main": "dist/index.umd.js",
  "module": "dist/index.es.js",
  "types": "dist/index.d.ts",
  "peerDependencies": {
    "vue": "^3.4.0"
  }
}
```

Create `vue/tsconfig.json` and `vue/vite.config.ts` (library mode with Vue plugin).

#### Step 7: Create `vue/composables/useForm.ts`

- Accepts `FormSchema` + optional `FormConfig`
- Creates core `Form` instance from schema
- Wraps form state in `reactive()` for Vue reactivity
- Provides getData, setData, getValue, setValue, validate, submit, reset

```ts
export function useForm(schema: FormSchema, config?: FormConfig) {
  const form = new Form(schema, config);
  const state = reactive<FormState>({ ... });

  return { form, state, getData, setData, getValue, setValue, validate, submit, reset };
}
```

#### Step 8: Create `vue/composables/useField.ts`

- Accepts field `name` + parent Form instance
- Returns reactive field state + computed properties for visible/disabled/readonly
- Provides `setValue`, `validate`, `reset` methods
- **Watches `form.getData()` to sync reactive state when form data changes externally**

```ts
export function useField(name: string, form: Form) {
  const field = form.fields.get(name);

  const state = reactive({ ...field.state });
  const visible = computed(() => field.computeVisible(form.getData()));
  const disabled = computed(() => field.computeDisabled(form.getData()));
  const readonly = computed(() => field.computeReadonly(form.getData()));
  const options = computed(() => field.computeOptions(form.getData()));
  const errors = computed(() => state.errors);

  function syncFieldState(): void {
    state.value = field.state.value;
    state.errors = [...field.state.errors];
    state.touched = field.state.touched;
    state.dirty = field.state.dirty;
  }

  // Re-sync when form data changes externally (v-model, onMounted)
  watch(
    () => form.getData(),
    () => { syncFieldState(); },
    { deep: true },
  );

  return { state, visible, disabled, readonly, options, errors, setValue, validate, reset };
}
```

**Why the watch is needed:** `useField` creates a reactive **copy** of `field.state` (not a reference). When `form.setData()` is called, the core `Field.state` updates but the reactive copy in `useField` is stale. The watch on `form.getData()` detects external changes and re-syncs the copy via `syncFieldState()`. Without this, widgets show empty data until a blur event triggers `validate()` → `syncFieldState()`.

#### Step 9: Create `vue/components/AbsForm.vue`

Props:
- `schema: FormSchema` (required) — `{ fields, buttons }`
- `modelValue: Record<string, unknown>` (v-model)
- `action?: string`
- `method?: 'post' | 'put' | 'patch'`
- `layout?: string` (default: 'row')
- `disabled?: boolean`

Emits:
- `update:modelValue`
- `submit`
- `error`
- `change`
- `signal`

Behavior:
- Uses `useForm` composable with schema
- Resolves layout from `registry.getLayout(layout)`
- Wraps in `<form @submit.prevent>`
- Watches state.data → emits update:modelValue
- Renders `schema.buttons` in primary/secondary/left/right groups
- On button click → emits `signal` event with button's `signal` value

#### Step 10: Create `vue/components/AbsField.vue`

- Generic dispatcher component
- Uses `useField()` composable for reactive state
- Resolves widget from `registry.getWidget(field.widget)`
- Renders widget via `<component :is="widgetComponent">`
- Passes modelValue, field, disabled, readonly, errors, options to widget

#### Step 11: Create `vue/plugin.ts` + `vue/index.ts`

Plugin registers `AbsForm` and `AbsField` globally. Index barrel-exports everything.

---

### Phase 3: Tailwind Theme + Widgets

#### Step 12: Project scaffolding + base CSS

Create `tailwind/package.json`, `tsconfig.json`, `vite.config.ts`.

Create `tailwind/base.css` with `@tailwind` directives and `@layer components` for label/help/error classes:

```css
@layer components {
  .abs-label { @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1; }
  .abs-help { @apply mt-1 text-sm text-gray-500 dark:text-gray-400; }
  .abs-error { @apply mt-1 text-sm text-red-600 dark:text-red-400; }
}
```

#### Step 13: Create `tailwind/theme.ts`

Centralized class definitions and generators:

- Button theme: `themeColors`, `themeSizes`, `getButtonClasses()`
- Widget base classes: `inputBase`, `textareaBase`, `selectBase`, `checkboxBase`, `radioBase`
- Widget state classes: `inputDefault`, `inputError`, `inputDisabled`, `inputReadonly`
- Label/help/error classes: `fieldLabel`, `fieldHelp`, `fieldError`
- Class generators: `getInputClasses()`, `getTextareaClasses()`, `getSelectClasses()`, `getCheckboxClasses()`, `getRadioClasses()`

All classes include `dark:` variants for dark mode support.

#### Step 14: Create widget components

Each component in `tailwind/src/components/`:
- Pure input element (no labels, help text, or errors)
- Uses theme class generator from `theme.ts`
- Props: `modelValue`, `field`, `disabled`, `readonly`, `errors`, `options`
- Emits: `update:modelValue`, `blur`

| Component | File | Supported widget types |
|-----------|------|------------------------|
| AbsInput | `AbsInput.vue` | text, number, email, password, url, phone |
| AbsSelect | `AbsSelect.vue` | select |
| AbsTextarea | `AbsTextarea.vue` | textarea |
| AbsCheckbox | `AbsCheckbox.vue` | checkbox |
| AbsRadio | `AbsRadio.vue` | radio |
| AbsDate | `AbsDate.vue` | date |

#### Step 15: Create `AbsRowsLayout.vue`

Layout component in `tailwind/src/layouts/`:
- Props: `form: Form`, `disabled?: boolean`
- Derives fields from `form.fields` Map
- Renders `<label>`, `<AbsField>`, help text, and errors for each field
- CSS grid: `grid grid-cols-12 gap-2`
- Each field spans `col-span-{colSpan}` (default: 12)

#### Step 16: Create `tailwind/src/plugin.ts`

AbsTailwindPlugin:
- Registers all widgets into `registry`
- Registers `row` layout into `registry`
- Registers `AbsForm` and `AbsField` globally

#### Step 17: Create `tailwind/index.ts`

Barrel exports: `AbsTailwindPlugin`, all widget components, layout, and theme utilities.

---

### Phase 4: Nuxt UI Integration (`@abs-forms/nuxtui`)

#### Step 18: Nuxt module + widget components

The nuxtui package wraps Nuxt UI v4 components as abs-forms widgets. Key implementation details:

**`nuxtui/src/module.ts`** — Uses `defineNuxtModule` + `addPlugin` to inject the runtime plugin:

```ts
import { defineNuxtModule, addPlugin } from '@nuxt/kit';
import { resolve } from 'path';

export default defineNuxtModule({
  meta: { name: '@abs-forms/nuxtui', configKey: 'absForms' },
  setup(_options, _nuxt) {
    addPlugin(resolve(__dirname, 'runtime/plugin'));
  },
});
```

**`nuxtui/src/runtime/plugin.ts`** — Auto-registers all widgets/layouts into the `WidgetRegistry` and global components:

```ts
import { registry } from '@abs-forms/core';
import AbsForm from '@abs-forms/vue/src/components/AbsForm.vue';
import AbsField from '@abs-forms/vue/src/components/AbsField.vue';
import AbsInput from '../components/AbsInput.vue';
// ... other imports

export default defineNuxtPlugin((nuxtApp) => {
  registry.registerWidget('text', AbsInput);
  registry.registerWidget('number', AbsInput);
  // ... all widget registrations
  registry.registerLayout('row', AbsRowsLayout);
  nuxtApp.vueApp.component('AbsForm', AbsForm);
  nuxtApp.vueApp.component('AbsField', AbsField);
});
```

**Widget components** — Each wraps a Nuxt UI component and accepts the standard widget contract `{ modelValue, field, disabled, readonly, errors }`:

| Component | Wraps | Key details |
|-----------|-------|-------------|
| `AbsInput.vue` | `UInput` | `<script setup>`; computed `inputType` maps widget→HTML type; number coercion |
| `AbsSelect.vue` | `USelect` | Passes `options` through |
| `AbsTextarea.vue` | `UTextarea` | Passes `rows` from `widgetOptions` |
| `AbsCheckbox.vue` | `UCheckbox` | Boolean toggle |
| `AbsRadio.vue` | `URadioGroup` | Passes `options` through |
| `AbsDate.vue` | `UInputDate` | **Options API** (not `<script setup>`) due to Nuxt auto-import resolution; two-way computed `dateCalendar` converts string↔`CalendarDate` via `@internationalized/date` |

**Relative imports** — The nuxtui package uses relative imports (`@abs-forms/vue/src/components/`) to avoid CJS resolution issues in the Nuxt module runtime.

**`AbsRowsLayout.vue`** — Reuses the same layout pattern as the tailwind package (grid-based, renders label/help/errors) but delegates widget styling to Nuxt UI.

---

### Phase 5: Test App

#### Step 19: Demo app

Create a Vite + Vue 3 app that imports `AbsTailwindPlugin` and `@abs-forms/tailwind/base.css`. Demonstrates all field types, dark/light mode toggle, and form submission.

---

## Coding Conventions

- No comments in code unless explicitly asked
- Vue components use `<script setup>` with Composition API
- All components prefixed with `Abs`
- TypeScript strict mode
- Use existing `deepGet`/`deepSet`/`merge` utilities from core
- Tailwind classes follow the pattern: `abs-{element}` (e.g., `abs-input`, `abs-label`)
- Schema uses `widget` property (not `type`) to identify the widget type
- Validation uses `validate` property (single function, not array)
- `mandatory: true` auto-generates a required validator
- Widget components are pure input elements — layout handles labels/help/errors
- Dark mode: all classes include `dark:` variants
- CSS is centralized in `theme.ts` — widgets use class generator functions
