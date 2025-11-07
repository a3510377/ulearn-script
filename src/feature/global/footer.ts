import { createStyle } from '@/utils/dom';

import type { GlobalFeatures } from '.';

export const registerFooterFeature = (group: GlobalFeatures) => {
  group.register('footer', {
    id: 'hidden',
    test: () => true,
    enable: async () => {
      const style = createStyle(`$css
      .main-content {
        padding-bottom: 0 !important;
      }

      [data-category=tronclass-footer] {
        display: none !important;
      }
    `);

      return () => style.remove();
    },
  });
};
