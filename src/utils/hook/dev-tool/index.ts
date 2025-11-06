import { bound, hook, win } from './utils';

export * from './utils';

declare const Function: Function;

export const disableDevToolDetector = () => {
  const isToStringModified = (obj: any): boolean => {
    const fn = obj?.toString;
    if (typeof fn !== 'function') return false;

    const src = bound.Function.prototype.toString.call(fn);
    // for faster checking
    return (
      src.charAt(0) !== 'f' ||
      src.charAt(9) !== 'o' ||
      src.indexOf('[native code]') === -1
    );
  };

  hook(console, 'log', function (log, obj, ...args) {
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

    return log.apply(this, args);
  });

  hook(
    console,
    'table',
    function (
      table: (...args: any[]) => void,
      obj: Record<PropertyKey, any>,
      ...rest
    ) {
      for (const prop of bound.Reflect.ownKeys(obj)) {
        const val = obj[prop as keyof typeof obj];
        if (val instanceof RegExp && isToStringModified(val)) {
          return table.call(this);
        }
      }

      return table.call(this, obj, ...rest);
    }
  );

  function hookFunctionDebugger(this: any, target: Function, ...args: any[]) {
    const code = args.at(-1) as string;

    return code.replace(/\s|;/g, '') === 'debugger'
      ? bound.Reflect.apply(target, this, [])
      : bound.Reflect.apply(target, this, args);
  }

  hook(Function.prototype, 'constructor', hookFunctionDebugger);
  hook(win, 'Function', hookFunctionDebugger);

  const hookTimeFunc = <T extends object>(
    obj: T,
    funcName: keyof T | string,
    isProto = false
  ): (() => number) => {
    let currentTime: number;
    const original = isProto
      ? (obj as any).prototype[funcName]
      : (obj as any)[funcName].bind(obj);

    hook(
      isProto ? (obj as any).prototype : obj,
      funcName as any,
      (..._args: any[]) => currentTime
    );

    const scheduleNext = () =>
      setTimeout(() => {
        currentTime = isProto ? original.call(new (obj as any)()) : original();
        scheduleNext();
      }, 0);
    scheduleNext();

    return original;
  };

  hookTimeFunc(window.performance, 'now');
  hookTimeFunc(Date, 'now');
  hookTimeFunc(Date, 'getTime', true);
};
