import { registerRequestHook } from '@/utils/hook/request';
import { useToast } from '@/utils/notification/toast';

import type { IActivityData } from './type';

import type { CourseFeatureModule } from '.';

// pause_when_leaving_window 不再這邊處理，因已 hook 視窗離開事件

const checkActivitiesBypassSupported = (
  activityData: Partial<IActivityData>
) => {
  if (
    !activityData ||
    typeof activityData !== 'object' ||
    Array.isArray(activityData)
  ) {
    return '活動資料格式錯誤，無法判定是否支援該功能';
  }

  const type = activityData.type;
  if (type === 'interaction') {
    return '互動式活動尚未支援該功能，請催催開發者吧！';
  }

  return true;
};

const createForceAllowHook = (
  key: 'allow_download' | 'allow_forward_seeking',
  successMessage: string,
  failMessage: string
) => {
  return () => {
    const toast = useToast();

    const controller = registerRequestHook(
      /^\/api\/activities\/(\d+)\/?$/,
      (responseText: string) => {
        let changed = false;

        const data = JSON.parse(responseText, (k, v) => {
          if (k === key && v === false) {
            changed = true;
            return true;
          }
          return v;
        });

        if (changed) {
          const checkResult = checkActivitiesBypassSupported(data);
          if (checkResult !== true) {
            toast.show(failMessage, {
              type: 'error',
              description: checkResult,
            });
            return null;
          } else {
            toast.show(successMessage);
          }
        }

        return JSON.stringify(data);
      }
    );

    return () => controller.disable();
  };
};

export const registerLearningActivityFeature = (group: CourseFeatureModule) => {
  group.register(
    'learning-activity',
    {
      id: 'forceAllowDownload',
      enable: createForceAllowHook(
        'allow_download',
        '已強制允許下載',
        '強制允許下載失敗'
      ),
    },
    {
      id: 'forceAllowForwardSeeking',
      enable: createForceAllowHook(
        'allow_forward_seeking',
        '已強制允許快轉',
        '強制允許快轉失敗'
      ),
    }
  );
};
