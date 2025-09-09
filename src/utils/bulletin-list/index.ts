import { addHref, createStyle } from '../dom';

export const featBulletinListCourseLink = async () => {
  addHref(
    '.bulletin-container .course-name-label',
    '/course/[[bulletin.course_id]]/content',
    'mk-course-link'
  );
};

export const fixSomeBulletinListStyle = () => {
  createStyle(`$css
    .filter-area .bulletin-form {
      justify-content: space-between;
    }
  `);
};
