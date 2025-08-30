import { BaseStore } from './base';

export const DEFAULT_SETTINGS: VideoSettingValues = Object.freeze({
  autoNext: true,
  autoNextThreshold: 0.95,
  playbackRate: 1.75,
});

export class VideoSettingStore extends BaseStore<VideoSettingValues> {
  constructor(initialSettings?: Partial<VideoSettingValues>) {
    super('settings', { ...DEFAULT_SETTINGS, ...initialSettings });
  }

  setPlaybackRate(rate: number) {
    this.set('playbackRate', rate);
  }

  enableAutoNext() {
    this.set('autoNext', true);
  }
  disableAutoNext() {
    this.set('autoNext', false);
  }

  getDefault(): VideoSettingValues {
    return DEFAULT_SETTINGS;
  }
}

export const videoSettingsStore = new VideoSettingStore();
export default videoSettingsStore;

type VideoSettingValues = {
  autoNext: boolean;
  autoNextThreshold: number;
  playbackRate: number;
};
