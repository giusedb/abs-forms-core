# Extensibility Guide

## Custom Layouts

Layouts control how fields are arranged and how labels/help/errors are displayed. The default layout is `AbsRowsLayout` (CSS grid).

### Registering a Custom Layout

```ts
import { registry } from '@abs-forms/core';
import MyCustomLayout from './MyCustomLayout.vue';

registry.registerLayout('custom', MyCustomLayout);
```

### Using a Custom Layout

```vue
<AbsForm :schema="schema" layout="custom" />
```

### Creating a Layout Component

A layout component must:

1. Accept a `form` prop (`Form` instance) and optional `disabled` prop
2. Derive fields from `form.fields` Map
3. Render `AbsField` for each field
4. Handle field visibility (or let AbsField handle it via v-if)
5. Render labels, help text, and validation errors

```vue
<template>
  <div class="my-custom-layout">
    <div v-for="field in fieldDefs" :key="field.name">
      <label v-if="field.label" :for="`abs-field-${field.name}`" class="abs-label">
        {{ field.label }}
      </label>

      <AbsField :field="field" :form="form" :disabled="disabled" />

      <p v-if="field.help" class="abs-help">{{ field.help }}</p>
      <p v-for="error in getErrors(field)" :key="error" class="abs-error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { AbsField } from '@abs-forms/vue';

const props = defineProps({
  form: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
});

const fields = computed(() => props.form.fields);
const fieldDefs = computed(() => [...fields.value.values().map(f => f.schema)]);

function getErrors(field) {
  return props.form?.state?.errors[field.name] ?? [];
}
</script>
```

### Example: Flex Layout

```vue
<template>
  <div class="flex flex-wrap gap-4">
    <div
      v-for="field in fieldDefs"
      :key="field.name"
      :style="{ flex: `0 0 ${(field.colSpan || 12) / 12 * 100}%` }"
    >
      <label v-if="field.label" :for="`abs-field-${field.name}`" class="abs-label">
        {{ field.label }}
      </label>
      <AbsField :field="field" :form="form" :disabled="disabled" />
      <p v-if="field.help" class="abs-help">{{ field.help }}</p>
      <p v-for="error in getErrors(field)" :key="error" class="abs-error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { AbsField } from '@abs-forms/vue';

const props = defineProps({
  form: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
});

const fields = computed(() => props.form.fields);
const fieldDefs = computed(() => [...fields.value.values().map(f => f.schema)]);

function getErrors(field) {
  return props.form?.state?.errors[field.name] ?? [];
}
</script>
```

### Example: Tabs Layout

```vue
<template>
  <div>
    <div class="flex border-b">
      <button
        v-for="(field, i) in fieldDefs"
        :key="field.name"
        @click="activeTab = i"
        :class="activeTab === i ? 'border-b-2 border-blue-500' : ''"
      >
        {{ field.label }}
      </button>
    </div>
    <div class="p-4">
      <AbsField :field="fieldDefs[activeTab]" :form="form" :disabled="disabled" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { AbsField } from '@abs-forms/vue';

const props = defineProps({
  form: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
});

const fields = computed(() => props.form.fields);
const fieldDefs = computed(() => [...fields.value.values().map(f => f.schema)]);
const activeTab = ref(0);
</script>
```

---

## Custom Field Types (Widgets)

To add a new widget type:

### Step 1: Define the type in your schema

```ts
const schema = {
  fields: [
    { name: 'color', widget: 'color', label: 'Pick Color' },
  ],
};
```

### Step 2: Create a widget component

Widgets are **pure input elements** — no labels, help text, or errors.

```vue
<!-- AbsColor.vue -->
<template>
  <input
    type="color"
    :id="`abs-field-${field.name}`"
    :value="modelValue"
    :disabled="disabled"
    class="abs-input h-10 p-1"
    @input="$emit('update:modelValue', $event.target.value)"
    @blur="$emit('blur')"
  />
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '#000000' },
  field: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  errors: { type: Array, default: () => [] },
});

defineEmits(['update:modelValue', 'blur']);
</script>
```

### Step 3: Register the widget

```ts
import { registry } from '@abs-forms/core';
import AbsColor from './components/AbsColor.vue';

registry.registerWidget('color', AbsColor);
```

### Step 4: Use in schema

```ts
const schema = {
  fields: [
    { name: 'color', widget: 'color', label: 'Pick Color' },
  ],
};
```

AbsField will now resolve `widget: 'color'` to your `AbsColor` component.

---

## Custom Validators

### Inline Validator

```ts
const schema = {
  fields: [
    {
      name: 'password',
      widget: 'text',
      validate: (value) => {
        if (typeof value === 'string' && value.length < 8) {
          return 'Password must be at least 8 characters';
        }
        return undefined;
      },
    },
  ],
};
```

### Mandatory Fields

Use `mandatory: true` for required field validation:

```ts
const schema = {
  fields: [
    { name: 'name', widget: 'text', mandatory: true },
  ],
};
```

The framework automatically adds a "Required" error if the value is empty, null, or undefined.

### Cross-Field Validation

Validators receive the full form data as second argument:

```ts
const schema = {
  fields: [
    { name: 'password', widget: 'text' },
    {
      name: 'confirmPassword',
      widget: 'text',
      validate: (value, data) => {
        if (value !== data.password) {
          return 'Passwords do not match';
        }
        return undefined;
      },
    },
  ],
};
```

