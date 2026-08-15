# Getting Started

## Prerequisites

- Node.js >= 18
- Vue 3.x
- Tailwind CSS 3.x (for styled widgets)

## Installation

```bash
# Install core library
npm install @abs-forms/core

# Install Vue adapter
npm install @abs-forms/vue

# Install Tailwind widgets (for plain Vue apps)
npm install @abs-forms/tailwind

# OR install Nuxt UI widgets (for Nuxt apps)
npm install @abs-forms/nuxtui @nuxt/ui @internationalized/date
```

## Setup

### 1. Import Tailwind CSS

In your main CSS file:

```css
@import '@abs-forms/tailwind/base.css';
```

Or in your `tailwind.config.js`:

```js
module.exports = {
  content: [
    './src/**/*.{vue,js,ts}',
    './node_modules/@abs-forms/tailwind/**/*.css',
  ],
};
```

### 2. Register the Tailwind Plugin

In your `main.ts`:

```ts
import { createApp } from 'vue';
import App from './App.vue';
import { AbsTailwindPlugin } from '@abs-forms/tailwind';
import '@abs-forms/tailwind/base.css';

const app = createApp(App);
app.use(AbsTailwindPlugin);
app.mount('#app');
```

The `AbsTailwindPlugin` registers:
- All widget components (text, number, email, password, url, phone, select, textarea, checkbox, radio, date)
- The `row` layout (`AbsRowsLayout`)
- Global `AbsForm` and `AbsField` components

### Nuxt Setup (Alternative)

For Nuxt 4 + `@nuxt/ui` v4 projects, use `@abs-forms/nuxtui` instead:

#### 1. Install dependencies

```bash
npm install @abs-forms/nuxtui @nuxt/ui @internationalized/date
```

#### 2. Configure `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@abs-forms/nuxtui'],
  // For local development, use a relative path:
  // modules: ['@nuxt/ui', '../abs-forms/nuxtui/src/module'],
});
```

No plugin import or `registerWidget()` calls needed — the Nuxt module auto-registers all widgets and layouts via a runtime plugin.

#### 3. Use in a page

```vue
<template>
  <AbsForm :schema="schema" v-model="data" @submit="handleSubmit" />
</template>

<script setup>
import { ref } from 'vue';

const schema = {
  fields: [
    { name: 'name', label: 'Full Name', widget: 'text', mandatory: true },
    { name: 'email', label: 'Email', widget: 'text' },
    { name: 'birthDate', label: 'Birth Date', widget: 'date' },
    { name: 'role', label: 'Role', widget: 'select', options: [
      { label: 'Admin', value: 'admin' },
      { label: 'User', value: 'user' },
    ]},
  ],
  buttons: [
    { id: 'submit', label: 'Save', signal: 'save', position: 'primary', color: 'primary' },
  ],
};

const data = ref({});

function handleSubmit(formData) {
  console.log('Submitted:', formData);
}
</script>
```

### 3. Use in a Component

```vue
<template>
  <AbsForm :schema="schema" v-model="data" @submit="handleSubmit" />
</template>

<script setup>
import { ref } from 'vue';

const schema = {
  fields: [
    { name: 'name', label: 'Full Name', widget: 'text' },
    { name: 'email', label: 'Email', widget: 'text' },
  ],
  buttons: [
    { id: 'submit', label: 'Save', signal: 'save', position: 'primary', color: 'primary' },
  ],
};

const data = ref({});

function handleSubmit(formData) {
  console.log('Submitted:', formData);
}
</script>
```

---

## Example: Complete Form

```vue
<template>
  <AbsForm
    :schema="schema"
    v-model="formData"
    @submit="onSubmit"
    @error="onError"
    layout="row"
  />
</template>

<script setup>
import { ref } from 'vue';

