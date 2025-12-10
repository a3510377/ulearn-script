import { waitForElement, waitForVue } from '@/utils/dom';
import { registerRequestHook } from '@/utils/hook/request';
import { useToast } from '@/utils/notification/toast';

import type { IActivityData } from './type';

import type { CourseFeatureModule } from '.';

// pause_when_leaving_window 不再這邊處理，因已 hook 視窗離開事件

const LEARNING_ACTIVITY =
  /^\/course\/\d+\/learning-activity(\/full-screen)?\/?$/;

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

  return true;
};

const createForceAllowHook = (
  key: 'allow_download' | 'allow_forward_seeking',
  successMessage: string,
  failMessage: string
) => {
  const toast = useToast();

  const controller = registerRequestHook(
    /^\/api\/activities\/(\d+)\/?$/,
    (responseText: string) => {
      let activityData: IActivityData;

      try {
        activityData = JSON.parse(responseText);
      } catch {
        toast.show('活動資料格式錯誤，無法強制允許', { type: 'error' });
        return null;
      }

      if (activityData.data?.[key] === false) {
        const checkResult = checkActivitiesBypassSupported(activityData);
        if (checkResult !== true) {
          toast.show(failMessage, {
            type: 'error',
            description: checkResult,
          });
          return responseText;
        }

        activityData.data[key] = true;
        toast.show(successMessage, { type: 'success' });
      }

      return JSON.stringify(activityData);
    }
  );

  return () => controller.disable();
};

export const registerLearningActivityFeature = (group: CourseFeatureModule) => {
  group.register(
    'learning-activity',
    {
      id: 'forceAllowDownload',
      test: LEARNING_ACTIVITY,
      enable: () => {
        return createForceAllowHook(
          'allow_download',
          '已強制允許下載',
          '強制允許下載失敗'
        );
      },
    },
    {
      id: 'forceAllowForwardSeeking',
      test: LEARNING_ACTIVITY,
      enable: () => {
        const closeHook = createForceAllowHook(
          'allow_forward_seeking',
          '已強制允許快轉',
          '強制允許快轉失敗'
        );

        let closeVuePatch = () => {};
        (async () => {
          const videoEl = await waitForElement(
            '#wg-video-player-interaction-video'
          ).catch(() => null);

          if (videoEl) {
            const vueApp = await waitForVue(videoEl, {
              vnode: true,
            }).catch(() => null);

            if (!vueApp) return;

            const props = vueApp._vnode.component.props;
            if (props) {
              const oldSeekable = props.seekable;
              props.seekable = true;

              closeVuePatch = () => (props.seekable = oldSeekable);
            }
          }
        })();

        return () => {
          closeHook();
          closeVuePatch();
        };
      },
    }
  );
};
