import { blockEventsSetup } from './utils/events';
import { tryPlayVideo, withDownload } from '#/course/video';
import {
  enableUserSelectStyle,
  fixSomeStyle,
  removeFooter,
} from './utils/other/global';
import {
  featBulletinListCourseLink,
  fixSomeBulletinListStyle,
} from './utils/bulletin-list';

const PATH_MATCH =
  /^\/course\/(?<learningID>\d+)(?<viewing>\/learning-activity(\/full-screen)?)?/;

const { pathname } = location;
const { learningID, viewing } = pathname.match(PATH_MATCH)?.groups || {};

withDownload();
// // /user/courses
if (/^\/bulletin-list\/?$/.test(pathname)) {
  fixSomeBulletinListStyle();
  featBulletinListCourseLink();
}
// /course/xxx/learning-activity/full-screen
else if (viewing && learningID) {
  tryPlayVideo();
}

// TODO add from settings
fixSomeStyle();
removeFooter();
blockEventsSetup();
enableUserSelectStyle();

// window.addEventListener('hashchange', () => main());

// keep the session alive
setInterval(() => document.dispatchEvent(new Event('mousemove')), 5e3);
