# Code Style Guide

This document defines the code style for the abs-forms codebase. All code must follow these conventions.

## Vue Files

### Script Tags

- Use `<script lang="ts">` or `<script setup lang="ts">` with a **space before `>`**:

```vue
<script lang="ts" >
// ...
</script >
```

```vue
<script setup lang="ts" >
// ...
</script >
```

### Template Tags

- Use `<template >` with a **space before `>`**:

```vue
<template >
  <!-- ... -->
</template >
```

### Imports

- **No spaces inside braces**: `{defineComponent, type PropType}` not `{ defineComponent, type PropType }`
- **No spaces after `{` or before `}`**:

```ts
import {defineComponent, type PropType} from 'vue';
import type {FormFieldSchema} from '@abs-forms/core';
import {CalendarDate, CalendarDateTime, Time, toCalendarDateTime, toZoned} from '@internationalized/date';
```

### Multi-line Arguments

- Use **4-space indentation** for continuation lines in function calls and constructors:

```ts
const newDate = new Date(
    value.year,
    value.month - 1,
    value.day,
    current.getHours(),
    current.getMinutes(),
    current.getSeconds(),
    current.getMilliseconds(),
);
```

### Trailing Commas

- **Always use trailing commas** in multi-line structures (props, objects, arrays, function parameters):

```ts
props: {
  modelValue: {
    type: [Date, null] as PropType<Date | null>,
    default: null,
  },
  field: {
    type: Object as PropType<FormFieldSchema>,
    required: true,
  },
},
```

### Object Properties

- **No spaces after `{` or before `}`** in inline objects:
- **Space after `:` in property definitions**:

```ts
const typeMap: Record<string, string> = {
  text: 'text',
  number: 'number',
  email: 'email',
};
```

### Arrow Functions

- **Space before `=>`**:

```ts
(fields) => fields.filter((f) => f.visible)
```

### Type Annotations

- **No space before `:` in type annotations**:

```ts
const value: CalendarDate | null = null;
function onBlur(): void { ... }
```

## Template

### Attributes

- **One attribute per line** when component has 3+ attributes:
- **Align with first attribute**:

```vue
<UInputDate :id="`abs-field-${field.name}-date`"
            v-model="inputDateValue"
            :placeholder="field.placeholder"
            :disabled="disabled"
            :readonly="readonly"
            :highlight="hasErrors"
            v-bind="field.attrs"
            @blur="onBlur" />
```

- **Self-closing tags** end with ` />` (space before `/>`):

```vue
<UInput class="w-full"
        :id="`abs-field-${field.name}`"
        :type="inputType"
/>
```

### Template Expressions

- **No spaces inside `{{ }}`**:

```vue
{{ calendarMonthName }} {{ calendarYear }}
```

### v-if / v-for

- **Space after directive**:

```vue
<div v-if="showCalendar && popoverOpen">
<div v-for="day in ['Su', 'Mo', 'Tu']">
```

## TypeScript

### Interface Definitions

- **No spaces inside braces** in imports from same module:

```ts
import type {FormFieldSchema} from '@abs-forms/core';
```

### Function Signatures

- **Space after `:` in return types**:

```ts
function onBlur(): void {
  this.$emit('blur');
}
```

### Computed Properties

- **Getter/setter pattern** with explicit return types:

```ts
dateCalendar: {
  get(): CalendarDate | null {
    // ...
  },
  set(value: CalendarDate | null): void {
    // ...
  },
},
```

## File Structure

Each Vue component follows this order:

1. `<script lang="ts" >` or `<script setup lang="ts" >`
2. `<template >`

## Summary

| Rule | Example |
|------|---------|
| Space before `>` in tags | `<script lang="ts" >` |
| No spaces in braces | `{defineComponent}` |
| 4-space continuation indent | Function arguments |
| Trailing commas | Multi-line objects |
| One attribute per line | 3+ attributes |
| Align attributes | With first attribute |
| Self-close with space | `/>` |
