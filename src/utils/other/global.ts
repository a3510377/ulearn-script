import { SVG_MENU } from '@/assets/svg';
import { MK_CUSTOM_COMPONENT, MK_HIDDEN_SCROLL_CLASS } from '@/constants';

import {
  createElement,
  createStyle,
  createSvgFromString,
  onClickOutside,
  waitForElement,
} from '../dom';

export const removeFooter = () => {
  const style = createStyle(`$css
    .main-content {
      padding-bottom: 0 !important;
    }

    [data-category=tronclass-footer] {
      display: none !important;
    }
  `);

  return () => style.remove();
};

export const fixSomeStyle = () => {
  const cleanups: (() => void)[] = [];

  const removeMark = (el: HTMLElement) => {
    const originalBg = el.style.background;
    el.style.background = '';

    cleanups.push(() => (el.style.background = originalBg));
  };

  // -> #Symbol(water-mark)
  waitForElement('#Symbol\\28water-mark\\29')
    .then(removeMark)
    .catch(() => {});

  waitForElement('#symbol-water-mark')
    .then(removeMark)
    .catch(() => {});

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
      const removeOutsideClick = onClickOutside(layout, () => {
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

      const customDropMenuStyles = createStyle(`$css
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

      cleanups.push(() => {
        customDropMenuStyles.remove();
        customLayout.remove();
        customDropMenu.remove();
        removeOutsideClick();
        window.removeEventListener('resize', resizeHandler);
        customDropMenu.removeEventListener('click', clickHandler);
      });
    })
    .catch(() => {
      console.log('Failed to fix some styles');
    });

  const INIT_HIDE_SCROLL_CLASSNAME = 'mk-init-hide-scroll';
  const hideScrollStyle = createStyle(`$css
    body.${MK_HIDDEN_SCROLL_CLASS}, body.${INIT_HIDE_SCROLL_CLASSNAME} {
      overflow: hidden;
      visibility: visible;
      padding-right: 14px;
    }
  `);
  cleanups.push(() => hideScrollStyle.remove());

  // 初始化時就隱藏 scroll bar，避免跳動
  const fixScrollStyleHandle = () => {
    const toggleHideScroll = (hide: boolean) => {
      // > ?. 避免在某些情況下 document.body 為 null 而出錯
      document.body?.classList.toggle(INIT_HIDE_SCROLL_CLASSNAME, hide);
    };
    if (document.readyState !== 'complete') {
      toggleHideScroll(true);
      window.addEventListener('load', () => toggleHideScroll(false), {
        once: true,
      });
    }
  };
  fixScrollStyleHandle();
  document.addEventListener('DOMContentLoaded', fixScrollStyleHandle);
  cleanups.push(() => {
    document.body.classList.remove(INIT_HIDE_SCROLL_CLASSNAME);
    document.removeEventListener('DOMContentLoaded', fixScrollStyleHandle);
  });

  // https://tronclass.com.tw/api/exams/xxx/distribute
  // /course/(:id)?
  const courseContentStyle = createStyle(`$css
    .course-content .course-header {
      flex-wrap: wrap;
    }
  `);
  cleanups.push(() => courseContentStyle.remove());

  // /exam/:id/subjects(#/take?instanceId=xxx)
  const courseDescriptionStyle = createStyle(`$css
    .exam-activity-container > .hd {
      min-width: unset !important;
    }

    .exam-area .row {
      padding: 0 2rem;
    }
  `);
  cleanups.push(() => courseDescriptionStyle.remove());

  // /user/courses
  const mainContentDesignStyle = createStyle(`$css
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
  cleanups.push(() => mainContentDesignStyle.remove());

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
};

export const enableUserSelectStyle = () => {
  const style = createStyle(`$css
    /* --- ${MK_CUSTOM_COMPONENT} ~ mk-component --- */
    *:not(.mk-component) {
      user-select: text !important;
    }
  `);

  return () => style.remove();
};
