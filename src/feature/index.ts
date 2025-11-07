import { BaseState, type BaseStateType } from '@/utils/state';
import type {
  DefaultLanguageCode,
  LanguageCode,
  MaybePromise,
} from '@/utils/type';

export type BaseStateToString<T> = {
  [K in keyof T]: T[K] extends Record<PropertyKey, any>
    ? BaseStateToString<T[K]>
    : { name: string; description?: string } | string;
};

export type FeatureModuleI18N<T extends BaseStateType> = {
  [K in DefaultLanguageCode]: BaseStateToString<T>;
} & {
  [K in Exclude<LanguageCode, DefaultLanguageCode>]?: BaseStateToString<T>;
};

export class FeatureModule<
  T extends BaseStateType,
  I18N extends FeatureModuleI18N<T> = FeatureModuleI18N<T>
> extends BaseState<{ enabled: boolean } & T> {
  protected i18n?: Partial<I18N>;

  constructor(defaultState: T, i18n?: Partial<I18N>) {
    super({ enabled: true, ...defaultState });
    this.i18n = i18n;
  }
}

export class GroupFeature<
  T extends BaseStateType,
  I18N extends FeatureModuleI18N<T> = FeatureModuleI18N<T>
> {
  protected module: FeatureModule<T, I18N>;
  protected features: { [K in keyof T]?: Feature<NonNullable<T[K]>>[] } = {};

  constructor(module: FeatureModule<T, I18N>) {
    this.module = module;
  }

  register<K extends keyof T>(
    name: K,
    ...features: Feature<NonNullable<T[K]>>[]
  ) {
    (this.features[name] ??= []).push(...features);
  }
}

export class FeatureManager {
  protected features: Map<string, FeatureModule<any>>;

  constructor() {
    this.features = new Map();
  }

  register<T extends BaseStateType>(name: string, feature: FeatureModule<T>) {
    this.features.set(name, feature);
  }

  get<T extends BaseStateType>(name: string): FeatureModule<T> | undefined {
    return this.features.get(name);
  }
}

export const featureManager = new FeatureManager();

export type FeatureContext<T extends BaseStateType> = {
  custom: Record<string, unknown>;
  module: FeatureModule<T>;
};

export type CleanupFn<T extends BaseStateType> = (
  ctx: FeatureContext<T>
) => MaybePromise<any>;
export type CleanupResult<T extends BaseStateType> =
  | CleanupFn<T>
  | CleanupFn<T>[]
  | void;
export type CleanupResultAsync<T extends BaseStateType> = MaybePromise<
  CleanupResult<T>
>;
export type CallbackWithCleanupFn<T extends BaseStateType> = (
  ctx: FeatureContext<T>
) => CleanupResultAsync<T>;

export type Feature<T extends Record<PropertyKey, any>> = {
  id: keyof T;
  name: string;
  description?: string;
  test: (() => MaybePromise<boolean | RegExp>) | RegExp;
  setup?: CallbackWithCleanupFn<T>;
  liveReload?: boolean; // default: true
} & (
  | { setup: CallbackWithCleanupFn<T> }
  | {
      toggle: (
        enabled: boolean,
        ctx: FeatureContext<T>
      ) => CleanupResultAsync<T>;
    }
  | { enable: CallbackWithCleanupFn<T>; disable?: CallbackWithCleanupFn<T> }
);

import './exam';
import './global';