const schema = {
  fields: [
    {
      name: 'firstName',
      label: 'First Name',
      widget: 'text',
      mandatory: true,
      colSpan: 6,
    },
    {
      name: 'lastName',
      label: 'Last Name',
      widget: 'text',
      mandatory: true,
      colSpan: 6,
    },
    {
      name: 'email',
      label: 'Email',
      widget: 'text',
      colSpan: 6,
      validate: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(value))) {
          return 'Email is invalid';
        }
        return undefined;
      },
    },
    {
      name: 'age',
      label: 'Age',
      widget: 'number',
      colSpan: 6,
      widgetOptions: { positive: true, integer: true },
    },
    {
      name: 'role',
      label: 'Role',
      widget: 'select',
      colSpan: 6,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
        { label: 'Guest', value: 'guest' },
      ],
    },
    {
      name: 'bio',
      label: 'Biography',
      widget: 'textarea',
      colSpan: 12,
      widgetOptions: { rows: 4 },
    },
    {
      name: 'subscribe',
      label: 'Subscribe to newsletter',
      widget: 'checkbox',
      colSpan: 12,
    },
  ],
  buttons: [
    { id: 'submit', label: 'Save', signal: 'save', position: 'primary', color: 'primary', icon: 'i-fa-disk-save' },
    { id: 'cancel', label: 'Cancel', signal: 'cancel', position: 'secondary' },
  ],
};

const formData = ref({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@doe.com',
  age: 24,
});

function onSubmit(data) {
  alert('Form submitted!\n' + JSON.stringify(data, null, 2));
}

function onError(errors) {
  console.error('Validation errors:', errors);
}
</script>
```

---

## Example: Auto-Submit to API

```vue
<template>
  <AbsForm
    :schema="schema"
    v-model="data"
    action="/api/users"
    method="post"
  />
</template>

<script setup>
import { ref } from 'vue';

const schema = {
  fields: [
    { name: 'name', label: 'Name', widget: 'text' },
    { name: 'email', label: 'Email', widget: 'text' },
  ],
  buttons: [
    { id: 'submit', label: 'Create User', signal: 'save', position: 'primary', color: 'primary' },
  ],
};

const data = ref({});
</script>
```

When `action` is set, the form automatically POSTs JSON to `/api/users` on valid submission.

---

## Example: Conditional Fields

```vue
<script setup>
const schema = {
  fields: [
    {
      name: 'hasAddress',
      label: 'Do you have an address?',
      widget: 'checkbox',
      colSpan: 12,
    },
    {
      name: 'address',
      label: 'Address',
      widget: 'text',
      colSpan: 12,
      show: (value, formValues) => formValues.hasAddress === true,
    },
  ],
};
</script>
```

The `address` field only appears when `hasAddress` is checked.

---

## Example: Dynamic Options

```vue
<script setup>
const schema = {
  fields: [
    {
      name: 'country',
      label: 'Country',
      widget: 'select',
      colSpan: 6,
      options: async () => {
        const res = await fetch('/api/countries');
        return res.json(); // returns FieldOption[]
      },
    },
  ],
};
</script>
```

Options can be a function that returns a promise of `FieldOption[]`.

---

## Example: Cross-Field Validation

```vue
<script setup>
const schema = {
  fields: [
    { name: 'password', label: 'Password', widget: 'text', colSpan: 6 },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      widget: 'text',
      colSpan: 6,
      validate: (value, data) => {
        if (value !== data.password) {
          return 'Passwords do not match';
        }
        return undefined;
      },
    },
  ],
};
</script>
```

Validators receive the full form data as the second argument.

---

## Example: Handling Button Signals

```vue
<template>
  <AbsForm
    :schema="schema"
    v-model="data"
    @submit="onSubmit"
    @signal="onSignal"
  />
</template>

<script setup>
import { ref } from 'vue';

const schema = {
  fields: [
    { name: 'name', label: 'Name', widget: 'text' },
  ],
  buttons: [
    { id: 'save', label: 'Save', signal: 'save', position: 'primary', color: 'primary' },
    { id: 'draft', label: 'Save as Draft', signal: 'draft', position: 'secondary' },
    { id: 'cancel', label: 'Cancel', signal: 'cancel', position: 'left' },
  ],
};

const data = ref({});

function onSubmit(data) {
  console.log('Form valid, submitted:', data);
}

function onSignal(signal) {
  switch (signal) {
    case 'save':
      console.log('Save clicked');
      break;
    case 'draft':
      console.log('Save as draft clicked');
      break;
    case 'cancel':
      console.log('Cancel clicked');
      break;
  }
}
</script>
```

---

## Next Steps

- See [Component Reference](./components.md) for all component props and emits
- See [Extensibility Guide](./extensibility.md) for custom layouts, widgets, and validators
- See [Types Reference](./types.md) for complete TypeScript types
