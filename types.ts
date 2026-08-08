export type ThemeColor =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark';

export type ThemeVariant = 'solid' | 'outline' | 'link' | 'ghost' | 'underline';

export type ThemeSize = 'sm' | 'md' | 'lg';

export type FormMode = 'edit' | 'view';

export type FieldValidator = (
  value: unknown,
  data: Record<string, unknown>,
) => string | undefined;

export type FieldCondition = (
  value: unknown,
  formValues: Record<string, unknown>,
) => boolean;

export interface FieldOption {
    label: string;
    value: unknown;
    description?: string;
    disable?: boolean;
}

export interface FieldTransform {
    onRead?: (value: unknown) => unknown;
    onWrite?: (value: unknown) => unknown;
}

export interface FieldState {
    value: unknown;
    initialValue: unknown;
    errors: string[];
    touched: boolean;
    dirty: boolean;
    disabled: boolean;
    readonly: boolean;
    visible: boolean;
    options: FieldOption[];
}

export interface FormFieldSchema {
    name: string;
    widget?: string;
    label?: string;
    placeholder?: string;
    help?: string;
    mandatory?: boolean;
    colSpan?: number;
    color?: ThemeColor;
    variant?: ThemeVariant;
    size?: ThemeSize;
    cssClass?: string;
    validate?: FieldValidator | FieldValidator[];
    options?: FieldOption[] | ((value: unknown, formValues: Record<string, unknown>) => FieldOption[]);
    disabled?: boolean | FieldCondition;
    readonly?: boolean | FieldCondition;
    show?: FieldCondition;
    transform?: FieldTransform;
    attrs?: Record<string, unknown>;
    meta?: Record<string, unknown>;
    widgetOptions?: Record<string, any>;
}

export interface FormButton {
    id: string;
    label: string;
    hint?: string;
    signal: string;
    icon?: string;
    color?: ThemeColor;
    variant?: ThemeVariant;
    size?: ThemeSize;
    disabled?: boolean | FieldCondition;
    visible?: boolean | FieldCondition;
    position: 'primary' | 'secondary' | 'left' | 'right';
}

export interface FormSchema {
    fields: FormFieldSchema[];
    buttons?: FormButton[];
}

export interface FormConfig {
    action?: string;
    method?: 'post' | 'put' | 'patch';
    onSubmit?: (data: Record<string, unknown>) => void | Promise<void>;
    onError?: (errors: Record<string, string[]>) => void;
    validateOnChange?: boolean;
}

export interface FormState {
    data: Record<string, unknown>;
    errors: Record<string, string[]>;
    dirty: boolean;
    submitting: boolean;
    valid: boolean;
}

export interface FieldController {
    state: FieldState;
    setValue(value: unknown): void;
    validate(): string[];
    reset(): void;
}
