import { waitForElement } from '@/utils/dom';

import type { CleanupFn } from '..';
import type { defaultConfig } from '.';
import { examFeatures } from '.';

const cleanups: CleanupFn<typeof defaultConfig>[] = [];

examFeatures.register('mark', {
  id: 'examMark',
  name: '移除考試浮水印',
  description: '移除考試頁面上的浮水印',
  test: () => true,
  enable: async () => {
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
  },
  disable: async (ctx) => cleanups.forEach((fn) => fn(ctx)),
});
