import { featureManager, FeatureModule, GroupFeature } from '..';

export const globalFeatureModule = new FeatureModule({});
export const globalFeatures = new GroupFeature(globalFeatureModule);

import './footer';
import './menu';
import './style';

featureManager.register('global', globalFeatureModule);
