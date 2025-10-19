import { BaseStore } from './base';

export const DEFAULT_SETTINGS: SettingsValues = Object.freeze({
  // Feature toggles
  removeFooter: true,
  blockEvents: true,
  enableUserSelect: true,
  fixStyle: true,
  allowDownload: true,
  // Floating ball settings
  fabPeekEnabled: true,
});

export class SettingsStore extends BaseStore<SettingsValues> {
  constructor(initialSettings?: Partial<SettingsValues>) {
    super('setting', { ...DEFAULT_SETTINGS, ...initialSettings });
  }

  protected getDefault(): SettingsValues {
    return DEFAULT_SETTINGS;
  }
}

export const settingsStore = new SettingsStore();
export default settingsStore;

type SettingsValues = {
  removeFooter: boolean;
  blockEvents: boolean;
  enableUserSelect: boolean;
  fixStyle: boolean;
  allowDownload: boolean;
  fabPeekEnabled: boolean;
};
