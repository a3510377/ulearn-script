import { MK_CUSTOM_COMPONENT } from '@/constants';
import { createStyle, waitForJQuery } from '@/utils/dom';
import { disableDevToolDetector, win } from '@/utils/hook/dev-tool';

import type { GlobalFeatures } from '.';

// TODO 添加 copy js hook hot reload support

export const registerEventHookFeature = (group: GlobalFeatures) => {
  group.register(
    'event-hook',
    {
      // 允許文字選取與複製
      // 允許用戶選取和複製頁面上的文字
      id: 'copy',
      enable: async () => {
        const style = createStyle(`$css
          *:not(.${MK_CUSTOM_COMPONENT}) {
            user-select: text !important;
          }
        `);

        const preventDefault = (event: Event) => {
          event.stopPropagation();
        };
        document.addEventListener('copy', preventDefault, true);

        return () => {
          style.remove();
          document.removeEventListener('copy', preventDefault, true);
        };
      },
    },
    {
      // 允許使用開發者工具
      // 防止網站檢測並阻止開發者工具的使用
      id: 'disable-devtool-detect',
      liveReload: false,
      // TODO 改善此功能以支援主頁面
      // 由於此功能會導致主頁面 for-while loop 問題，暫時只在子頁面啟用
      test: /^\/.+/,
      enable: () => disableDevToolDetector(),
    },
    {
      // 抑制長時間不活動導致的彈出提示
      // 防止因長時間不活動而彈出閒置警告提示
      id: 'idle-check-disable',
      enable: ({ custom }) => {
        const intervalId = setInterval(
          () => document.dispatchEvent(new Event('mousemove')),
          5e3
        );

        const load = () => {
          waitForJQuery()
            .then(($) => $('#idle-warning-popup').foundation('reveal', 'close'))
            .catch();

          try {
            custom.originalEnableIdleWarning ??=
              // @ts-ignore
              win.statisticsSettings.enableIdleWarning;
            // @ts-ignore
            win.statisticsSettings.enableIdleWarning = false;
            // @ts-ignore
            win.statisticsSettings.showIdleWarning = false;
          } catch {}
        };
        load();
        win.addEventListener('DOMContentLoaded', load);

        return ({ custom }) => {
          try {
            if (custom.originalEnableIdleWarning !== null) {
              // @ts-ignore
              win.statisticsSettings.enableIdleWarning =
                custom.originalEnableIdleWarning;
            }
          } catch {}

          clearInterval(intervalId);
        };
      },
    }
  );
};
