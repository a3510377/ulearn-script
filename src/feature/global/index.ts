import i18n from './_i18n.json';

import { featureManager, FeatureModule, GroupFeature } from '..';

export const globalFeatureModule = new FeatureModule(
  'global',
  {
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
    },
  },
  i18n
);

export const globalFeatures = new GroupFeature(globalFeatureModule);

import './footer';
import './menu';
import './style';

featureManager.register('global', globalFeatureModule);
