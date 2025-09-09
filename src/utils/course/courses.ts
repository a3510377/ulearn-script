import { addHref, createStyle } from '../dom';

export const featCoursesLink = async () => {
  addHref(
    '.courses .course .item',
    '/course/[[course.id]]/content',
    'mk-course-link'
  );
};

export const fixCoursesStyle = () => {
  createStyle(`$css
    .user-courses .course {
      padding: 0 !important;
    }

    .user-courses .course .mk-course-link {
      padding: 20px;
      display: block;
    }

    .user-courses .course .item {
      display: flex;
      align-items: center;
      padding: 0 !important;
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
  `);
};
