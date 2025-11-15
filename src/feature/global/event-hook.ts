import { MK_CUSTOM_COMPONENT } from '@/constants';
import { createStyle, waitForJQuery } from '@/utils/dom';
import { disableDevToolDetector } from '@/utils/hook/dev-tool';
import type { HookController } from '@/utils/hook/event-hooks';
import { registerEventHook } from '@/utils/hook/event-hooks';
import { win } from '@/utils/hook/utils';

import type { GlobalFeatures } from '.';

// TODO 添加 copy js hook hot reload support

export const registerEventHookFeature = (group: GlobalFeatures) => {
  group.register(
    'event-hook',
    {
      // 允許文字選取與複製
      // 允許用戶選取和複製頁面上的文字
      id: 'copy',
      setup: ({ custom }, enabled) => {
        const hooks: HookController[] = [];

        ['keyup', 'keydown', 'keypress'].forEach((ev) => {
          const reg = registerEventHook(ev, undefined, (e) => {
            if (!(e instanceof KeyboardEvent)) return false;

            return (
              (e.ctrlKey || e.metaKey) &&
              ['c', 'v', 'x'].includes(e.key.toLowerCase())
            );
          });
          if (!enabled) reg.disable();
          hooks.push(reg);
        });

        [
          'contextmenu',
          'copy',
          'cut',
          'paste',
          'drag',
          'dragstart',
          'select',
          'selectstart',
        ].forEach((ev) => {
          const reg = registerEventHook(ev);
          if (!enabled) reg.disable();
          hooks.push(reg);
        });

        const disable = () => hooks.forEach(({ disable }) => disable());
        custom.enable = () => hooks.forEach(({ enable }) => enable());
        custom.disable = disable;
        return disable;
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
    }
  );
};

// blockVisibilitySetup
// blockDomLimitSetup
// blockFocusSetup
// blockBlurSetup
// blockLifecycleSetup
// blockRafSetup
