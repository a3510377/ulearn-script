import { bound, hook, win } from './utils';

export type CustomAddEventHandle = (
  this: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject | null,
  options?: boolean | AddEventListenerOptions
) => boolean;

// 紀錄所有自訂事件攔截器
export const customAddEventHandles: Record<string, CustomAddEventHandle[]> = {};

let _setup = false;

// 安裝 add/remove 的 hook（僅一次）
export const setupCustomAddEvent = () => {
  if (_setup) return;
  _setup = true;

  const unhooks: (() => void)[] = [];

  // 攔截 addEventListener
  unhooks.push(
    hook(
      EventTarget.prototype,
      'addEventListener',
      function (
        original,
        type: string,
        listener: EventListenerOrEventListenerObject | null,
        options?: boolean | AddEventListenerOptions
      ) {
        try {
          if (
            customAddEventHandles[type]?.some((fn) => {
              try {
                return fn.call(this, type, listener, options) === true;
              } catch {
                return false;
              }
            })
          ) {
            return;
          }
        } catch {}

        return bound.Reflect.apply(original, this, [type, listener, options]);
      }
    )
  );

  // 攔截 removeEventListener （行為不變）
  unhooks.push(
    hook(
      EventTarget.prototype,
      'removeEventListener',
      function (original, type, listener, options) {
        return bound.Reflect.apply(original, this, [type, listener, options]);
      }
    )
  );

  // 暫存 unhook 以便未來還原
  const SYM = Symbol.for('__event_add_remove_unhooks__');
  (EventTarget.prototype as any)[SYM] = unhooks;
};

// 加入某事件類型的自訂 hook
export const addEventHook = (event: string, fn: CustomAddEventHandle) => {
  (customAddEventHandles[event] ||= []).push(fn);
};

// 移除 hook
export const removeEventHook = (event: string, fn: CustomAddEventHandle) => {
  const list = customAddEventHandles[event];
  if (!list) return;

  const i = list.indexOf(fn);
  if (i !== -1) list.splice(i, 1);
};

// 封鎖 onXXX handler
export const defineBlockedHandler = (target: any, ev: string) => {
  const prop = `on${ev}`;
  if (!(prop in target)) return;
  const desc = Object.getOwnPropertyDescriptor(target, prop);
  if (desc?.configurable === false) return;

  Object.defineProperty(target, prop, {
    configurable: true,
    enumerable: true,
    get: () => undefined,
    set: () => {
      bound.Reflect.apply(bound.Function.prototype.call, console.log, [
        console,
        `[blockEvents] Prevented assignment to ${prop}`,
      ]);
    },
  });
};

export type BlockStrategy = 'propagation' | 'immediate' | 'prevent';

// 封鎖一組事件（可指定策略）
export const blockEvents = (
  events: string[],
  target: EventTarget = win,
  strategy: BlockStrategy = 'propagation'
) => {
  const handler = (e: Event) => {
    if (strategy === 'propagation') e.stopPropagation();
    else if (strategy === 'immediate') e.stopImmediatePropagation();
    else if (strategy === 'prevent') e.preventDefault();
  };

  for (const ev of events) {
    defineBlockedHandler(target, ev);
    target.addEventListener(ev, handler, true);
    addEventHook(ev, () => true);
  }
};
