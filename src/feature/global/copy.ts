import { MK_CUSTOM_COMPONENT } from '@/constants';
import { createStyle } from '@/utils/dom';

import { globalFeatures } from '.';

// TODO 添加 copy js hook hot reload support

globalFeatures.register('copy', {
  id: 'style',
  test: () => true,
  enable: async () => {
    const style = createStyle(`$css
      *:not(.${MK_CUSTOM_COMPONENT}) {
        user-select: text !important;
      }
    `);

    return () => style.remove();
  },
});
