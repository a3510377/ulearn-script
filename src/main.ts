import { blockEventsSetup } from './utils/events';
import { tryPlayVideo, withVideoDownload } from '#/course/video';
import {
  enableUserSelectStyle,
  fixSomeStyle,
  removeFooter,
} from './utils/other/global';

const PATH_MATCH =
  /^\/course\/(?<learningID>\d+)(?<viewing>\/learning-activity\/full-screen)?/;

const { pathname } = location;
const { learningID, viewing } = pathname.match(PATH_MATCH)?.groups || {};

// // /user/courses
// if (/^\/user\/courses\/?$/.test(pathname)) {
// }
// /course/xxx/learning-activity/full-screen
if (viewing && learningID) {
  tryPlayVideo();
  withVideoDownload();
}

// TODO add from settings
fixSomeStyle();
removeFooter();
blockEventsSetup();
enableUserSelectStyle();

// window.addEventListener('hashchange', () => main());
