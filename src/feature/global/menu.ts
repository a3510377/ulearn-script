import { SVG_MENU } from '@/assets/svg';
import { MK_CUSTOM_COMPONENT, MK_HIDDEN_SCROLL_CLASS } from '@/constants';
import {
  createElement,
  createStyle,
  createSvgFromString,
  onClickOutside,
  waitForElement,
} from '@/utils/dom';

import type { GlobalFeatures } from '.';

export const registerMenuFeature = (group: GlobalFeatures) => {
  group.register('menu', {
    id: 'RWD-support',
    // 由於強制更改 DOM 結構，若支援 liveReload 會有點麻煩，懶惰 :>
    liveReload: false,
    enable: async () => {
      // header and menu
      waitForElement('.layout-row.default-layout')
        .then((layout) => {
          const customLayout = createElement('div', 'custom-layout');
          const customDropMenu = createElement('div', 'custom-drop-menu');

          customLayout.append(
            ...document.querySelectorAll(
              '.layout-row.default-layout>li,.layout-row.default-layout>ul'
            )
          );
          customDropMenu.append(createSvgFromString(SVG_MENU));

          layout.append(customLayout, customDropMenu);

          const bodyClassList = document.body.classList;
          const customLayoutClassList = customLayout.classList;
          onClickOutside(layout, () => {
            bodyClassList.remove(MK_HIDDEN_SCROLL_CLASS);
            customLayoutClassList.remove('mk-open-menu');
          });

          const resizeHandler = () => {
            if (window.innerWidth >= 920) {
              bodyClassList.remove(MK_HIDDEN_SCROLL_CLASS);
              customLayoutClassList.remove('mk-open-menu');
            }
          };
          window.addEventListener('resize', resizeHandler);

          const clickHandler = () => {
            bodyClassList.toggle(
              MK_HIDDEN_SCROLL_CLASS,
              customLayoutClassList.toggle('mk-open-menu')
            );
          };
          customDropMenu.addEventListener('click', clickHandler);

          createStyle(`$css
            .${MK_CUSTOM_COMPONENT}.custom-drop-menu {
              display: none;
            }

            .${MK_CUSTOM_COMPONENT}.custom-layout {
              width: 100%;
            }

            .layout-row.default-layout {
              display: flex;
              justify-content: space-between;
            }

            .mobile-header .left-header img.logo {
              margin: unset !important;
            }

            @media (max-width: 920px) {
              .header .${MK_CUSTOM_COMPONENT}.custom-layout:not(.mk-open-menu) ul,
              .header .${MK_CUSTOM_COMPONENT}.custom-layout:not(.mk-open-menu) li {
                display: none !important;
              }

              .header .profile-item {
                gap: 8px;
              }

              .header .profile .dropdown-list, .header .profile .dropdown-list .dropdown-item {
                left: unset !important;
                right: unset !important;
              }

              .header .profile .dropdown-list .autocollapse-container ul {
                left: 182px !important;
                right: unset !important;
              }

              .header .profile-item .current-user-name {
                height: auto !important;
              }

              .${MK_CUSTOM_COMPONENT}.custom-drop-menu {
                display: flex !important;
                align-items: center;
                margin-left: 1rem;
                margin-right: -1rem;
              }

              .${MK_CUSTOM_COMPONENT}.custom-drop-menu > svg {
                cursor: pointer;
                border-radius: 1rem;
                padding: 8px;
                width: 2.5rem;
                transition: all 0.2s ease-in-out;
              }

              .${MK_CUSTOM_COMPONENT}.custom-drop-menu > svg:hover {
                fill: #ffffffb5 !important;
                background: #00000026 !important;
              }

              .${MK_CUSTOM_COMPONENT}.custom-layout.mk-open-menu {
                position: absolute;
                top: 50px;
                display: flex;
                flex-direction: column;
                left: 0;
                right: 0;
                z-index: 999;
                background-color: #313e5c;
              }

              .${MK_CUSTOM_COMPONENT}.custom-layout.mk-open-menu li {
                display: inline-block !important;
              }

              .${MK_CUSTOM_COMPONENT}.custom-layout.mk-open-menu .header-vertical-split-line.header-item {
                border: unset;
                height: 0 !important;
                display: block !important;
              }

              .${MK_CUSTOM_COMPONENT}.custom-layout.mk-open-menu > ul {
                height: auto;
                position: unset;
              }

              .${MK_CUSTOM_COMPONENT}.custom-layout.mk-open-menu > ul > li {
                height: auto;
                margin-left: 2.5rem;
                line-height: initial !important;
              }
            }
          `);
        })
        .catch(() => {});
    },
  });
};
