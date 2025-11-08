import { MK_CUSTOM_COMPONENT } from '@/constants';
import { createStyle, waitForElement } from '@/utils/dom';
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
      // 抑制長時間不活動導致的彈出提示
      // 防止因長時間不活動而彈出閒置警告提示
      id: 'idle-check-disable',
      test: () => true,
      enable: () => {
        const intervalId = setInterval(
          () => document.dispatchEvent(new Event('mousemove')),
          5e3
        );

        waitForElement('#idle-warning-popup')
          .then(() => {
            // 強制關閉彈出提示（如果存在的話）
            // @ts-ignore
            window.$('#idle-warning-popup').foundation('reveal', 'close');
          })
          .catch(() => {});

        return () => clearInterval(intervalId);
      },
    }
  );
};
