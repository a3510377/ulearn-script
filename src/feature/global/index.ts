import i18n from './_i18n.json';
import { registerEventHookFeature } from './event-hook';
import { registerFooterFeature } from './footer';
import { registerMenuFeature } from './menu';
import { registerStyleFeature } from './style';

import type { FeatureManager } from '..';
import { FeatureModule } from '..';

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
    'idle-check-disable': true,
  },
};

export const registerGlobalModule = (moduleManager: FeatureManager) => {
  const globalFeatureModule = new FeatureModule('global', defaultConfig, i18n);

  registerEventHookFeature(globalFeatureModule);
  registerFooterFeature(globalFeatureModule);
  registerMenuFeature(globalFeatureModule);
  registerStyleFeature(globalFeatureModule);

  moduleManager.register('global', globalFeatureModule);

  return globalFeatureModule;
};

export type GlobalFeatures = ReturnType<typeof registerGlobalModule>;
