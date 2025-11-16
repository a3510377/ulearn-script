import { MK_CUSTOM_COMPONENT } from '@/constants';
import { createStyle, waitForJQuery } from '@/utils/dom';
import { disableDevToolDetector } from '@/utils/hook/dev-tool';
import { createHookGroup } from '@/utils/hook/event-hooks';
import { win } from '@/utils/hook/utils';

import type { GlobalFeatures } from '.';

export const registerEventHookFeature = (group: GlobalFeatures) => {
  group.register(
    'event-hook',
    {
      // 允許文字選取與複製
      // 允許用戶選取和複製頁面上的文字
      id: 'copy',
      setup: ({ custom }, enabled) => {
        const keyFilter = (e: Event) => {
          if (!(e instanceof KeyboardEvent)) return false;
          return (
            (e.ctrlKey || e.metaKey) &&
            ['c', 'v', 'x'].includes(e.key.toLowerCase())
          );
        };

        const keyboard = createHookGroup(
          ['keyup', 'keydown', 'keypress'],
          enabled,
          keyFilter
        );
        const misc = createHookGroup(
          [
            'contextmenu',
            'copy',
            'cut',
            'paste',
            'drag',
            'dragstart',
            'select',
            'selectstart',
          ],
          enabled
        );

        custom.enable = () => {
          keyboard.enable();
          misc.enable();
        };
        custom.disable = () => {
          keyboard.disable();
          misc.disable();
        };

        return custom.disable as () => void;
      },
      enable: async ({ custom }) => {
        const style = createStyle(`$css
          *:not(.${MK_CUSTOM_COMPONENT}) {
            user-select: text !important;
          }
        `);

        (custom.enable as () => void)?.();
        return () => {
          (custom.disable as () => void)?.();
          style.remove();
        };
      },
    },
    {
      // 允許使用開發者工具
      // 防止網站檢測並阻止開發者工具的使用
      id: 'disable-devtool-detect',
      liveReload: false,
      // TODO add clear config option
      enable: () => disableDevToolDetector(),
    },
    {
      // 抑制長時間不活動導致的彈出提示
      // 防止因長時間不活動而彈出閒置警告提示
      id: 'idle-check-disable',
      enable: ({ custom }) => {
        const style = createStyle(`$css
          #idle-warning-popup {
            display: none !important;
          }
        `);
        const intervalID = setInterval(
          () => document.dispatchEvent(new Event('mousemove')),
          5e3
        );

        const load = () => {
          waitForJQuery()
            .then(($) => $('#idle-warning-popup').foundation('reveal', 'close'))
            .catch(() => {});

          custom.originalEnableIdleWarning ??=
            win.statisticsSettings?.enableIdleWarning;
          if (win.statisticsSettings) {
            win.statisticsSettings.showIdleWarning = false;
            win.statisticsSettings.enableIdleWarning = false;
          }
        };
        load();
        window.addEventListener('DOMContentLoaded', load);

        return ({ custom }) => {
          try {
            if (custom.originalEnableIdleWarning !== null) {
              if (win.statisticsSettings) {
                // @ts-ignore
                win.statisticsSettings.enableIdleWarning =
                  custom.originalEnableIdleWarning;
              }
            }
          } catch {}

          style.remove();
          window.removeEventListener('DOMContentLoaded', load);
          clearInterval(intervalID);
        };
      },
    },
    {
      id: 'fullscreen-change-block',
      setup: ({ custom }, enabled) => {
        const { enable, disable } = createHookGroup(
          [
            'fullscreenchange',
            'mozfullscreenchange',
            'webkitfullscreenchange',
            'MSFullscreenChange',
          ],
          enabled
        );

        custom.enable = enable;
        custom.disable = disable;
        return disable;
      },
      enable: ({ custom }) => {
        (custom.enable as () => void)?.();
        return () => (custom.disable as () => void)?.();
      },
    },
    {
      id: 'blur-change-block',
      setup: ({ custom }, enabled) => {
        const { enable, disable } = createHookGroup(
          ['blur', 'pagehide'],
          enabled
        );

        custom.enable = enable;
        custom.disable = disable;
        return disable;
      },
      enable: ({ custom }) => {
        (custom.enable as () => void)?.();
        return () => {
          (custom.disable as () => void)?.();
        };
      },
    }
  );
};
