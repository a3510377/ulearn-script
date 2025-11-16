import { blockPropertyEventAssignment, registerEventHook } from './event-hooks';
import { bound, hook, win } from './utils';

import { skipHookFunc } from '..';

export const combineCleanups = (...cleanups: (() => void)[]) => {
  return () => {
    for (const c of cleanups) {
      try {
        c();
      } catch {}
    }
  };
};

// visibility, fullscreen, focus status
export const blockVisibilitySetup = () => {
  const cleanups: (() => void)[] = [];

  // Property spoofing: hidden / visibilityState / hasFocus
  const origHidden = Object.getOwnPropertyDescriptor(
    Document.prototype,
    'hidden'
  );
  const origVis = Object.getOwnPropertyDescriptor(
    Document.prototype,
    'visibilityState'
  );
  Object.defineProperty(Document.prototype, 'hidden', {
    configurable: true,
    get: () => false,
  });

  Object.defineProperty(Document.prototype, 'visibilityState', {
    configurable: true,
    get: () => 'visible',
  });

  cleanups.push(hook(Document.prototype, 'hasFocus', () => true));

  cleanups.push(() => {
    if (origHidden) {
      Object.defineProperty(Document.prototype, 'hidden', origHidden);
    } else delete (Document.prototype as any).hidden;

    if (origVis) {
      Object.defineProperty(Document.prototype, 'visibilityState', origVis);
    } else delete (Document.prototype as any).visibilityState;
  });

  // Event blocking
  const visibilityEvents = [
    'visibilitychange',
    'webkitvisibilitychange',
    'mozvisibilitychange',
    'msvisibilitychange',
    'fullscreenchange',
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'MSFullscreenChange',
    'focus',
  ];

  for (const ev of visibilityEvents) {
    blockPropertyEventAssignment(win, ev);
    win.addEventListener(
      ev,
      skipHookFunc((e) => e.stopPropagation()),
      true
    );
    cleanups.push(registerEventHook(ev).disable);
  }

  return combineCleanups(...cleanups);
};

// beforeunload, unload, pagehide, pageshow
export const blockLifecycleSetup = () => {
  const handler = skipHookFunc((e: Event) => e.stopImmediatePropagation());
  const events = ['beforeunload', 'unload', 'pagehide', 'pageshow'];

  for (const ev of events) {
    win.addEventListener(ev, handler, true);
    blockPropertyEventAssignment(win, ev);
  }

  return () => {
    for (const ev of events) {
      win.removeEventListener(ev, handler, true);
    }
  };
};

// requestAnimationFrame 安全偽裝
export const blockRafSetup = () => {
  return hook(
    win,
    'requestAnimationFrame',
    function (original, cb: FrameRequestCallback) {
      const wrapped = (ts?: number) => cb(ts ?? bound.performance.now());
      return bound.Reflect.apply(original, win, [wrapped]);
    }
  );
};
