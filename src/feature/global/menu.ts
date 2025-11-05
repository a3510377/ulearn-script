import { SVG_MENU } from '@/assets/svg';
import { MK_HIDDEN_SCROLL_CLASS } from '@/constants';
import {
  createElement,
  createStyle,
  createSvgFromString,
  onClickOutside,
  waitForElement,
} from '@/utils/dom';

import { globalFeatures } from '.';

globalFeatures.register('menu', {
  id: 'RWD-support',
  test: () => true,
  // 由於強制更改 DOM 結構，若支援 liveReload 會有點麻煩，懶惰 :>
  liveReload: false,
  enable: async () => {
    // header and menu
    waitForElement('.layout-row.default-layout').then((layout) => {
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
        .mk-component.custom-drop-menu {
          display: none;
        }

        .mk-component.custom-layout {
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
          .header .mk-component.custom-layout:not(.mk-open-menu) ul,
          .header .mk-component.custom-layout:not(.mk-open-menu) li {
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

          .mk-component.custom-drop-menu {
            display: flex !important;
            align-items: center;
            margin-left: 1rem;
            margin-right: -1rem;
          }

          .mk-component.custom-drop-menu > svg {
            cursor: pointer;
            border-radius: 1rem;
            padding: 8px;
            width: 2.5rem;
            transition: all 0.2s ease-in-out;
          }

          .mk-component.custom-drop-menu > svg:hover {
            fill: #ffffffb5 !important;
            background: #00000026 !important;
          }

          .mk-component.custom-layout.mk-open-menu {
            position: absolute;
            top: 50px;
            display: flex;
            flex-direction: column;
            left: 0;
            right: 0;
            z-index: 999;
            background-color: #313e5c;
          }

          .mk-component.custom-layout.mk-open-menu li {
            display: inline-block !important;
          }

          .mk-component.custom-layout.mk-open-menu .header-vertical-split-line.header-item {
            border: unset;
            height: 0 !important;
            display: block !important;
          }

          .mk-component.custom-layout.mk-open-menu > ul {
            height: auto;
            position: unset;
          }

          .mk-component.custom-layout.mk-open-menu > ul > li {
            height: auto;
            margin-left: 2.5rem;
            line-height: initial !important;
          }
        }
      `);
    });
  },
});
