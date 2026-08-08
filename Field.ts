import type {
  FormFieldSchema,
  FieldState,
  FieldOption,
  FieldCondition,
} from './types';

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

export class Field {
  schema: FormFieldSchema;
  state: FieldState;
  form?: { notifyFieldChanged(fieldName: string): void };

  constructor(schema: FormFieldSchema, initialValue?: unknown) {
    this.schema = schema;
    const value = initialValue !== undefined ? initialValue : undefined;
    this.state = {
      value,
      initialValue: value,
      errors: [],
      touched: false,
      dirty: false,
      disabled: false,
      readonly: false,
      visible: true,
      options: [],
    };
  }

  setValue(value: unknown): void {
    const transformed = this.applyWriteTransform(value);
    this.state.value = transformed;
    this.state.dirty = transformed !== this.state.initialValue;
    this.form?.notifyFieldChanged(this.schema.name);
  }

  validate(allValues: Record<string, unknown>): string[] {
    const errors: string[] = [];

    if (this.schema.mandatory && isEmpty(this.state.value)) {
      errors.push('Required');
    }

    if (this.schema.validate) {
      const validators = Array.isArray(this.schema.validate) ? this.schema.validate : [this.schema.validate];
      validators.forEach(validator => {
        const error = validator(this.state.value, allValues);
        if (error) {
          errors.push(error);
        }
      });
    }

    this.state.errors = errors;
    return errors;
  }

  reset(): void {
    this.state.value = this.state.initialValue;
    this.state.errors = [];
    this.state.touched = false;
    this.state.dirty = false;
  }

  computeVisible(formValues: Record<string, unknown>): boolean {
    if (!this.schema.show) return true;
    return this.schema.show(this.state.value, formValues);
  }

  computeDisabled(formValues: Record<string, unknown>): boolean {
    if (typeof this.schema.disabled === 'boolean') return this.schema.disabled;
    if (typeof this.schema.disabled === 'function') return this.schema.disabled(this.state.value, formValues);
    return false;
  }

  computeReadonly(formValues: Record<string, unknown>): boolean {
    if (typeof this.schema.readonly === 'boolean') return this.schema.readonly;
    if (typeof this.schema.readonly === 'function') return this.schema.readonly(this.state.value, formValues);
    return false;
  }

  computeOptions(formValues: Record<string, unknown>): FieldOption[] {
    if (!this.schema.options) return [];
    if (Array.isArray(this.schema.options)) return this.schema.options;
    return this.schema.options(this.state.value, formValues);
  }

  applyReadTransform(value: unknown): unknown {
    if (this.schema.transform?.onRead) return this.schema.transform.onRead(value);
    return value;
  }

  applyWriteTransform(value: unknown): unknown {
    if (this.schema.transform?.onWrite) return this.schema.transform.onWrite(value);
    return value;
  }
}
