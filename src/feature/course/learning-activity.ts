import { registerRequestHook } from '@/utils/hook/request';
import { useToast } from '@/utils/notification/toast';

import type { CourseFeatureModule } from '.';

export const registerLearningActivityFeature = (group: CourseFeatureModule) => {
  group.register(
    'learning-activity',
    {
      id: 'forceAllowDownload',
      enable: async () => {
        const toast = useToast();

        const controller = registerRequestHook(
          /^\/api\/learning-activity\/(\d+)/,
          (responseText) => {
            console.log('hook1', responseText);
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
          /^\/api\/learning-activity\/(\d+)/,
          (responseText) => {
            let changed = false;
            console.log('hook2', responseText);

            const data = JSON.parse(responseText, (key, value) => {
              if (key === 'allow_forward_seeking' && value === false) {
                changed = true;
                return true;
              }
              return value;
            });

            if (changed) toast.show('已強制允許快轉');

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
