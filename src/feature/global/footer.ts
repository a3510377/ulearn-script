import { createStyle } from '@/utils/dom';

import { globalFeatures } from '.';

globalFeatures.register('footer', {
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
