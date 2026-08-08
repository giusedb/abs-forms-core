export class WidgetRegistry {
  private widgets = new Map<string, any>();
  private layouts = new Map<string, any>();

  registerWidget(name: string, component: any): void {
    this.widgets.set(name, component);
  }

  getWidget(name: string): any | undefined {
    return this.widgets.get(name);
  }

  getWidgets(): Record<string, any> {
    return Object.fromEntries(this.widgets);
  }

  registerLayout(name: string, component: any): void {
    this.layouts.set(name, component);
  }

  getLayout(name: string): any | undefined {
    return this.layouts.get(name);
  }

  getLayouts(): Record<string, any> {
    return Object.fromEntries(this.layouts);
  }
}

export const registry = new WidgetRegistry();
