import { createStyle, waitForElement } from '../dom';

export const removeFooter = () => {
  waitForElement('[data-category=tronclass-footer]')
    .then((e) => {
      createStyle(`$css
        .main-content {
          padding-bottom: 0 !important;
        }
      `);
      e.remove();
    })
    .catch(() => {});
};

export const fixSomeStyle = () => {
  waitForElement('.layout-row.default-layout')
    .then((layout) => {
      const box = document.createElement('div');
      box.append(
        ...document.querySelectorAll(
          '.layout-row.default-layout>li,.layout-row.default-layout>ul'
        )
      );
      box.classList.add('custom-layout');
      layout.appendChild(box);

      createStyle(`$css
        @media (max-width: 920px) {
          .header .autocollapse-item,
          .header .menu>.header-item:not(.profile) {
            display: none;
          }
        }

        .custom-layout {
          width: 100%;
        }

        .layout-row.default-layout {
          display: flex;
        }
      `);
    })
    .catch();

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

    .user-courses .course .item {
      display: flex;
      align-items: center;
    }

    .user-courses .course, .user-courses .course a {
      transition: all 0.2s ease-out;
    }

    .user-courses .course .item .course-code-row {
      width: unset !important;
    }

    @media (max-width: 920px) {
      .user-courses .filter-conditions {
        grid-template-columns: repeat(2, minmax(180px, 1fr));
      }
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
    * {
      user-select: text !important;
      -ms-user-select: text !important;
      -moz-user-select: text !important;
      -webkit-user-select: text !important;
    }
  `);
