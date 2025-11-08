export const win = typeof unsafeWindow === 'undefined' ? window : unsafeWindow;

// 凍結原生物件參考，防止被覆寫
export const native = Object.freeze({
  Object: win.Object,
  Function: win.Function,
  Symbol: win.Symbol,
  Reflect: win.Reflect,
  performance: win.performance,
  setTimeout: win.setTimeout,
  Proxy: win.Proxy,
});

/**
 * 綁定方法到原始 this（避免被覆寫的 prototype 污染）
 * @param obj 要處理的對象
 */
export function bindAll<T extends object>(obj: T): T {
  const result: T = {} as T;
  for (const key of native.Reflect.ownKeys(obj) as (keyof T)[]) {
    const value = obj[key];
    result[key] = typeof value === 'function' ? value.bind(obj) : value;
  }
  return result;
}

/** 綁定後的原生安全版本 */
export const bound = Object.freeze({
  Object: bindAll(native.Object),
  Function: bindAll(native.Function),
  Symbol: native.Symbol,
  Reflect: bindAll(native.Reflect),
  performance: native.performance,
  setTimeout: native.setTimeout.bind(win),
  Proxy: native.Proxy,
});

/**
 * 建立一個 hook：攔截函式呼叫與建構行為
 * @param targetObj 目標物件
 * @param propName 屬性名稱
 * @param interceptor 攔截邏輯 (original, ...args)
 * @returns unhook 函式
 */
export const hook = <
  T extends object,
  K extends {
    [P in keyof T]: T[P] extends (...args: any[]) => any ? P : never;
  }[keyof T]
>(
  targetObj: T,
  propName: K,
  interceptor: (
    this: T,
    original: T[K],
    ...args: T[K] extends (...args: infer A) => any ? A : never
  ) => T[K] extends (...args: any[]) => infer R ? R : never
) => {
  const original = targetObj[propName];
  if (typeof original !== 'function') {
    throw new TypeError(`Hook target ${String(propName)} is not a function`);
  }

  const proxy = new bound.Proxy(original, {
    apply(target, thisArg, args) {
      return bound.Reflect.apply(interceptor, thisArg, [target, ...args]);
    },
    construct(target, args, newTarget) {
      return bound.Reflect.construct(target, args, newTarget);
      // return interceptor.apply(null, [target, ...args]);
    },
    get(target, key, receiver) {
      if (key === 'toString') {
        return () => bound.Function.prototype.toString.call(original);
      }
      return bound.Reflect.get(target, key, receiver);
    },
  });

  targetObj[propName] = proxy;

  // unhook
  return () => {
    targetObj[propName] = original;
  };
};
