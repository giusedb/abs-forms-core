import type {FormFieldSchema, FormConfig, FormState, FormSchema, FormButton} from './types';
import {Field} from './Field';
import {deepGet, deepSet} from './utils';

export class Form {
  config: FormConfig;
  fields: Map<string, Field>;
  data: Record<string, unknown>;
  buttons: FormButton[];
  private submitting = false;
  private changeListeners = new Map<string, () => void>();

  constructor(schema: FormSchema, config?: FormConfig) {
    this.config = config ?? {};
    this.fields = new Map();
    this.data = {};
    this.buttons = schema.buttons ?? [];

    for (const fieldDef of schema.fields) {
      const field = new Field(fieldDef);
      field.form = this;
      this.fields.set(fieldDef.name, field);
      this.data[fieldDef.name] = field.state.value;
    }
  }

  onDataChange(fieldName: string, callback: () => void): () => void {
    this.changeListeners.set(fieldName, callback);
    return () => { this.changeListeners.delete(fieldName); };
  }

  private notifyFieldChange(fieldName: string): void {
    const listener = this.changeListeners.get(fieldName);
    if (listener) listener();
  }

  notifyFieldChanged(_fieldName: string): void {
    const allValues = this.getData();
    for (const [, field] of this.fields) {
      field.state.visible = field.computeVisible(allValues);
      field.state.disabled = field.computeDisabled(allValues);
      field.state.readonly = field.computeReadonly(allValues);
      field.state.options = field.computeOptions(allValues);
    }
  }

  getData(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [name, field] of this.fields) {
      result[name] = field.state.value;
    }
    return result;
  }

  setData(data: Record<string, unknown>): void {
    this.data = {...data};
    for (const [name, field] of this.fields) {
      const value = deepGet(data, name);
      field.setValue(value);
      this.notifyFieldChange(name);
    }
    this.notifyFieldChanged('setData');
  }

  getValue(path: string): unknown {
    return deepGet(this.data, path);
  }

  setValue(path: string, value: unknown): void {
    this.data = deepSet(this.data, path, value);
    const field = this.fields.get(path);
    if (field) {
      field.setValue(value);
      this.notifyFieldChange(path);
    }
  }

  validate(): Record<string, string[]> {
    const allValues = this.getData();
    const errors: Record<string, string[]> = {};

    for (const [name, field] of this.fields) {
      const fieldErrors = field.validate(allValues);
      if (fieldErrors.length > 0) {
        errors[name] = fieldErrors;
      }
    }

    return errors;
  }

  validateField(path: string): string[] {
    const field = this.fields.get(path);
    if (!field) return [];
    return field.validate(this.getData());
  }

  async submit(): Promise<void> {
    const errors = this.validate();
    const hasErrors = Object.keys(errors).length > 0;

    if (hasErrors) {
      this.config.onError?.(errors);
      return;
    }

    if (this.config.action) {
      this.submitting = true;
      try {
        const response = await fetch(this.config.action, {
          method: this.config.method?.toUpperCase() ?? 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(this.getData()),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
      } finally {
        this.submitting = false;
      }
    }

    this.config.onSubmit?.(this.getData());
  }

  reset(): void {
    for (const field of this.fields.values()) {
      field.reset();
    }
    this.data = {};
    for (const [name, field] of this.fields) {
      this.data[name] = field.state.value;
      this.notifyFieldChange(name);
    }
    this.notifyFieldChanged('reset');
  }

  toJSON(): Record<string, unknown> {
    return this.getData();
  }

  getErrors(): Record<string, string[]> {
    const errors: Record<string, string[]> = {};
    for (const [name, field] of this.fields) {
      if (field.state.errors.length > 0) {
        errors[name] = [...field.state.errors];
      }
    }
    return errors;
  }

  isDirty(): boolean {
    for (const field of this.fields.values()) {
      if (field.state.dirty) return true;
    }
    return false;
  }

  isValid(): boolean {
    return Object.keys(this.validate()).length === 0;
  }
}
