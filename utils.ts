export function deepGet(obj: unknown, path: string): unknown {
  if (obj == null || typeof obj !== 'object') return undefined;

  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

export function deepSet(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const keys = path.split('.');
  const result = {...obj};
  let current: Record<string, unknown> = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const next = current[key];

    if (next != null && typeof next === 'object' && !Array.isArray(next)) {
      current[key] = {...(next as Record<string, unknown>)};
    } else {
      current[key] = {};
    }

    current = current[key] as Record<string, unknown>;
  }

  current[keys[keys.length - 1]] = value;
  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function mergeOne(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const result = {...target};

  for (const key of Object.keys(source)) {
    const targetVal = result[key];
    const sourceVal = source[key];

    if (isPlainObject(targetVal) && isPlainObject(sourceVal)) {
      result[key] = mergeOne(targetVal, sourceVal);
    } else {
      result[key] = sourceVal;
    }
  }

  return result;
}

export function merge(...objects: object[]): Record<string, unknown> {
  let result: Record<string, unknown> = {};

  for (const obj of objects) {
    if (isPlainObject(obj)) {
      result = mergeOne(result, obj);
    }
  }

  return result;
}

export class Comparator {
  keys: string[];

  constructor(...keys: string[]) {
    this.keys = keys;
  }

  signature(object: any): string {
    return this.keys.map((key) => String(deepGet(object, key))).join('|');
  }

  compare(x: any, y: any): number {
    for (const key of this.keys) {
      const a = String(deepGet(x, key));
      const b = String(deepGet(y, key));
      if (a < b) return -1;
      if (a > b) return 1;
    }
    return 0;
  }

  equal(x: any, y: any): boolean {
    return this.signature(x) === this.signature(y);
  }

  indexOf(object: any, list: any[]): number {
    const sig = this.signature(object);
    for (let i = 0; i < list.length; i++) {
      if (this.signature(list[i]) === sig) return i;
    }
    return -1;
  }

  includes(object: any, list: any[]): boolean {
    return this.indexOf(object, list) >= 0;
  }
}
