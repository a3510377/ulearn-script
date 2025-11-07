import { registerMarkFeature } from './mark';

import type { FeatureManager } from '..';
import { FeatureModule, GroupFeature } from '..';

export const defaultConfig = {
  mark: {
    examMark: true,
  },
};

export const registerExamModule = (moduleManager: FeatureManager) => {
  const examFeatureModule = new FeatureModule('exam', defaultConfig);
  const examFeatures = new GroupFeature(examFeatureModule);

  registerMarkFeature(examFeatures);

  moduleManager.register('exam', examFeatureModule);

  return { examFeatures, examFeatureModule };
};

export type ExamFeatures = ReturnType<
  typeof registerExamModule
>['examFeatures'];
export type ExamFeatureModule = ReturnType<
  typeof registerExamModule
>['examFeatureModule'];
