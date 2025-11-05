export class BaseState<T extends BaseStateType> {
  private _state: T;
  private _initialState: T;
  private _listeners: Map<keyof T | null, ChangeListener<T>[]> = new Map();

  constructor(initialState: T) {
    this._state = { ...initialState };
    this._initialState = { ...initialState };
  }

  get(): T;
  get<K extends keyof T>(key: K): T[K];
  get(key?: keyof T) {
    if (key !== undefined) return this._state[key];
    return Object.freeze({ ...this._state });
  }

  set(value: Partial<T>): this;
  set<K extends keyof T>(key: K, value: T[K]): this;
  set(keyOrValue: keyof T | Partial<T>, value?: T[keyof T]) {
    if (keyOrValue && typeof keyOrValue === 'object') {
      for (const k of Object.keys(keyOrValue)) {
        this._updateKey(k, keyOrValue[k]!);
      }
    } else if (value !== undefined) {
      this._updateKey(keyOrValue as keyof T, value);
    } else {
      throw new Error('Invalid arguments for set()');
    }

    return this;
  }

  protected _updateKey<K extends keyof T>(key: K, newValue: T[K]) {
    const oldValue = this._state[key];
    if (newValue !== oldValue) {
      this._state[key] = newValue;
      this._emit(key, newValue, oldValue);
    }
  }

  protected _emit<K extends keyof T>(key: K, value: T[K], oldValue: T[K]) {
    const global = this._listeners.get(null) ?? [];
    const specific = this._listeners.get(key) ?? [];

    for (const fn of [...specific, ...global]) {
      try {
        fn(key, value, oldValue);
      } catch (e) {
        console.error(e);
      }
    }
  }

  on(fn: ChangeListener<T>, options?: { once?: boolean }): this;
  on(key: keyof T, fn: ChangeListener<T>, options?: { once?: boolean }): this;
  on(
    keyOrFn: keyof T | ChangeListener<T>,
    fnOrOptions?: ChangeListener<T> | { once?: boolean },
    options?: { once?: boolean }
  ) {
    let fn: ChangeListener<T>;
    let key: keyof T | null = null;
    let once = false;

    if (typeof keyOrFn === 'function') {
      fn = keyOrFn;
      once = (fnOrOptions as { once?: boolean })?.once ?? false;
    } else {
      key = keyOrFn;
      fn = fnOrOptions as ChangeListener<T>;
      once = options?.once ?? false;
    }

    if (once) {
      const originalFn = fn;
      fn = (key_, value, oldValue) => {
        originalFn(key_, value, oldValue);
        this.off(key, fn);
      };
    }

    const listeners = this._listeners.get(key) ?? [];
    listeners.push(fn);
    this._listeners.set(key, listeners);

    return this;
  }

  off(fn: ChangeListener<T>): this;
  off(key: keyof T | null, fn: ChangeListener<T>): this;
  off(keyOrFn: keyof T | ChangeListener<T> | null, fn?: ChangeListener<T>) {
    let targetFn: ChangeListener<T>;
    let key: keyof T | null = null;

    if (typeof keyOrFn === 'function') targetFn = keyOrFn;
    else {
      key = keyOrFn;
      targetFn = fn as ChangeListener<T>;
    }

    const listeners = this._listeners.get(key);
    if (listeners) {
      const index = listeners.lastIndexOf(targetFn);
      if (index !== -1) listeners.splice(index, 1);
    }

    return this;
  }

  update<K extends keyof T>(key: K, updater: (current: T[K]) => T[K]): this;
  update<K extends keyof T>(
    key: K,
    updater: (current: T[K]) => Promise<T[K]>
  ): Promise<this>;
  update<K extends keyof T>(
    key: K,
    updater: (current: T[K]) => T[K] | Promise<T[K]>
  ): this | Promise<this> {
    const oldValue = this._state[key];
    const result = updater(oldValue);

    const applyNewValue = (newValue: T[K]) => {
      this._updateKey(key, newValue);
      return this;
    };

    if (
      result instanceof Promise ||
      // for safe handling thenable objects
      (result && typeof (result as any).then === 'function')
    ) {
      return (result as Promise<T[K]>).then(applyNewValue);
    }

    return applyNewValue(result as T[K]);
  }

  reset(): this {
    this._state = { ...this._initialState };
    return this;
  }

  has(key: keyof T) {
    return key in this._state;
  }

  clearListeners() {
    this._listeners.clear();
    return this;
  }
}

export type ChangeListener<T, K extends keyof T = keyof T> = (
  key: K,
  value: T[K],
  oldValue: T[K]
) => void;

export type BaseStateType<Value = string | number | boolean> = Record<
  PropertyKey,
  Value
>;

export interface PersistentStateOptions {
  storage: {
    getItem: (key: string) => string | null | Promise<string | null>;
    setItem: (key: string, value: string) => void | Promise<void>;
  };
  storageKey: string;
}

export class PersistentState<T extends BaseStateType> extends BaseState<T> {
  private readonly _storage: PersistentStateOptions['storage'];
  private readonly _storageKey: string;

  constructor(initialState: T, options: PersistentStateOptions) {
    super(initialState);
    this._storage = options.storage;
    this._storageKey = options.storageKey;
  }

  async init() {
    const maybeLoad = this._storage.getItem(this._storageKey);
    if (maybeLoad instanceof Promise) {
      await maybeLoad.then((data) => {
        if (data) {
          super.set(JSON.parse(data) as Partial<T>);
        }
      });
    } else if (maybeLoad) {
      super.set(JSON.parse(maybeLoad) as Partial<T>);
    }
  }

  protected _updateKey<K extends keyof T>(key: K, newValue: T[K]) {
    super._updateKey(key, newValue);
    void this._save();
  }

  private async _save() {
    const data = JSON.stringify(this.get());
    await this._storage.setItem(this._storageKey, data);
  }
}

export default BaseState;
