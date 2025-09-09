import { createElement, createStyle, waitForElement } from '../dom';

export const featBulletinListCourseLink = async () => {
  const labelEl = await waitForElement(
    '.bulletin-container .course-name-label'
  ).catch(() => null);

  if (labelEl) {
    const hrefEl = createElement('a', 'mk-course-link');
    hrefEl.setAttribute('ng-href', '/course/[[bulletin.course_id]]/content');

    labelEl.parentNode?.insertBefore(hrefEl, labelEl);
    hrefEl.appendChild(labelEl);
  }
};

export const fixSomeBulletinListStyle = () => {
  createStyle(`$css
    .filter-area .bulletin-form {
      justify-content: space-between;
    }
  `);
};
