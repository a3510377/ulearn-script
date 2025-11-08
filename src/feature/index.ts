import { DEFAULT_LANGUAGE_CODE, type LanguageCode } from '@/utils/global';
import {
  type BaseStateType,
  type ChangeListener,
  getDeep,
  type PartialPathValue,
  type Path,
  PersistentState,
} from '@/utils/state';
import type { MaybePromise } from '@/utils/type';

import { registerExamModule } from './exam';
import { registerGlobalModule } from './global';

export class FeatureModule<
  T extends BaseStateType,
  I18N extends FeatureModuleI18N<T> = FeatureModuleI18N<T>
> extends PersistentState<{ enabled: boolean } & T> {
  public id: string;
  protected i18n?: Partial<I18N>;
  public readonly groups: { [K in keyof T]?: Feature<T>[] } = {};

  constructor(id: string, defaultState: T, i18n?: Partial<I18N>) {
    super(
      { enabled: true, ...defaultState },
      // TODO make storage configurable
      { storage: localStorage, storageKey: `mk-feature-${id}` }
    );
    this.id = id;
    this.i18n = i18n;
  }

  getI18N(lang?: LanguageCode) {
    if (!lang) lang = DEFAULT_LANGUAGE_CODE;
    return this.i18n?.[lang as keyof I18N];
  }

  register<K extends Extract<keyof T, string>>(
    groupName: K,
    ...features: FeatureObject<T>[]
  ) {
    if (!this.groups[groupName]) {
      this.groups[groupName] = [];
    }

    this.groups[groupName]!.push(
      ...features.map((f) => {
        return new Feature<T>(this as FeatureModule<T>, f, [groupName, f.id]);
      })
    );
  }

  async init(): Promise<void> {
    await super.init();
    for (const groupFeatures of Object.values(this.groups)) {
      if (!groupFeatures) continue;
      for (const feature of groupFeatures) {
        try {
          await feature.init();
        } catch (e) {
          console.error(
            `[FeatureModule:init] ${this.id} - ${feature.options.id}`,
            e
          );
        }
      }
    }
  }
}

export class FeatureManager {
  protected modules: Map<string, FeatureModule<any>>;

  constructor() {
    this.modules = new Map();
  }

  register<T extends BaseStateType>(name: string, feature: FeatureModule<T>) {
    this.modules.set(name, feature);
  }

  get<T extends BaseStateType>(): Map<string, FeatureModule<T>>;
  get<T extends BaseStateType>(name: string): FeatureModule<T> | undefined;
  get<T extends BaseStateType>(
    name?: string
  ): FeatureModule<T> | Map<string, FeatureModule<T>> | undefined {
    return name ? this.modules.get(name) : this.modules;
  }

  async init(): Promise<void> {
    for (const module of this.modules.values()) {
      try {
        await module.init();
      } catch (e) {
        console.error(`[FeatureManager:init] ${module.id}`, e);
      }
    }
  }
}

export class Feature<T extends BaseStateType, P extends string[] = string[]> {
  public readonly options: FeatureObject<T>;
  public readonly paths: P;
  protected readonly module: FeatureModule<T>;
  protected readonly customData: Record<string, unknown> = {};
  protected readonly cleanups: CleanupFn<T>[] = [];

  constructor(module: FeatureModule<T>, options: FeatureObject<T>, paths: P) {
    this.module = module;
    this.options = options;
    this.paths = paths;
  }

  get name(): string {
    return this.getMessage('name') ?? this.options.id;
  }

  get description(): string | undefined {
    return this.getMessage('description');
  }

  get ctx(): FeatureContext<T> {
    return { module: this.module, custom: this.customData, paths: this.paths };
  }

  async init(): Promise<void> {
    try {
      await this.applyOption('init');
    } catch (e) {
      console.error(`[Feature:init] ${this.options.id}`, e);
    }
  }

  async check(): Promise<boolean> {
    const testValue = this.options.test;
    if (testValue instanceof RegExp) {
      return testValue.test(window.location.href);
    } else if (typeof testValue === 'function') {
      try {
        const res = await testValue();
        return typeof res === 'boolean' ? res : false;
      } catch (e) {
        console.error(`[Feature:check] ${this.options.id}`, e);
        return false;
      }
    }
    return false;
  }

  async click(): Promise<void> {
    try {
      const oldValue = this.get();
      if ('click' in this.options) {
        this.addCleanup(await this.safeCall(this.options.click));
        return;
      }

      if (
        'toggle' in this.options ||
        'enable' in this.options ||
        'disable' in this.options
      ) {
        await this.applyOption('click', !oldValue);
      }
    } catch (e) {
      console.error(`[Feature:click] ${this.options.id}`, e);
    }
  }

  on(callback: ChangeListener<T, Path<T>>): void {
    // @ts-ignore
    this.module.on(this.paths, callback);
  }

