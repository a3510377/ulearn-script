import { MK_CUSTOM_COMPONENT } from '@/constants';
import { createStyle, waitForElement } from '../dom';

export const featBulletinListCourseLink = async () => {
  const labelEl = await waitForElement(
    '.bulletin-container .course-name-label'
  ).catch(() => null);

  if (labelEl) {
    const hrefEl = document.createElement('a');
    hrefEl.setAttribute('ng-href', '/course/[[bulletin.id]]/content');
    hrefEl.classList.add('mk-course-link', MK_CUSTOM_COMPONENT);

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
