import { featureManager as featureManagerBase } from '@/feature';
import { featureManager, notificationManager } from '@/managers';
import settingsStore from '@/store/settings';
import videoSettingsStore from '@/store/videoSettings';

import { blockEventsSetup } from './utils/events';
import { initSettingsMenu } from './view/index';

import './style';

// Register all features with the feature manager
const features = {
  blockEvents: featureManager.register('blockEvents', blockEventsSetup),
} as const;

const main = async () => {
  const { host, pathname } = location;

  // 跳過 TronClass 官方首頁
  if (/(.+\.)?tronclass\.com(\.tw)?/.test(host) && pathname === '/') {
    return;
  }

  // TODO register all feature
  featureManagerBase;

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
