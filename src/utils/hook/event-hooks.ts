import { bound, hook, win } from './utils';

import { isHookSkipped } from '..';

export type PreHookCheckFn = (
  this: EventTarget,
  target: EventTarget
) => boolean | void;
export type PreCallCheckFn = (
  this: EventTarget,
  ev: Event,
  target: EventTarget
) => boolean | void;

interface EventHook {
  type: string;
  preHookCheck?: PreHookCheckFn;
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
        hookItem.some((hook) => hook.preHookCheck?.call(this, this) === true)
      ) {
        return bound.Reflect.apply(original, this, [type, listener, options]);
      }

      const wrappedListener = function (this: EventTarget, ev: Event) {
        if (
          hookItem === undefined ||
          hookItem.some(
            (hook) =>
              hook.enabled && hook.preCallCheck?.call(this, ev, this) === true
          )
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
      options.preHookCheck.call(target, target) === true
    ) {
      target.addEventListener(ev, handler, true);
    }
  }

  return () => {
    for (const ev of events) target.removeEventListener(ev, handler, true);
    cleanupHooks.forEach((cleanup) => cleanup());
  };
};

export const createHookGroup = (
  events: string[],
  enabled: boolean,
  filter?: (e: Event) => boolean | void
) => {
  const hooks: HookController[] = [];

  for (const ev of events) {
    const reg = registerEventHook(ev, undefined, filter);
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
