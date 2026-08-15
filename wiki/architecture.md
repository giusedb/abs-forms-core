# Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Vue / Nuxt Application                 │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              @abs-forms/vue                        │  │
│  │                                                    │  │
│  │  AbsForm ──► useForm() ──► Form (core)            │  │
│  │    │    (:schema + v-model)      │                 │  │
│  │    ├──► Layout Component         ├── getData()     │  │
│  │    │      │  (e.g. AbsRowsLayout)├── validate()   │  │
│  │    │      │                      ├── submit()      │  │
│  │    │      │  renders:            └── reset()       │  │
│  │    │      │  - label (abs-label)                  │  │
│  │    │      │  - AbsField                           │  │
│  │    │      │    └──► widget (registry)              │  │
│  │    │      │  - help text (abs-help)                │  │
│  │    │      │  - errors (abs-error)                  │  │
│  │    │      │                                       │  │
│  │    │      └──► AbsField                           │  │
│  │    │             │  (widget dispatcher)            │  │
│  │    │             ├── AbsInput (text/number/etc.)   │  │
│  │    │             ├── AbsSelect                     │  │
│  │    │             ├── AbsTextarea                   │  │
│  │    │             ├── AbsCheckbox                   │  │
│  │    │             ├── AbsRadio                      │  │
│  │    │             └── AbsDate                       │  │
│  │    │                   │                          │  │
│  │    │              useField()                       │  │
│  │    └─────────────► Field (core)                    │  │
│  └───────────────────────────────────────────────────┘  │
│                          │                              │
│  ┌───────────────────────▼──────────────────────────┐  │
│  │    @abs-forms/tailwind  OR  @abs-forms/nuxtui     │  │
│  │                                                   │  │
│  │  Widget components (pure inputs):                 │  │
│  │  AbsInput  AbsSelect  AbsTextarea  AbsCheckbox    │  │
│  │  AbsRadio  AbsDate                                │  │
│  │                                                   │  │
│  │  Layout components:                               │  │
│  │  AbsRowsLayout (renders label/help/errors)        │  │
│  │                                                   │  │
│  │  Theme / UI library:                              │  │
│  │  tailwind: theme.ts + base.css (CSS classes)      │  │
│  │  nuxtui: wraps @nuxt/ui components (UInput, etc.) │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Responsibility Matrix

| Concern | Core | Vue | Tailwind | Nuxtui |
|---------|------|-----|----------|--------|
| Data storage | Form.data | reactive wrapper | - | - |
| Validation logic | Field.validate() | useField() trigger | - | - |
| Mandatory handling | Field + required validator | - | - | - |
| Field visibility | Field.computeVisible() | v-if in AbsField | - | - |
| Field disabled state | Field.computeDisabled() | computed binding | - | - |
| Field readonly state | Field.computeReadonly() | computed binding | - | - |
| Options resolution | Field.computeOptions() | computed binding | - | - |
| Layout / grid | - | Layout component | grid CSS classes | reuses AbsRowsLayout |
| Label rendering | - | Layout renders label | abs-label class | abs-label class |
| Help text rendering | - | Layout renders help | abs-help class | abs-help class |
| Validation display | - | Layout renders errors | abs-error class | abs-error class |
| Widget styling | - | - | Widget class generators (theme.ts) | delegates to @nuxt/ui |
| Button styling | - | AbsForm.getButtonClasses() | theme.ts (available) | delegates to @nuxt/ui |
| Submit handling | Form.submit() | emit / AJAX POST | - | - |
| Button signals | - | emit signal event | - | - |
| v-model binding | - | emit update:modelValue | - | - |
| Transforms | Field.applyRead/Write() | - | - | - |
| Nuxt module setup | - | - | - | defineNuxtModule → addPlugin |
| UI library integration | - | - | - | wraps UInput/USelect/UInputDate/UInputNumber/UCheckbox/URadio |

## Design Principles

### Layout owns label/help/errors

The layout component (e.g. `AbsRowsLayout`) is responsible for rendering:
- The field `<label>` element
- The field widget via `<AbsField>`
- Help text (`field.help`)
- Validation errors

Widget components are **pure input elements** — they render only the `<input>`, `<select>`, or `<textarea>`. This gives layouts full control over field arrangement (label-above, label-beside, horizontal, tabs, etc.).

### WidgetRegistry (core)

The `WidgetRegistry` in core provides framework-agnostic widget and layout registration. Framework adapters (Vue) and theme packages (Tailwind) register components into the shared registry:

