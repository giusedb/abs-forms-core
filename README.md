# @abs-forms/core

Framework-agnostic core library for abs-forms. Provides the schema, field registry, validation engine, and TypeScript types used by all framework adapters.

## Install

```bash
npm install @abs-forms/core
```

## What's Included

- **Form** — orchestrates fields, data, validation, and submission
- **Field** — individual field state, validation, transforms, visibility
- **WidgetRegistry** — maps widget names to components
- **Types** — `FormFieldSchema`, `FormSchema`, `FormButton`, `FieldOption`, etc.
- **Utils** — `deepGet`, `deepSet`, `merge`, `Comparator`

## Usage

This package is a dependency of the framework adapters. If you're building a form UI for a new framework (React, Svelte, etc.), use this as the foundation:

```ts
import { Form, Field, registry, type FormSchema } from '@abs-forms/core';
```

## Framework Adapters

| Adapter | Package |
|---------|---------|
| Vue 3 | [`@abs-forms/vue`](https://github.com/anthropics/abs-forms-vue) |
| React | (planned) |

## Documentation

See the [wiki](./wiki/) for architecture, types, and extensibility guides.

## License

[MIT](./LICENSE)
