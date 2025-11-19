import { waitForAngular, waitForElement } from '@/utils/dom';

import type { CourseFeatureModule } from '.';
import type { IScope } from 'angular';

// learning-activity
export const registerLearningActivityFeature = (group: CourseFeatureModule) => {
  group.register(
    'video',
    {
      id: 'forceAllowDownload',
      liveReload: false,
      enable: async () => {},
    },
    {
      id: 'forceAllowForwardSeeking',
      test: /\/course\/\d+\/learning-activity/,
      enable: async () => {
        let warningMessage = '';
        waitForElement('.audio-wrapper').then(() => {
          document.querySelectorAll('.audio-wrapper[ng-init]').forEach((el) => {
            const init = el.getAttribute('ng-init');
            if (!init) return;

            const value = init.match(
              /forwardSeekingWarning\s*=\s*['"](.*?)['"]/
            )?.[1];

            if (!value) return;

            el.setAttribute(
              'ng-init',
              init
                .replace(/forwardSeekingWarning\s*=\s*['"].*?['"]\s*;?/g, '')
                .trim()
            );

            if (warningMessage && value && warningMessage !== value) {
              console.error(
                'Conflicting forward seeking warning messages:',
                warningMessage,
                'and',
                value
              );
            }
            warningMessage = value;
          });
        });

        return () => {
          waitForAngular().then((angular) => {
            document
              .querySelectorAll('.audio-wrapper[ng-init]')
              .forEach((el) => {
                const scope = angular
                  .element(el)
                  .scope<{ forwardSeekingWarning: string } & IScope>();

                scope?.$apply(() => {
                  scope.forwardSeekingWarning = warningMessage;
                });
              });
          });
        };
      },
    }
  );
};