  off(callback: ChangeListener<T, Path<T>>): void {
    // @ts-ignore
    this.module.off(this.paths, callback);
  }

  get(): PartialPathValue<T, P> {
    // @ts-ignore
    return this.module.get(this.paths);
  }

  set(value: PartialPathValue<T, P>): void {
    // @ts-ignore
    this.module.set(this.paths, value);
  }

  async dispose(): Promise<void> {
    for (const fn of this.cleanups) {
      try {
        await fn.call(this, this.ctx);
      } catch (e) {
        console.error(`[Feature:dispose] ${this.options.id}`, e);
      }
    }
    this.cleanups.length = 0;
  }

  protected getMessage<K extends keyof FeatureModuleMessageFull<T>>(
    key: K
  ): string | undefined {
    const msg = getDeep(this.module.getI18N(), this.paths as any);
    if (typeof msg === 'string') return key === 'name' ? msg : undefined;
    if (msg && key in msg) return (msg as any)[key];
    return undefined;
  }

  protected async applyOption(
    type: 'init' | 'click',
    newValue?: boolean
  ): Promise<void> {
    if (type === 'init' && 'setup' in this.options) {
      this.addCleanup(await this.safeCall(this.options.setup));
    }

    const oldValue = this.get();
    if (newValue === undefined) {
      if (type === 'init') newValue = !!oldValue;
      else return;
    }

    if (this.options.liveReload === false && type !== 'init') return;
    if (!newValue) await this.dispose();

    try {
      if ('toggle' in this.options) {
        this.addCleanup(await this.safeCall(this.options.toggle, !newValue));
      } else if (newValue && 'enable' in this.options) {
        this.addCleanup(await this.safeCall(this.options.enable));
      } else if (!newValue && 'disable' in this.options) {
        this.addCleanup(await this.safeCall(this.options.disable));
      }
      this.set(newValue as any);
    } catch (e) {
      console.error(`[Feature:applyOption] ${this.options.id}`, e);
    }
  }

  protected async safeCall(
    fn?: (
      ctx: FeatureContext<T>,
      ...args: any[]
    ) => MaybePromise<CleanupResult<T>>,
    ...args: any[]
  ): Promise<CleanupResult<T> | void> {
    if (!fn) return;
    try {
      return await fn(this.ctx, ...args);
    } catch (e) {
      console.error(`[Feature:safeCall] ${this.options.id}`, e);
    }
  }

  protected addCleanup(result: CleanupResult<T> | void): void {
    if (!result) return;
    const fns = Array.isArray(result) ? result : [result];
    this.cleanups.push(...fns.filter(Boolean));
  }
}

export const featureManager = new FeatureManager();

export type FeatureContext<T extends BaseStateType> = {
  custom: Record<string, unknown>;
  module: FeatureModule<T>;
  paths: string[];
};

export type BaseStateToString<T> = {
  [K in keyof T]: T[K] extends Record<PropertyKey, any>
    ? BaseStateToString<T[K]>
    : { name: string; description?: string } | string;
};

export type FeatureModuleMessageFull<T extends BaseStateType> = {
  module: { name: string; description?: string };
  groups?: {
    [K in keyof T]?: { name: string; description?: string };
  };
} & BaseStateToString<T>;

export type FeatureModuleI18N<T extends BaseStateType> = {
  // Default language is required
  [K in typeof DEFAULT_LANGUAGE_CODE]: FeatureModuleMessageFull<T>;
} & {
  // Other languages are optional
  [K in Exclude<
    LanguageCode,
    typeof DEFAULT_LANGUAGE_CODE
  >]?: FeatureModuleMessageFull<T>;
};

export type CleanupFn<T extends BaseStateType> = (
  ctx: FeatureContext<T>
) => MaybePromise<any>;
export type CleanupResult<T extends BaseStateType> =
  | CleanupFn<T>
  | CleanupFn<T>[]
  | void;
export type CallbackWithCleanupFn<
  T extends BaseStateType,
  P extends any[] = []
> = (ctx: FeatureContext<T>, ...args: P) => MaybePromise<CleanupResult<T>>;

export type FeatureObject<T extends BaseStateType> = {
  id: string;
  test: (() => MaybePromise<boolean>) | RegExp;
  setup?: CallbackWithCleanupFn<T>;
  liveReload?: boolean; // default: true
} & (
  | { setup: CallbackWithCleanupFn<T> } // setup only
  // toggle only
  | { toggle: CallbackWithCleanupFn<T, [enabled: boolean]> }
  // toggle with enable/disable
  | { enable: CallbackWithCleanupFn<T>; disable?: CallbackWithCleanupFn<T> }
  // button
  | { click?: (ctx: FeatureContext<T>) => MaybePromise<void> }
);

registerExamModule(featureManager);
registerGlobalModule(featureManager);