```
core/WidgetRegistry.ts  ← framework-agnostic registry
  ↑ registerWidget()      ↑ registerLayout()
  │                       │
vue plugin               tailwind plugin
                         │
                     nuxtui plugin (Nuxt module auto-registers)
```

## Data Flow

> **Nuxt note**: When using `@abs-forms/nuxtui`, the Nuxt module auto-registers all widgets and layouts into the `WidgetRegistry` via a runtime plugin. No manual `registerWidget()` calls are needed.

### 1. User types in a field

```
Tailwind widget (input event)
  → Vue AbsField (emits 'update:modelValue')
    → useField.setValue()
      → core Field.setValue() (applies onWrite transform)
        → core Form.setValue(path, value) (deepSet)
          → Form marks dirty, stores new value
```

### 2. User blurs a field

```
Tailwind widget (blur event)
  → Vue AbsField (emits 'blur')
    → useField.validate()
      → core Field.validate(formValues)
        → runs validate function + mandatory check
          → returns string[] of errors
            → reactive error state updates
              → Layout re-renders error display
```

### 3. User submits form

```
AbsForm (submit event)
  → useForm.submit()
    → core Form.validate() (runs ALL field validators + mandatory checks)
      → if valid:
        → core Form.config.onSubmit(data) OR
        → POST JSON to Form.config.action URL
      → if invalid:
        → emit 'error' with error map
          → all error states update
            → Layout re-renders error displays
```

### 4. Button signal

```
AbsForm button click
  → AbsForm emits 'signal' event with button.signal value
    → parent handles signal (e.g., 'save', 'cancel')
```

### 5. v-model binding

```
External data changes
  → Vue watch on modelValue prop
    → useForm.setData(newData)
      → core Form.setData(data)
        → all Field states updated
          → computed values re-evaluate
            → Tailwind widgets re-render

AbsForm internal changes
  → core Form.data changes
    → useField reactive state updates
      → emit 'update:modelValue'
        → v-model parent updates
```

## Validation Flow

```
                    ┌─────────────────┐
                    │   Form.submit()  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Form.validate() │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───────┐ ┌───▼──────┐ ┌────▼─────┐
     │ Field.validate()│ │ Field... │ │ Field... │
     │  (all fields)  │ │          │ │          │
     └────────┬───────┘ └──────────┘ └──────────┘
              │
     ┌────────▼────────┐
     │ validate fn +   │
     │ mandatory check │
     └────────┬────────┘
              │
     ┌────────▼────────┐
     │ string[] errors │
     └─────────────────┘

Separately, on blur:
     ┌──────────────┐
     │ Widget blur  │
     └──────┬───────┘
            │
     ┌──────▼───────┐
     │ Field.validate│
     │ (single field)│
     └──────────────┘
```

## Reactivity Strategy

The core library is **framework-agnostic**. It uses plain objects and has no dependency on Vue or any reactivity system. The `Form` and `Field` classes are stateful but not reactive.

The Vue adapter wraps the core classes with Vue 3's `reactive()` / `computed()` to make state changes trigger re-renders. This keeps the core pure and testable while providing seamless Vue integration.

```
Core (pure state)          Vue adapter (reactive wrapper)
─────────────────          ─────────────────────────────
Form.data        ◄──────►  useForm state.data (reactive)
Field.state      ◄──────►  useField state (reactive copy, synced via watch)
Field.visible    ◄──────►  computed(() => field.computeVisible(...))
Field.disabled   ◄──────►  computed(() => field.computeDisabled(...))
```

**Important**: `useField` creates a reactive **copy** of `field.state` (not a reference). When form data changes externally (via `form.setData()` from v-model or `onMounted`), the core `Field.state` updates but the reactive copy in `useField` must be explicitly synced. This is done via a `watch` on `form.getData()` that calls `syncFieldState()`. Without this, widgets would show stale data until a blur event triggers `validate()` → `syncFieldState()`.

## Layout System

Layouts are registered via the `WidgetRegistry` in core. The default layout is `AbsRowsLayout` (registered as `'row'`). Users can register custom layouts:

```ts
import { registry } from '@abs-forms/core';
import MyCustomLayout from './MyCustomLayout.vue';

registry.registerLayout('custom', MyCustomLayout);
```

Then use it in the form:

```vue
<AbsForm :schema="schema" layout="custom" />
```

The layout component receives a `form` prop (`Form` instance) and is responsible for:
1. Reading field schemas from `form.fields`
2. Arranging fields visually
3. Rendering labels, help text, and validation errors
4. Rendering `AbsField` for each field
