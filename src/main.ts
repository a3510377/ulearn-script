import { featureManager, notificationManager } from '@/managers';
import settingsStore from '@/store/settings';
import videoSettingsStore from '@/store/videoSettings';

import {
  featBulletinListCourseLink,
  fixSomeBulletinListStyle,
} from './utils/bulletin-list';
import { featCoursesLink, fixCoursesStyle } from './utils/course/courses';
import { blockEventsSetup } from './utils/events';
import {
  enableUserSelectStyle,
  fixSomeStyle,
  removeFooter,
} from './utils/other/global';
import { initSettingsMenu } from './view/index';

import './style';
import { tryPlayVideo, withDownload } from '#/course/video';

const PATH_MATCH =
  /^\/course\/(?<learningID>\d+)(?<viewing>\/learning-activity(\/full-screen)?)?/;

// Register all features with the feature manager
const features = {
  removeFooter: featureManager.register('removeFooter', removeFooter),
  blockEvents: featureManager.register('blockEvents', blockEventsSetup),
  enableUserSelect: featureManager.register(
    'enableUserSelect',
    enableUserSelectStyle
  ),
  fixStyle: featureManager.register('fixStyle', fixSomeStyle),
  allowDownload: featureManager.register('allowDownload', withDownload),
} as const;

const main = async () => {
  const { host, pathname } = location;
  const { learningID, viewing } = pathname.match(PATH_MATCH)?.groups || {};

  // 跳過 TronClass 官方首頁
  if (/(.+\.)tronclass\.com(\.tw)?/.test(host) && pathname === '/') {
    return;
  }

  // load persisted settings first
  await settingsStore.load();
  await videoSettingsStore.load();

  // Setup reactive features that respond to settings changes
  const setupReactiveFeatures = () => {
    // Explicit, type-safe list of feature toggle keys backed by settingsStore
    const featureKeys = Object.keys(features) as (keyof typeof features)[];

    // Helper to enable/disable a feature based on setting value, with notification
    const wireFeature = (key: keyof typeof features) => {
      const feature = features[key];
      // Apply initial state
      if (settingsStore.get(key)) feature.enable();
      // React to changes
      settingsStore.subscribe(
        key,
        ({ value }: { value: boolean }) => {
          if (value) feature.enable();
          else feature.disable();

          notificationManager.settingChanged(key, value);
        },
        false
      );
    };

    // Wire all registered features
    featureKeys.forEach(wireFeature);

    // Subscribe to video settings changes (notify only)
    const videoSettingKeys = ['autoNext', 'playbackRate'] as const;
    videoSettingKeys.forEach((k) =>
      videoSettingsStore.subscribe(
        k,
        ({ value }) => notificationManager.settingChanged(k, value),
        false
      )
    );
  };

  setupReactiveFeatures();

  // /bulletin-list
  if (/^\/bulletin-list\/?$/.test(pathname)) {
    fixSomeBulletinListStyle();
    featBulletinListCourseLink();
  } else if (/^\/user\/courses\/?$/.test(pathname)) {
    featCoursesLink();
    fixCoursesStyle();
  }
  // /course/xxx/learning-activity/full-screen
  else if (viewing && learningID) {
    tryPlayVideo();
  }

  // Initialize all components
  try {
    initSettingsMenu();
  } catch (error) {
    console.error('Initialization error:', error);
  }

  // window.addEventListener('hashchange', () => main());

  // keep the session alive
  setInterval(() => document.dispatchEvent(new Event('mousemove')), 5e3);
};

main();

export { features, notificationManager };
