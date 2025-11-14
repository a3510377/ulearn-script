import type { CustomAddEventHandle } from './event-hooks';
import {
  addEventHook,
  blockEvents,
  defineBlockedHandler,
  removeEventHook,
} from './event-hooks';
import { bound, hook, win } from './utils';

export const combineCleanups = (...cleanups: (() => void)[]) => {
  return () => {
    for (const c of cleanups) {
      try {
        c();
      } catch {}
    }
  };
};

// 可見度 + 視窗狀態偽裝 (visibility, fullscreen, focus 狀態)
export const blockVisibilitySetup = () => {
  const cleanups: (() => void)[] = [];

  // ---- 屬性偽裝：hidden / visibilityState / hasFocus ----
  const origHidden = Object.getOwnPropertyDescriptor(
    Document.prototype,
    'hidden'
  );
  const origVis = Object.getOwnPropertyDescriptor(
    Document.prototype,
    'visibilityState'
  );
  const origHasFocus = Document.prototype.hasFocus;

  Object.defineProperty(Document.prototype, 'hidden', {
    configurable: true,
    get: () => false,
  });

  Object.defineProperty(Document.prototype, 'visibilityState', {
    configurable: true,
    get: () => 'visible',
  });

  Document.prototype.hasFocus = () => true;

  cleanups.push(() => {
    if (origHidden) {
      Object.defineProperty(Document.prototype, 'hidden', origHidden);
    } else delete (Document.prototype as any).hidden;

    if (origVis) {
      Object.defineProperty(Document.prototype, 'visibilityState', origVis);
    } else delete (Document.prototype as any).visibilityState;

    Document.prototype.hasFocus = origHasFocus;
  });

  // ---- 事件封鎖 ----
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

  const alwaysTrue: CustomAddEventHandle = () => true;

  for (const ev of visibilityEvents) {
    defineBlockedHandler(win, ev);
    win.addEventListener(ev, (e) => e.stopPropagation(), true);
    addEventHook(ev, alwaysTrue);
  }

  cleanups.push(() => {
    for (const ev of visibilityEvents) removeEventHook(ev, alwaysTrue);
  });

  return combineCleanups(...cleanups);
};

// DOM 限制類事件 (copy, paste, drag, select …)
export const blockDomLimitSetup = () => {
  blockEvents(
    [
      'contextmenu',
      'copy',
      'cut',
      'paste',
      'drag',
      'dragstart',
      'select',
      'selectstart',
    ],
    document,
    'propagation'
  );
  return () => {};
};

// Focus 事件 (focus / focusin / focusout)
export const blockFocusSetup = () => {
  const cleanups: (() => void)[] = [];
  const handler = (e: Event) => e.stopPropagation();

  for (const ev of ['focus', 'focusin', 'focusout']) {
    win.addEventListener(ev, handler, true);
    document.addEventListener(ev, handler, true);
  }

  cleanups.push(() => {
    for (const ev of ['focus', 'focusin', 'focusout']) {
      win.removeEventListener(ev, handler, true);
      document.removeEventListener(ev, handler, true);
    }
  });

  return combineCleanups(...cleanups);
};

// Blur 事件
export const blockBlurSetup = () => {
  const blurHook: CustomAddEventHandle = function () {
    return this instanceof Window || this instanceof Document;
  };

  addEventHook('blur', blurHook);
  defineBlockedHandler(win, 'blur');

  return () => removeEventHook('blur', blurHook);
};

// 頁面生命週期事件 (beforeunload, unload, pagehide, pageshow)
export const blockLifecycleSetup = () => {
  const handler = (e: Event) => e.stopImmediatePropagation();
  const events = ['beforeunload', 'unload', 'pagehide', 'pageshow'];

  for (const ev of events) {
    win.addEventListener(ev, handler, true);
    defineBlockedHandler(win, ev);
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
