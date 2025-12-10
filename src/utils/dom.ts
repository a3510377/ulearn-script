import { MK_CUSTOM_COMPONENT } from '@/constants';

import { win } from './hook/utils';

import { poll, skipHookFunc } from '.';

export const parseClass = (
  ...classNames: (string | string[] | undefined)[]
): string[] => {
  return classNames.flatMap((className) => {
    if (typeof className === 'string') {
      return className.trim().split(/\s+/).filter(Boolean);
    }
    return className || [];
  });
};

export const createElement = <K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  ...className: (string | string[])[]
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tagName);
  element.classList.add(MK_CUSTOM_COMPONENT, ...parseClass(...className));
  return element;
};

export const waitForElement = <T extends Element = HTMLElement>(
  selector: string,
  timeoutMs = 10e3
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const query = (): T | null => document.querySelector(selector) as T | null;

    const el = query();
    if (el) {
      resolve(el);
      return;
    }

    const cleanup = (
      observer: MutationObserver | null,
      timeoutId: ReturnType<typeof setTimeout>
    ) => {
      observer?.disconnect();
      clearTimeout(timeoutId);
    };

    let observer: MutationObserver | null = null;
    const timeoutId = setTimeout(() => {
      cleanup(observer, timeoutId);
      reject(
        new DOMException(
          `waitForElement: '${selector}' not found within ${timeoutMs}ms`,
          'TimeoutError'
        )
      );
    }, timeoutMs);

    observer = new MutationObserver(() => {
      const el = query();
      if (el) {
        cleanup(observer, timeoutId);
        resolve(el);
      }
    });

    const startObserve = skipHookFunc(() => {
      observer.observe(document.body, { childList: true, subtree: true });
    });

    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', startObserve, { once: true });
    } else {
      startObserve();
    }
  });
};

export const waitForVue = <T extends Element = HTMLElement>(
  element: T,
  { timeout = 5000, vnode = false }: { timeout?: number; vnode?: boolean }
): Promise<VueElement<T>> => {
  const vueEl = element as VueElement<T>;

  return poll(() => {
    const vueApp = vueEl.__vue_app__;
    if (vueApp && (!vnode || vueEl._vnode)) {
      return { value: vueEl };
    }
  }, timeout);
};

export const createStyle = (
  code: string,
  node: Element = document.head
): HTMLStyleElement => {
  const css = createElement('style', 'mk-style');
  css.textContent = code;
  node.append(css);

  return css;
};

export const createSvgFromString = (
  svgString: string,
  className?: string | string[]
): SVGSVGElement => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = doc.documentElement as unknown as SVGSVGElement;

  svgElement.classList.add(
    ...parseClass(className),
    'mk-svg',
    MK_CUSTOM_COMPONENT
  );

  return svgElement;
};

export const onClickOutside = (
  target: Element,
  handler: (event: MouseEvent) => void,
  ignore: (string | Element)[] = []
) => {
  if (!target) return () => {};

  const shouldIgnore = (ev: MouseEvent) => {
    const path = ev.composedPath();
    return ignore.some((item) => {
      if (typeof item === 'string') {
        return Array.from(document.querySelectorAll(item)).some(
          (el) => el === ev.target || path.includes(el)
        );
      } else {
        return item && (item === ev.target || path.includes(item));
      }
    });
  };

  const listener = skipHookFunc((event: MouseEvent) => {
    if (
      event.target &&
      !target.contains(event.target as Node) &&
      !shouldIgnore(event)
    ) {
      handler(event);
    }
  });

  document.addEventListener('click', listener);

  // Return stop function
  return () => document.removeEventListener('click', listener);
};

export const watchRemove = (el: Element, callback: (el: Element) => void) => {
  if (!el.parentNode) return;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const removedNode of mutation.removedNodes) {
        if (removedNode === el || removedNode.contains?.(el)) {
          cleanup();
          callback(el);
          return;
        }
      }
    }

    if (!document.body.contains(el)) {
      cleanup();
      callback(el);
    }
  });

  const cleanup = () => observer.disconnect();

  observer.observe(el.parentNode, { childList: true, subtree: true });

  // TODO Check need this ?
  const interval = setInterval(() => {
    if (!document.body.contains(el)) {
      clearInterval(interval);
      cleanup();
      callback(el);
    }
  }, 2000);

  return () => {
    clearInterval(interval);
    cleanup();
  };
};

export const waitForLibrary = <K extends keyof Window>(
  globalVar: K,
  timeout = 5000
): Promise<NonNullable<Window[K]>> => {
  return poll<NonNullable<Window[K]>>(() => {
    const lib = win[globalVar];

    if (
      lib !== null &&
      (typeof lib === 'object' || typeof lib === 'function')
    ) {
      return { value: lib };
    }
  }, timeout).catch((err) => {
    throw new Error(
      `waitForLibrary: '${globalVar}' not found within ${timeout}ms: ${err.message}`
    );
  });
};

export const waitForJQuery = (timeout = 5000) => {
  return waitForLibrary('jQuery', timeout);
};

export const waitForAngular = (timeout = 5000) => {
  return waitForLibrary('angular', timeout);
};

export type VueElement<T extends Element = HTMLElement> = T & {
  __vue_app__: {};
  _vnode: {
    component: {
      props: Record<string, any>;
    };
  };
};
