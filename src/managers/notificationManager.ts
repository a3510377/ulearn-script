import { useToast } from '#/toast';

class NotificationManager {
  private toast = useToast();

  notify(message: string, options: NotificationOptions = {}) {
    if (options.silent) return;
    const { duration = 3000, type = 'info' } = options;

    this.toast.show(message, { duration, type });
  }

  settingChanged(featureName: string, value: any, silent = false) {
    if (value) {
      this.notify(`${this.getFeatureLabel(featureName)} 已啟用`, {
        type: 'success',
        duration: 2000,
        silent,
      });
    } else {
      this.notify(`${this.getFeatureLabel(featureName)} 已停用`, {
        type: 'warn',
        duration: 2000,
        silent,
      });
    }
  }

  error(message: string, error?: Error) {
    this.notify(message, { type: 'error', duration: 5000 });
    if (error) {
      console.error('[Notification] Error details:', error);
    }
  }

  success(message: string, options?: NotificationOptions) {
    this.notify(message, { ...options, type: 'success' });
  }

  warning(message: string, options?: NotificationOptions) {
    this.notify(message, { ...options, type: 'warn' });
  }

  info(message: string, options?: NotificationOptions) {
    this.notify(message, { ...options, type: 'info' });
  }

  private getFeatureLabel(featureName: string): string {
    const labels: Record<string, string> = {
      removeFooter: '移除頁腳',
      blockEvents: '阻擋檢測',
      enableUserSelect: '文字選取',
      fixStyle: 'RWD優化',
      allowDownload: '允許下載',
      autoNext: '自動下一個',
      playbackRate: '播放速度',
      autoNextThreshold: '觸發比例',
      autoNextThresholdVariance: '隨機偏移',
      theme: '主題',
    };

    return labels[featureName] || featureName;
  }
}

export const notificationManager = new NotificationManager();
export default notificationManager;

export type NotificationType = 'success' | 'info' | 'warn' | 'error';

export interface NotificationOptions {
  duration?: number;
  type?: NotificationType;
  silent?: boolean;
}
