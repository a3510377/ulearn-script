import { MK_CUSTOM_COMPONENT } from '@/constants';
import { createStyle } from '@/utils/dom';
import { disableDevToolDetector } from '@/utils/hook/dev-tool';

import type { GlobalFeatures } from '.';

// TODO 添加 copy js hook hot reload support

export const registerEventHookFeature = (group: GlobalFeatures) => {
  group.register(
    'event-hook',
    {
      // 允許文字選取與複製
      // 允許用戶選取和複製頁面上的文字
      id: 'copy',
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
      // 允許使用開發者工具
      // 防止網站檢測並阻止開發者工具的使用
      id: 'disable-devtool-detect',
      test: () => true,
      liveReload: false,
      enable: () => disableDevToolDetector(),
    },
    {
      // 保持登入狀態
      // 通過模擬用戶活動來防止自動登出
      id: 'keep-session-alive',
      test: () => true,
      enable: () => {
        const intervalId = setInterval(
          () => document.dispatchEvent(new Event('mousemove')),
          5e3
        );
        return () => clearInterval(intervalId);
      },
    }
  );
};
