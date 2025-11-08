import type { FeatureManager } from '..';
import { FeatureModule } from '..';

export const defaultConfig = {};

export const registerCourseModule = (moduleManager: FeatureManager) => {
  const courseFeatureModule = new FeatureModule('course', defaultConfig);

  moduleManager.register('course', courseFeatureModule);

  return courseFeatureModule;
};

export type CourseFeatureModule = ReturnType<typeof registerCourseModule>;
