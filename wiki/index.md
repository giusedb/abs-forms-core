# Abs-Forms Wiki

Schema-driven form ecosystem for Vue 3 applications. A 4-layer architecture: framework-agnostic core, Vue 3 adapter, Tailwind CSS widgets, and Nuxt UI integration.

## Table of Contents

- [Architecture Overview](./architecture.md) - System design, data flow, responsibility matrix
- [Types & Interfaces](./types.md) - Complete reference for all TypeScript types
- [Implementation Guide](./implementation-guide.md) - Step-by-step build plan and file structure
- [Component Reference](./components.md) - Vue component props, emits, and usage
- [Extensibility Guide](./extensibility.md) - Custom layouts, widgets, and themes
- [Getting Started](./getting-started.md) - Installation, setup, and first form

## Libraries

| Package | Directory | Purpose |
|---------|-----------|---------|
| `@abs-forms/core` | `core/` | Framework-agnostic Form, Field, validation, WidgetRegistry, types, utils |
| `@abs-forms/vue` | `vue/` | Vue 3 Composition API adapter, AbsForm, AbsField |
| `@abs-forms/tailwind` | `tailwind/` | Tailwind CSS widgets, layouts, theme, dark mode |
| `@abs-forms/nuxtui` | `nuxtui/` | Nuxt UI integration: widgets using UInput/USelect/UInputDate, Nuxt module |

## Quick Example

```vue
<template>
  <AbsForm :schema="schema" v-model="data" @submit="handleSubmit" />
</template>

<script setup>
import { ref } from 'vue';

const schema = {
  fields: [
    { name: 'firstName', label: 'First Name', widget: 'text', mandatory: true, colSpan: 6 },
    { name: 'lastName', label: 'Last Name', widget: 'text', mandatory: true, colSpan: 6 },
    {
      name: 'email',
      label: 'Email',
      widget: 'text',
      colSpan: 6,
      validate: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) return 'Email is invalid';
        return undefined;
      },
    },
    { name: 'age', label: 'Age', widget: 'number', colSpan: 6, widgetOptions: { positive: true, integer: true } },
  ],
  buttons: [
    { id: 'submit', label: 'Save', signal: 'save', position: 'primary', color: 'primary', icon: 'i-fa-disk-save' },
  ],
};

const data = ref({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@doe.com',
  age: 24,
});

function handleSubmit(formData) {
  console.log('Submitted:', formData);
}
</script>
```

## Key Design Decisions

- **Layout owns labels/help/errors**: Widget components are pure input elements; layouts handle labels, help text, and error display
- **Centralized CSS**: All widget styles are in `theme.ts` with dark mode variants; widgets use class generator functions
- **WidgetRegistry**: Framework-agnostic component registration in core; adapters register into the shared registry
- **Form instance**: Layouts receive the `Form` instance directly and derive fields from `form.fields`
- **Nuxt UI integration**: `@abs-forms/nuxtui` wraps Nuxt UI components (UInput, USelect, UInputDate, etc.) as abs-forms widgets, registered via a Nuxt module