---

## Custom Value Transforms

Transforms convert values between form storage and widget display.

### Example: Date formatting

```ts
const schema = {
  fields: [
    {
      name: 'birthDate',
      widget: 'date',
      transform: {
        onRead: (value) => {
          if (typeof value === 'string') {
            return value.split('T')[0];
          }
          return value;
        },
        onWrite: (value) => {
          if (typeof value === 'string') {
            return new Date(value).toISOString();
          }
          return value;
        },
      },
    },
  ],
};
```

### Example: Trim string

```ts
const schema = {
  fields: [
    {
      name: 'name',
      widget: 'text',
      transform: {
        onWrite: (value) => typeof value === 'string' ? value.trim() : value,
      },
    },
  ],
};
```

---

## Theme Customization

### Centralized Widget Styles

All widget CSS classes are defined in `tailwind/theme.ts`. This includes:

- `inputBase` / `textareaBase` / `selectBase` — base classes for each widget type
- `inputDefault` / `inputError` / `inputDisabled` / `inputReadonly` — state classes
- `checkboxBase` / `radioBase` — checkbox/radio base classes
- `getInputClasses()` / `getTextareaClasses()` / `getSelectClasses()` / `getCheckboxClasses()` / `getRadioClasses()` — class generator functions

Override these by importing and using your own values, or by extending the Tailwind config.

### Button Theme

Button colors, variants, and sizes are in `theme.ts`:

```ts
import { getButtonClasses } from '@abs-forms/tailwind';

// Returns full Tailwind class string
const classes = getButtonClasses('primary', 'solid', 'md');
```

### Overriding Widget Styles via Tailwind Config

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        abs: {
          primary: '#your-color',
          error: '#your-error-color',
        },
      },
    },
  },
};
```

### Custom CSS Classes

Override the default widget classes by providing your own CSS:

```css
@layer components {
  .abs-label {
    @apply block text-sm font-bold text-gray-800 mb-2;
  }
}
```

### Size Presets

Map `ThemeSize` to custom Tailwind classes in `tailwind/theme.ts`:

```ts
export const themeSizes = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-2 text-sm',
  lg: 'px-4 py-3 text-base',
};
```

---

## Widget Registry

The widget registry maps `widget` string identifiers to Vue components.

### Registering Widgets

```ts
import { registry } from '@abs-forms/core';

registry.registerWidget('myType', MyComponent);
```

### Overriding Default Widgets

```ts
import { registry } from '@abs-forms/core';
import CustomInput from './CustomInput.vue';

// Override the default text input
registry.registerWidget('text', CustomInput);
```

### Listing Registered Widgets

```ts
import { registry } from '@abs-forms/core';

console.log(registry.getWidgets());
// { text: Component, number: Component, ... }
```

---

## Plugin System

### Using AbsTailwindPlugin

The Tailwind plugin registers all widgets, layouts, and global components:

```ts
import { createApp } from 'vue';
import App from './App.vue';
import { AbsTailwindPlugin } from '@abs-forms/tailwind';
import '@abs-forms/tailwind/base.css';

const app = createApp(App);
app.use(AbsTailwindPlugin);
app.mount('#app');
```

This registers:
- All widget components (text, number, email, etc.)
- The `row` layout (`AbsRowsLayout`)
- Global `AbsForm` and `AbsField` components

### Adding Custom Widgets After Plugin

```ts
import { registry } from '@abs-forms/core';
import AbsColor from './components/AbsColor.vue';

registry.registerWidget('color', AbsColor);
```

---

## Integrating Third-Party UI Libraries

The `@abs-forms/nuxtui` package demonstrates the pattern for wrapping an existing UI library (Nuxt UI v4) as abs-forms widgets.

### Widget Component Pattern

Each widget accepts the standard contract and delegates rendering to the third-party component:

```vue
<template>
  <UInput
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="$emit('update:modelValue', $event)"
    @blur="$emit('blur')"
  />
</template>

<script setup lang="ts">
defineProps<{
  modelValue?: unknown;
  field: FormFieldSchema;
  disabled?: boolean;
  readonly?: boolean;
  errors?: string[];
}>();
defineEmits<{ 'update:modelValue': [value: unknown]; blur: [] }>();
</script>
```

The key requirements for a wrapping widget:
1. Accept `{ modelValue, field, disabled, readonly, errors }` props
2. Emit `update:modelValue` and `blur` events
3. Map any library-specific types (e.g., `CalendarDate` for `UInputDate`) via computed properties
4. Use the `field.attrs` passthrough for extra HTML/component attributes

### Using Existing Layouts with Different Widget Libraries

Layouts (like `AbsRowsLayout`) are decoupled from widgets. You can reuse the same layout with different widget libraries by registering the appropriate widgets:

```ts
// Register tailwind widgets with existing layout
import { registry } from '@abs-forms/core';
import { AbsRowsLayout } from '@abs-forms/tailwind';
import AbsInput from './my-custom-input.vue';

registry.registerLayout('row', AbsRowsLayout);
registry.registerWidget('text', AbsInput);
```

The `@abs-forms/nuxtui` package does exactly this — it reuses the `AbsRowsLayout` pattern while replacing the widget implementations with Nuxt UI components.
