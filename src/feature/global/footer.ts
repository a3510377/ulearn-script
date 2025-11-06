import { createStyle } from '@/utils/dom';

import { globalFeatures } from '.';

globalFeatures.register('footer', {
  id: 'hidden',
  name: '隱藏頁腳',
  description: '隱藏頁面底部的預設頁腳',
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
