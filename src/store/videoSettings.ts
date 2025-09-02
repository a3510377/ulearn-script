import { BaseStore } from './base';

export const DEFAULT_SETTINGS: VideoSettingValues = Object.freeze({
  autoNext: true,
  autoNextThreshold: 0.95,
  autoNextThresholdVariance: 0.05,
  customAutoNextThreshold: 0,
  playbackRate: 1.75,
});

export class VideoSettingStore extends BaseStore<VideoSettingValues> {
  constructor(initialSettings?: Partial<VideoSettingValues>) {
    super('settings', { ...DEFAULT_SETTINGS, ...initialSettings }, [
      'customAutoNextThreshold',
    ]);

    this.subscribe('autoNextThreshold', () => {
      this.set('customAutoNextThreshold', this.getRandomAutoNextThreshold());
    });
    this.subscribe('autoNextThresholdVariance', () => {
      this.set('customAutoNextThreshold', this.getRandomAutoNextThreshold());
    });
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

  getRandomAutoNextThreshold(): number {
    const base = this.get('autoNextThreshold');
    const variance = this.get('autoNextThresholdVariance');
    const offset = (Math.random() * 2 - 1) * variance;

    // ±variance, 0.0~1.0
    return Math.max(0, Math.min(1, base + offset));
  }

  protected getDefault(): VideoSettingValues {
    return DEFAULT_SETTINGS;
  }
}

export const videoSettingsStore = new VideoSettingStore();
export default videoSettingsStore;

type VideoSettingValues = {
  autoNext: boolean;
  autoNextThreshold: number;
  autoNextThresholdVariance: number;
  customAutoNextThreshold: number;
  playbackRate: number;
};
