import { bound, hook, win } from './utils';

import { isHookSkipped } from '..';

export type PreHookCheckFn = (
  this: EventTarget,
  type: string,
  target: EventTarget
) => boolean | void;
export type PreCallCheckFn = (
  this: EventTarget,
  ev: Event,
  target: EventTarget
) => boolean | void;

interface EventHook {
  type: string;
  /**
   * 當 未設定 或 不返回 false，將注入 hook
   * 若果多個 Hook 同時存在，則只要有一個 Hook 返回 false 就會允許事件調用
   */
  preHookCheck?: PreHookCheckFn;
  /**
   * 當 未設定 或返回 true ，將阻止使用者的註冊事件被調用
   * 若果多個 Hook 同時存在，則只要有一個 Hook 返回 true 就會阻止事件調用
   */
  preCallCheck?: PreCallCheckFn;
  enabled: boolean;
}

export interface HookController {
  enable: () => void;
  disable: () => void;
  isEnabled: () => boolean;
}

const eventHookRegistry = new Map<string, EventHook[]>();
const listenerWrapperMap = new WeakMap<
  EventListenerOrEventListenerObject,
  EventListener
>();

export const registerEventHook = (
  type: string,
  preHookCheck?: PreHookCheckFn,
  preCallCheck?: PreCallCheckFn
): HookController => {
  const hookItem: EventHook = {
    type,
    preHookCheck,
    preCallCheck,
    enabled: true,
  };

  let hooks = eventHookRegistry.get(type);
  if (!hooks) {
    hooks = [];
    eventHookRegistry.set(type, hooks);
  }
  hooks.push(hookItem);

  return {
    enable: () => (hookItem.enabled = true),
    disable: () => (hookItem.enabled = false),
    isEnabled: () => hookItem.enabled,
  };
};

export const overrideEventListener = () => {
  hook(
    EventTarget.prototype,
    'addEventListener',
    function (original, type, listener, options) {
      const realListener =
        typeof listener === 'function' ? listener : listener?.handleEvent;
      if (!listener || !realListener || isHookSkipped(realListener)) {
        return bound.Reflect.apply(original, this, [type, listener, options]);
      }

      const hookItem = eventHookRegistry.get(type);
      if (
        !hookItem ||
        hookItem.some(
          (hook) => hook.preHookCheck?.call(this, type, this) === false
        )
      ) {
        return bound.Reflect.apply(original, this, [type, listener, options]);
      }

      const wrappedListener = function (this: EventTarget, ev: Event) {
        if (
          hookItem.some(
            (h) => h.enabled && h.preCallCheck?.call(this, ev, this) === true
          ) ||
          hookItem.every((h) => !h.enabled || h.preCallCheck === undefined)
        ) {
          return;
        }
        realListener.call(this, ev);
      };

      listenerWrapperMap.set(listener, wrappedListener);
      return bound.Reflect.apply(original, this, [
        type,
        wrappedListener,
        options,
      ]);
    }
  );

  hook(
    EventTarget.prototype,
    'removeEventListener',
    function (original, type, listener, options) {
      if (!listener) {
        return bound.Reflect.apply(original, this, [type, listener, options]);
      }

      const wrapped = listenerWrapperMap.get(listener) || listener;
      return bound.Reflect.apply(original, this, [type, wrapped, options]);
    }
  );
};

export const blockPropertyEventAssignment = (
  target: any,
  eventName: string
) => {
  const prop = `on${eventName}`;
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

export const disableEvents = (
  events: string[],
  target: EventTarget = win,
  strategy: BlockStrategy = 'propagation',
  enabled: boolean = true,
  options: {
    preHookCheck?: PreHookCheckFn;
    preCallCheck?: PreCallCheckFn;
  } = {}
) => {
  const strategyHandlers: Record<BlockStrategy, (e: Event) => void> = {
    propagation: function (this: EventTarget, e: Event) {
      if (options.preCallCheck?.call(this, e, this) === true) {
        e.stopPropagation();
      }
    },
    immediate: function (this: EventTarget, e: Event) {
      if (options.preCallCheck?.call(this, e, this) === true) {
        e.stopImmediatePropagation();
      }
    },
    prevent: function (this: EventTarget, e: Event) {
      if (options.preCallCheck?.call(this, e, this) === true) {
        e.preventDefault();
      }
    },
  };

  const handler = strategyHandlers[strategy];
  const cleanupHooks: (() => void)[] = [];

  for (const ev of events) {
    // blockPropertyEventAssignment(target, ev);
    const reg = registerEventHook(ev);
    if (!enabled) reg.disable();
    cleanupHooks.push(reg.disable);

    if (
      options.preHookCheck === undefined ||
      options.preHookCheck.call(target, ev, target) === true
    ) {
      target.addEventListener(ev, handler, true);
    }
  }

  return () => {
    for (const ev of events) target.removeEventListener(ev, handler, true);
    cleanupHooks.forEach((cleanup) => cleanup());
  };
};

export const createEventHookGroup = (
  events: string[],
  enabled: boolean,
  options: {
    preHookCheck?: PreHookCheckFn;
    preCallCheck?: PreCallCheckFn;
  } = {}
) => {
  const hooks: HookController[] = [];

  for (const ev of events) {
    const reg = registerEventHook(
      ev,
      options.preHookCheck,
      options.preCallCheck
    );
    if (!enabled) reg.disable();
    hooks.push(reg);
  }

  return {
    hooks,
    enable: () => hooks.forEach((h) => h.enable()),
    disable: () => hooks.forEach((h) => h.disable()),
  };
};

overrideEventListener();
