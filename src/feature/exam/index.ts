import { featureManager, FeatureModule, GroupFeature } from '..';

export const defaultConfig = {
  mark: {
    examMark: true,
  },
};
export const examFeatureModule = new FeatureModule('exam', defaultConfig);
export const examFeatures = new GroupFeature(examFeatureModule);

import './mark';

featureManager.register('exam', examFeatureModule);
