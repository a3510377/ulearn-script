import { MK_HIDDEN_SCROLL_CLASS } from '@/constants';
import { skipHookFunc } from '@/utils';

import type { GlobalFeatures } from '.';

export const registerStyleFeature = (group: GlobalFeatures) => {
  group.register('style', {
    id: 'init-hide-scroll',
    enable: async () => {
      const INIT_HIDE_SCROLL_CLASSNAME = `${MK_HIDDEN_SCROLL_CLASS}-init`;
      const fixScrollStyleHandle = skipHookFunc(() => {
        const toggleHideScroll = (hide: boolean) => {
          // > ?. 避免在某些情況下 document.body 為 null 而出錯
          document.body?.classList.toggle(INIT_HIDE_SCROLL_CLASSNAME, hide);
        };

        if (document.readyState !== 'complete') {
          toggleHideScroll(true);
          window.addEventListener(
            'load',
            skipHookFunc(() => toggleHideScroll(false)),
            { once: true }
          );
        }
      });

      fixScrollStyleHandle();
      document.addEventListener('DOMContentLoaded', fixScrollStyleHandle);
      return () => {
        document.body.classList.remove(INIT_HIDE_SCROLL_CLASSNAME);
        document.removeEventListener('DOMContentLoaded', fixScrollStyleHandle);
      };
    },
  });
};
