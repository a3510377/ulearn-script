import { MK_CUSTOM_COMPONENT } from '@/constants';
import { createStyle } from '@/utils/dom';
import { disableDevToolDetector } from '@/utils/hook/dev-tool';

import { globalFeatures } from '.';

// TODO 添加 copy js hook hot reload support

globalFeatures.register('event-hook', [
  {
    id: 'copy',
    name: '允許文字選取與複製',
    description: '允許用戶選取和複製頁面上的文字',
    test: () => true,
    enable: async () => {
      const style = createStyle(`$css
      *:not(.${MK_CUSTOM_COMPONENT}) {
        user-select: text !important;
      }
    `);

      return () => style.remove();
    },
  },
  {
    id: 'disable-devtool-detect',
    name: '允許使用開發者工具',
    description: '防止網站檢測並阻止開發者工具的使用',
    test: () => true,
    liveReload: false,
    enable: () => disableDevToolDetector(),
  },
]);
