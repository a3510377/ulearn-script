import { createHookGroup } from './event-hooks';
import { bound, hook, win } from './utils';

declare const Function: Function;

export interface DisableDevToolDetectorCustomOptions {
  clearConsoleOnDetect?: boolean;
}

export const disableDevToolDetector = (
  options?: DisableDevToolDetectorCustomOptions
) => {
  const toStringModifiedCache = new WeakMap<object, boolean>();
  const isToStringModified = (obj: any): boolean => {
    if (!obj || (typeof obj !== 'object' && typeof obj !== 'function')) {
      return false;
    }

    const cached = toStringModifiedCache.get(obj);
    if (cached !== undefined) return cached;

    const fn = obj?.toString;
    if (typeof fn !== 'function') {
      toStringModifiedCache.set(obj, false);
      return false;
    }

    const src = bound.Function.prototype.toString.call(fn);
    const modified =
      src.charAt(0) !== 'f' ||
      src.charAt(9) !== 'o' ||
      src.indexOf('[native code]') === -1;

    toStringModifiedCache.set(obj, modified);

    return modified;
  };

  const size = 5;
  const lastLogs = new WeakMap<object, number>();
  const LOG_INTERVAL = 300;

  const limitArg = (arg: any) => {
    if (Array.isArray(arg)) return arg.length > size ? arg.slice(0, size) : arg;

    if (arg && typeof arg === 'object') {
      const limited: Record<string, any> = {};
      let count = 0;
      for (const k in arg) {
        if (!Object.prototype.hasOwnProperty.call(arg, k)) continue;
        if (++count <= size) limited[k] = arg[k];
        else break;
      }

      return count > size ? limited : arg;
    }

    return arg;
  };

  hook(win.console, 'log', function (log, obj, ...args) {
    if (
      obj instanceof HTMLElement &&
      bound.Object.hasOwnProperty.call(obj, 'id')
    ) {
      return log.call(this);
    }

    if (
      (obj instanceof Date ||
        obj instanceof RegExp ||
        obj instanceof Function) &&
      isToStringModified(obj)
    ) {
      return log.call(this);
    }

    const now = bound.performance.now();
    if (obj && typeof obj === 'object') {
      const last = lastLogs.get(obj as object);
      if (last && now - last < LOG_INTERVAL) {
        return log.call(this, '[Repeated log suppressed]');
      }

      lastLogs.set(obj as object, now);
    }

    const origArgs = [obj, ...args];
    const processedArgs = new Array(origArgs.length);
    for (let i = 0; i < origArgs.length; i++) {
      processedArgs[i] = limitArg(origArgs[i]);
    }

    return log.apply(this, processedArgs);
  });

  hook(
    win.console,
    'table',
    function (
      table: (...args: any[]) => void,
      obj: Record<PropertyKey, any>,
      ...rest
    ) {
      const now = bound.performance.now();
      const shouldSuppress = (val: any): boolean => {
        if (val && typeof val === 'object') {
          const last = lastLogs.get(val);
          if (last && now - last < LOG_INTERVAL) return true;
          lastLogs.set(val, now);
        }
        return false;
      };

      if (shouldSuppress(obj)) {
        return table.call(this, '[Repeated table suppressed]', ...rest);
      }

      if (Array.isArray(obj)) {
        const filtered = obj.map((el) =>
          shouldSuppress(el) ? '[Repeated item suppressed]' : limitArg(el)
        );
        return table.call(this, filtered.slice(0, size), ...rest);
      }

      if (obj && typeof obj === 'object') {
        const limited: Record<string, any> = {};
        let count = 0;
        for (const key in obj) {
          if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
          const val = obj[key];
          limited[key] = shouldSuppress(val)
            ? '[Repeated item suppressed]'
            : val;
          if (++count >= size) break;
        }
        return table.call(this, limited, ...rest);
      }

      return table.call(this, obj, ...rest);
    }
  );

  hook(win.console, 'clear', function (clear) {
    if (options?.clearConsoleOnDetect !== false) {
      return clear.call(this);
    }
  });

  function hookFunctionDebugger(this: any, target: Function, ...args: any[]) {
    const code = args.at(-1) as string;

    return code.replace(/\s|;/g, '') === 'debugger'
      ? bound.Reflect.apply(target, this, [])
      : bound.Reflect.apply(target, this, args);
  }

  hook(win, 'Function', hookFunctionDebugger);
  hook(Function.prototype, 'constructor', hookFunctionDebugger);

  const keyFilter = (e: Event) => {
    if (!(e instanceof KeyboardEvent)) return false;
    const key = e.key.toLowerCase();
    const isMac = navigator.userAgent.toLowerCase().includes('macintosh');

    if (key === 'f12') return true;

    if (isMac) {
      if (e.metaKey && key === 's') return true;
      if (e.metaKey && e.altKey && key === 'u') return true;
      if (e.metaKey && e.altKey && (key === 'i' || key === 'j')) return true;
    } else {
      if (e.ctrlKey && (key === 'u' || key === 's')) return true;
      if (e.ctrlKey && e.shiftKey && (key === 'i' || key === 'j')) return true;
    }

    return false;
  };

  // TODO supper hot reload
  createHookGroup(['keyup', 'keydown', 'keypress'], true, keyFilter);

  // const hookTimeFunc = <T extends object>(
  //   obj: T,
  //   funcName: keyof T | string,
  //   isProto = false
  // ): (() => number) => {
  //   let currentTime: number;
  //   const original = isProto
  //     ? (obj as any).prototype[funcName]
  //     : (obj as any)[funcName].bind(obj);

  //   hook(
  //     isProto ? (obj as any).prototype : obj,
  //     funcName as any,
  //     (..._args) => currentTime
  //   );

  //   const scheduleNext = () =>
  //     setTimeout(() => {
  //       currentTime = isProto ? original.call(new (obj as any)()) : original();
  //       scheduleNext();
  //     }, 0);
  //   scheduleNext();

  //   return original;
  // };

  // hookTimeFunc(window.performance, 'now');
  // hookTimeFunc(Date, 'now');
  // hookTimeFunc(Date, 'getTime', true);
};
