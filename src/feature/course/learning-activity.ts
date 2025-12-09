import { registerRequestHook } from '@/utils/hook/request';
import { useToast } from '@/utils/notification/toast';

import type { CourseFeatureModule } from '.';

// pause_when_leaving_window 不再這邊處理，因已 hook 視窗離開事件

export const registerLearningActivityFeature = (group: CourseFeatureModule) => {
  group.register(
    'learning-activity',
    {
      id: 'forceAllowDownload',
      enable: async () => {
        const toast = useToast();

        const controller = registerRequestHook(
          /^\/api\/activities\/(\d+)\/?$/,
          (responseText) => {
            let changed = false;

            const data = JSON.parse(responseText, (key, value) => {
              if (key === 'allow_download' && value === false) {
                changed = true;
                return true;
              }
              return value;
            });

            if (changed) toast.show('已強制允許下載');

            return JSON.stringify(data);
          }
        );

        return () => {
          controller.disable();
        };
      },
    },
    {
      id: 'forceAllowForwardSeeking',
      enable: async () => {
        const toast = useToast();

        const controller = registerRequestHook(
          /^\/api\/activities\/(\d+)\/?$/,
          (responseText) => {
            let changed = false;

            const data = JSON.parse(responseText, (key, value) => {
              if (key === 'allow_forward_seeking' && value === false) {
                changed = true;
                return true;
              }
              return value;
            });

            if (changed) {
              if (!Array.isArray(data) && ['interaction'].includes(data.type)) {
                toast.show('互動式活動無法強制允許快轉');
                return null;
              } else {
                toast.show('已強制允許快轉');
              }
            }

            return JSON.stringify(data);
          }
        );

        return () => {
          controller.disable();
        };
      },
    }
  );
};
