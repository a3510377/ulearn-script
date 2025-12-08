type DeepSize = 3;

export type ChangeListener<T, P extends Path<T> = Path<T>> = (
  path: P,
  value: PartialPathValue<T, P>,
  oldValue: PartialPathValue<T, P>
) => void;

type PrimitiveValue = string | number | symbol | boolean;
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export type NestedState<Depth extends number> = Depth extends 0
  ? PrimitiveValue
  : Record<string, PrimitiveValue | NestedState<Prev[Depth]>>;

export type BaseStateType = NestedState<DeepSize>;

export type Path<T, D extends number = 3> = [D] extends [0]
  ? []
  : T extends PrimitiveValue
  ? []
  : {
      [K in Extract<keyof T, PrimitiveValue>]:
        | [K]
        | [K, ...Path<T[K], Prev[D]>];
    }[Extract<keyof T, PrimitiveValue>];

export type PartialPathValue<T, P extends any[]> = P extends [
  infer K,
  ...infer R
]
  ? K extends keyof T
    ? R extends []
      ? T[K]
      : PartialPathValue<T[K], Extract<R, any[]>>
    : never
  : T;

export const getDeep = <T, P extends Path<T>>(
  obj: T,
  path: P
): PartialPathValue<T, P> => {
  if (path.length === 0) return obj as PartialPathValue<T, P>;

  const [head, ...rest] = path;
  if (!obj || (head && obj && typeof obj === 'object' && !(head in obj))) {
    return undefined as PartialPathValue<T, P>;
  }

  return getDeep(
    obj[head as keyof T] as T,
    rest as Path<T>
  ) as PartialPathValue<T, P>;
};

export const setDeep = <T, P extends Path<T>>(
  obj: T,
  path: P,
  value: PartialPathValue<T, P>
) => {
  type Tmp = Record<string | number | symbol, unknown>;
  let curr: unknown = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (!(key in (curr as Tmp))) {
      (curr as Tmp)[key] = {};
    }
    curr = (curr as Tmp)[key];
  }
  (curr as Tmp)[path[path.length - 1]] = value;
};

export class BaseState<T extends BaseStateType> {
  private _state: T;
  private _initialState: T;
  private _listeners: Map<string, ChangeListener<T>[]> = new Map();

  constructor(initialState: T) {
    this._state = { ...initialState };
    this._initialState = { ...initialState };
  }

  get(): T;
  get<P extends Path<T>>(path: P): PartialPathValue<T, P>;
  get(path?: Path<T>) {
    if (!path) return Object.freeze({ ...this._state });

    return getDeep(this._state, path);
  }

  set<P extends Path<T>>(
    path: P,
    value: PartialPathValue<T, P>,
    options?: { skipEmit?: boolean }
  ): this;
  set(value: Partial<T>): this;
  set(pathOrValue: any, value?: any, options?: { skipEmit?: boolean }) {
    if (value !== undefined) {
      this._updateKey(pathOrValue, value, options);
    } else if (typeof pathOrValue === 'object') {
      for (const k of Object.keys(pathOrValue) as (keyof T)[]) {
        this._updateKey([k] as Path<T>, pathOrValue[k]!, options);
      }
    } else {
      throw new Error('Invalid arguments for set()');
    }
    return this;
  }

  protected _updateKey<P extends Path<T>>(
    path: P,
    newValue: PartialPathValue<T, P>,
    options?: { skipEmit?: boolean }
  ) {
    const oldValue = getDeep(this._state, path);
    if (oldValue !== newValue) {
      setDeep(this._state, path, newValue);

      if (options?.skipEmit !== true) {
        this._emit(path, newValue, oldValue);
      }
    }
  }

  protected _emit<P extends Path<T>>(
    path: P,
    value: PartialPathValue<T, P>,
    oldValue: PartialPathValue<T, P>
  ) {
    const key = path.join('.');
    const fns = this._listeners.get(key) ?? [];

    for (const fn of fns) {
      fn(path, value, oldValue);
    }
  }

  on<P extends Path<T>>(path: P, fn: ChangeListener<T, P>): this {
    const key = (path as (string | number)[]).join('.');
    const arr = this._listeners.get(key) ?? [];

    arr.push(fn as ChangeListener<T>);
    this._listeners.set(key, arr);

    return this;
  }

  off<P extends Path<T>>(path: P, fn: ChangeListener<T, P>): this {
    const key = (path as (string | number)[]).join('.');
    const arr = this._listeners.get(key);
    if (arr) {
      const index = arr.lastIndexOf(fn as ChangeListener<T>);
      if (index >= 0) arr.splice(index, 1);
    }

    return this;
  }

  async update<P extends Path<T>>(
    path: P,
    updater: (
      current: PartialPathValue<T, P>
    ) => PartialPathValue<T, P> | Promise<PartialPathValue<T, P>>
  ): Promise<this> {
    const oldValue = getDeep(this._state, path);
    const result = updater(oldValue);

    const applyNewValue = (newValue: PartialPathValue<T, P>) => {
      this._updateKey(path, newValue);
      return this;
    };

    if (
      result instanceof Promise ||
      (result && typeof (result as any).then === 'function')
    ) {
      return (result as Promise<PartialPathValue<T, P>>).then(applyNewValue);
    }

    return applyNewValue(result as PartialPathValue<T, P>);
  }

  reset(): this {
    this._state = { ...this._initialState };
    return this;
  }

  has<P extends Path<T>>(path: P) {
    return getDeep(this._state, path) !== undefined;
  }

  clearListeners() {
    this._listeners.clear();
    return this;
  }
}

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
    const data = await this._storage.getItem(this._storageKey);
    if (data) super.set(JSON.parse(data) as Partial<T>);
  }

  protected _updateKey<P extends Path<T>>(
    path: P,
    newValue: PartialPathValue<T, P>
  ) {
    super._updateKey(path, newValue);
    void this._save();
  }

  private async _save() {
    const data = JSON.stringify(this.get());
    await this._storage.setItem(this._storageKey, data);
  }
}

export default BaseState;
