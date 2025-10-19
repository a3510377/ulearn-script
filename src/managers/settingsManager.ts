import settingsStore from '@/store/settings';
import videoSettingsStore from '@/store/videoSettings';
import { createElement } from '@/utils/dom';

import notificationManager from './notificationManager';

interface ExportData {
  version: string;
  timestamp: number;
  settings: unknown;
  videoSettings: unknown;
}

class SettingsManager {
  private version = '1.0.0';

  exportSettings(): ExportData {
    return {
      version: this.version,
      timestamp: Date.now(),
      settings: settingsStore.get(),
      videoSettings: videoSettingsStore.get(),
    };
  }

  downloadSettings() {
    try {
      const data = this.exportSettings();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const hrefEl = createElement('a');
      hrefEl.href = url;
      hrefEl.download = `TronClass-settings-${
        new Date().toISOString().split('T')[0]
      }.json`;
      hrefEl.click();
      URL.revokeObjectURL(url);
      hrefEl.remove();

      notificationManager.success('設定已匯出');
    } catch (error) {
      notificationManager.error('匯出失敗', error as Error);
    }
  }

  importSettings(data: ExportData, silent = false) {
    try {
      if (!data.version || !data.settings || !data.videoSettings) {
        throw new Error('Invalid settings data');
      }

      settingsStore.setBatch(data.settings);
      videoSettingsStore.setBatch(data.videoSettings);

      if (!silent) {
        notificationManager.success('設定已匯入');
      }
    } catch (error) {
      notificationManager.error('匯入失敗：資料格式不正確', error as Error);
      throw error;
    }
  }

  importFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      try {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const text = await file.text();

        this.importSettings(JSON.parse(text));
      } catch (error) {
        notificationManager.error('匯入失敗：檔案格式不正確', error as Error);
      }
    };

    input.click();
  }

  resetAll() {
    if (!confirm('確定要重置所有設定為預設值嗎？此操作無法復原。')) {
      return;
    }

    settingsStore.reset();
    videoSettingsStore.reset();
    notificationManager.success('所有設定已重置');
  }
}

export const settingsManager = new SettingsManager();
export default settingsManager;
