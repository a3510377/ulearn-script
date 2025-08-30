import { BaseStore } from './base';

export const DEFAULT_SETTINGS: VideoSettingsValues = Object.freeze({
  theme: 'light',
});

export class VideoSettingsStore extends BaseStore<VideoSettingsValues> {
  constructor(initialSettings?: Partial<VideoSettingsValues>) {
    super('setting', { ...DEFAULT_SETTINGS, ...initialSettings });
  }

  toggleTheme() {
    const current = this.get('theme');
    this.set('theme', current === 'light' ? 'dark' : 'light');
  }
}

export const settingsStore = new VideoSettingsStore();
export default settingsStore;

type VideoSettingsValues = { theme: 'light' | 'dark' };
