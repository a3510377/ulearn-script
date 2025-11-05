import { BaseState, type BaseStateType } from '@/utils/state';
import type { MaybePromise } from '@/utils/type';

export class FeatureModule<T extends BaseStateType> extends BaseState<
  { enabled: boolean } & T
> {
  constructor(defaultState: T) {
    super({ enabled: true, ...defaultState });
  }
}

export class GroupFeature<T extends BaseStateType> {
  protected module: FeatureModule<T>;
  protected features: Map<string, Feature<T>[]>;

  constructor(module: FeatureModule<T>) {
    this.module = module;
    this.features = new Map();
  }

  register(name: string, features: Feature<T>): void;
  register(name: string, features: Feature<T>[]): void;
  register(name: string, features: Feature<T> | Feature<T>[]) {
    this.features.set(name, Array.isArray(features) ? features : [features]);
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

export type Feature<T extends BaseStateType = BaseStateType> = {
  id: string;
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
