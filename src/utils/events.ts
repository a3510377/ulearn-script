export const customAddEventHandles: {
  [eventname: string]: CustomAddEventHandle[];
} = {};

let _setup = false;
export const setupCustomAddEvent = () => {
  if (_setup) return;
  _setup = true;

  const origAdd = EventTarget.prototype.addEventListener;
  const origRemove = EventTarget.prototype.removeEventListener;

  EventTarget.prototype.addEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ) {
    if (
      customAddEventHandles[type]?.some(
        (fn) => fn.call(this, type, listener, options) === true
      )
    ) {
      return;
    }
    return origAdd.call(this, type, listener, options);
  };

  // Make toString() look native for both add/removeEventListener
  [origAdd, origRemove].forEach((fn, i) => {
    const name = i === 0 ? 'addEventListener' : 'removeEventListener';
    Function.prototype.toString = new Proxy(Function.prototype.toString, {
      apply(target, thisArg, args) {
        if (thisArg === fn) {
          return `function ${name}() { [native code] }`;
        }
        return Reflect.apply(target, thisArg, args);
      },
    });
  });
};

export const addEventHook = (event: string, fn: CustomAddEventHandle) => {
  (customAddEventHandles[event] ||= []).push(fn);
};

export const removeEventHook = (event: string, fn: CustomAddEventHandle) => {
  if (!customAddEventHandles[event]) return;
  const index = customAddEventHandles[event].indexOf(fn);
  if (index > -1) customAddEventHandles[event].splice(index, 1);
};

export const defineBlockedHandler = (target: any, ev: string) => {
  const prop = `on${ev}`;
  if (!(prop in target)) return;
  if (Object.getOwnPropertyDescriptor(target, prop)?.configurable === false)
    return;

  Object.defineProperty(target, prop, {
    configurable: true,
    get: () => undefined,
    set: () => console.log(`[blockEvents] Prevented assignment to ${prop}`),
  });
};

export const blockEvents = (
  events: string[],
  target: EventTarget = window,
  strategy: BlockStrategy = 'propagation'
) => {
  const handler = (e: Event) => {
    if (strategy === 'propagation') e.stopPropagation();
    if (strategy === 'immediate') e.stopImmediatePropagation();
    if (strategy === 'prevent') e.preventDefault();
  };
  events.forEach((ev) => {
    defineBlockedHandler(target, ev);
    addEventHook(ev, () => true);
    target.addEventListener(ev, handler, true);
  });
};

// 有些是多寫的，防止未來改版
export const blockEventsSetup = () => {
  setupCustomAddEvent();

  // Fake document visibility API (patch on prototype for stealth)
  Object.defineProperty(Document.prototype, 'hidden', { get: () => false });
  Object.defineProperty(Document.prototype, 'visibilityState', {
    get: () => 'visible',
  });
  Document.prototype.hasFocus = () => true;

  const alwaysTrue = () => true;

  // Common "page leave" / "visibility" events
  [
    'visibilitychange',
    'webkitvisibilitychange',
    'mozvisibilitychange',
    'msvisibilitychange',
    'fullscreenchange',
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'MSFullscreenChange',
    'focus',
  ].forEach((ev) => {
    defineBlockedHandler(window, ev);
    addEventHook(ev, alwaysTrue);
  });

  // Block common DOM restriction events
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

  // Block focus-related events globally
  ['focus', 'focusin', 'focusout'].forEach((ev) => {
    window.addEventListener(ev, (e) => e.stopPropagation(), true);
    document.addEventListener(ev, (e) => e.stopPropagation(), true);
  });

  // Special handling for blur (only block on Window/Document)
  addEventHook('blur', function () {
    return this instanceof Window || this instanceof Document;
  });
  defineBlockedHandler(window, 'blur');

  // Block page unload/navigation events
  ['beforeunload', 'unload', 'pagehide', 'pageshow'].forEach((ev) => {
    window.addEventListener(ev, (e) => e.stopImmediatePropagation(), true);
    defineBlockedHandler(window, ev);
  });

  // Wrap requestAnimationFrame
  const _raf = window.requestAnimationFrame;
  window.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    return _raf.call(window, (ts) => cb(ts || performance.now()));
  };
};

export type CustomAddEventHandle = (
  this: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject | null,
  options?: boolean | AddEventListenerOptions
) => boolean;

type BlockStrategy = 'propagation' | 'immediate' | 'prevent';
