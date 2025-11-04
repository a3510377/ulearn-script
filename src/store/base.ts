export abstract class BaseStore<T extends BaseStoreType> {
  protected readonly _id: string;
  private _state: T;
  protected _storeExclude: (keyof T)[];
  private _listeners: { [K in keyof T]?: Listener<T, K>[] } = {};

  constructor(id: string, initialState: T, storeExclude?: (keyof T)[]) {
    this._id = id;
    this._state = { ...initialState };
    this._storeExclude = [...(storeExclude || [])];
  }

  get(): T;
  get<K extends keyof T>(key: K): T[K];
  get(key?: keyof T) {
    if (key) return this._state[key];
    return Object.freeze({ ...this._state });
  }

  async set<K extends keyof T>(
    key: K,
    value: T[K],
    skipSave?: boolean
  ): Promise<this> {
    const oldValue = this._state[key];
    if (oldValue !== value) {
      this._state[key] = value;
      this.notify(key, oldValue);
    }

    if (!skipSave) await this.save();

    return this;
  }

  subscribe<K extends keyof T>(
    key: K,
    fn: Listener<T, K>,
    initialCall = true
  ): () => void {
    if (!this._listeners[key]) this._listeners[key] = [];
    this._listeners[key]!.push(fn);

    if (initialCall) {
      fn({ value: this._state[key], oldValue: this._state[key] });
    }

    return () => this.unsubscribe(key, fn);
  }

  unsubscribe<K extends keyof T>(key: K, fn: Listener<T, K>) {
    this._listeners[key] = this._listeners[key]?.filter((l) => l !== fn);
  }

  async setAll(settings: Partial<T>, skipSave?: boolean): Promise<this> {
    this._state = { ...this._state, ...settings };
    if (!skipSave) await this.save();
    return this;
  }

  async reset(key?: keyof T) {
    const defaultValue = this.getDefault();

    if (key) await this.set(key, defaultValue[key]);
    else await this.setAll(defaultValue);
  }

  protected abstract getDefault(): T;

  async save() {
    const stateToSave = { ...this._state };
    for (const key of this._storeExclude) {
      delete stateToSave[key];
    }
    await GM.setValue(this._id, stateToSave);
  }

  async load() {
    const savedState = await GM.getValue<Partial<T>>(this._id, {});

    for (const key of this._storeExclude) {
      delete savedState[key];
    }

    await this.setAll(savedState, true);
  }

  private notify<K extends keyof T>(key: K, oldValue: T[K]) {
    this._listeners[key]?.forEach((fn) =>
      fn({ value: this._state[key], oldValue })
    );
  }
}

type BaseStoreType<Value = string | number | boolean> = Record<
  PropertyKey,
  Value
>;

type Listener<T extends BaseStoreType, K extends keyof T> = (data: {
  value: T[K];
  oldValue: T[K];
}) => void;
