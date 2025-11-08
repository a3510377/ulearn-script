import { registerMarkFeature } from './mark';

import type { FeatureManager } from '..';
import { FeatureModule } from '..';

export const defaultConfig = {
  mark: {
    examMark: true,
  },
};

export const registerExamModule = (moduleManager: FeatureManager) => {
  const examFeatureModule = new FeatureModule('exam', defaultConfig);

  registerMarkFeature(examFeatureModule);

  moduleManager.register('exam', examFeatureModule);

  return examFeatureModule;
};

export type ExamFeatureModule = ReturnType<typeof registerExamModule>;
