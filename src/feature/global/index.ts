import i18n from './_i18n.json';
import { registerEventHookFeature } from './event-hook';
import { registerFooterFeature } from './footer';
import { registerMenuFeature } from './menu';
import { registerStyleFeature } from './style';

import type { FeatureManager } from '..';
import { FeatureModule, GroupFeature } from '..';

export const defaultConfig = {
  style: {
    'init-hide-scroll': true,
  },
  menu: {
    'RWD-support': true,
  },
  footer: {
    hidden: true,
  },
  'event-hook': {
    copy: true,
    'disable-devtool-detect': true,
    'keep-session-alive': true,
  },
};

export const registerGlobalModule = (moduleManager: FeatureManager) => {
  const globalFeatureModule = new FeatureModule('global', defaultConfig, i18n);
  const globalFeatures = new GroupFeature(globalFeatureModule);

  registerEventHookFeature(globalFeatures);
  registerFooterFeature(globalFeatures);
  registerMenuFeature(globalFeatures);
  registerStyleFeature(globalFeatures);

  moduleManager.register('global', globalFeatureModule);

  return { globalFeatures, globalFeatureModule };
};

export type GlobalFeatures = ReturnType<
  typeof registerGlobalModule
>['globalFeatures'];
export type GlobalFeatureModule = ReturnType<
  typeof registerGlobalModule
>['globalFeatureModule'];
