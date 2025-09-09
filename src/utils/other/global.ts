import { MK_CUSTOM_COMPONENT, MK_HIDDEN_SCROLL_CLASS } from '@/constants';
import { SVG_MENU } from '@/assets/svg';
import {
  createElement,
  createStyle,
  createSvgFromString,
  onClickOutside,
  waitForElement,
} from '../dom';

export const removeFooter = () => {
  createStyle(`$css
    .main-content {
      padding-bottom: 0 !important;
    }

    [data-category=tronclass-footer] {
      display: none !important;
    }
  `);
};

export const fixSomeStyle = () => {
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

      layout.appendChild(customLayout);
      layout.appendChild(customDropMenu);

      const bodyClassList = document.body.classList;
      const customLayoutClassList = customLayout.classList;
      onClickOutside(layout, () => {
        bodyClassList.remove(MK_HIDDEN_SCROLL_CLASS);
        customLayoutClassList.remove('mk-open-menu');
      });
      window.addEventListener('resize', () => {
        if (window.innerWidth >= 920) {
          bodyClassList.remove(MK_HIDDEN_SCROLL_CLASS);
          customLayoutClassList.remove('mk-open-menu');
        }
      });
      customDropMenu.addEventListener('click', () => {
        bodyClassList.toggle(
          MK_HIDDEN_SCROLL_CLASS,
          customLayoutClassList.toggle('mk-open-menu')
        );
      });

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
    })
    .catch(() => {
      console.log('Failed to fix some styles');
    });

  createStyle(`$css
    /* --- ${MK_HIDDEN_SCROLL_CLASS} ~ mk-hide-scroll --- */
    body.mk-hide-scroll {
      overflow: hidden;
      visibility: visible;
      padding-right: 14px;
    }
  `);

  // /user/courses
  createStyle(`$css
    .main-content .with-loading.content-under-nav-1 {
      padding: 0 2rem;
    }

    .user-index {
      max-width: 100rem;
    }

    .user-index .menu-side {
      position: sticky;
      top: 20px;
    }

    @media (max-width: 1120px) {
      body {
        min-width: unset !important;
      }

      .user-index .menu-side {
        display: none;
      }

      .user-index .right-side.column.collapse {
        margin-left: 0 !important;
        width: 100% !important;
      }
    }

    @media (max-width: 710px) {
      .teaching-class-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
    }

    @media (max-width: 640px) {
      .teaching-class-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .teaching-class-header > div {
        float: unset !important;
        position: unset !important;
      }

      .user-courses .course .item {
        display: flex;
        flex-direction: column;
      }

      .user-courses .course .item .course-cover {
        width: unset !important;
      }

      .user-courses .course .item .course-content {
        margin: 20px 20px 0;
        width: unset !important;
      }

      .user-courses .filter-conditions {
        grid-template-columns: minmax(180px, 1fr);
      }

      .user-courses .course .item .course-cover > img {
        margin: 0 auto;
        width: 80% !important;
        height: unset !important;
      }
    }
  `);
};

export const enableUserSelectStyle = () =>
  createStyle(`$css
    /* --- ${MK_CUSTOM_COMPONENT} ~ mk-component --- */
    *:not(.mk-component) {
      user-select: text !important;
    }
  `);
