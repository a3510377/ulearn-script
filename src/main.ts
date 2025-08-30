import { blockEventsSetup } from './utils/events';
import { tryPlayVideo } from '#/course/video';
import {
  enableUserSelectStyle,
  fixSomeStyle,
  removeFooter,
} from './utils/other/global';

const PATH_MATCH =
  /^\/course\/(?<learningID>\d+)(?<viewing>\/learning-activity\/full-screen)?/;

const { pathname } = location;
const { learningID, viewing } = pathname.match(PATH_MATCH)?.groups || {};

// TODO add from settings
fixSomeStyle();
removeFooter();
blockEventsSetup();
enableUserSelectStyle();

// // /user/courses
// if (/^\/user\/courses\/?$/.test(pathname)) {
// }
// /course/xxx/learning-activity/full-screen
if (learningID && viewing) {
  tryPlayVideo();
}
