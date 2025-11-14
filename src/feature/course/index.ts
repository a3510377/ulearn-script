import { registerLearningActivityFeature } from './learning-activity';

import type { FeatureManager } from '..';
import { FeatureModule } from '..';
// {
//   "allow_download": false,
//   "allow_forward_seeking": false,
//   "description": "",
//   "pause_when_leaving_window": false,
//   "publish_count": 1,
//   "teaching_method": 0,
//   "week": 0
// }

export const defaultConfig = {
  video: {
    forceAllowDownload: false,
    forceAllowForwardSeeking: false,
  },
};

export const registerCourseModule = (moduleManager: FeatureManager) => {
  const courseFeatureModule = new FeatureModule('course', defaultConfig);

  registerLearningActivityFeature(courseFeatureModule);

  moduleManager.register('course', courseFeatureModule);

  return courseFeatureModule;
};

export type CourseFeatureModule = ReturnType<typeof registerCourseModule>;
