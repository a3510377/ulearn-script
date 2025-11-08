import { MK_CUSTOM_COMPONENT } from '@/constants';

import { win } from './hook/dev-tool';

export const parseClass = (
  ...classNames: (string | string[] | undefined)[]
): string[] => {
  return classNames.flatMap((className) =>
    Array.isArray(className)
      ? className
      : className?.trim().split(/\s+/).filter(Boolean) || []
  );
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

    let observer: MutationObserver | null = null;
    const timeoutId = setTimeout(() => {
      if (observer) observer.disconnect();
      reject(
        new Error(
          `waitForElement: '${selector}' not found within ${timeoutMs}ms`
        )
      );
    }, timeoutMs);

    observer = new MutationObserver(() => {
      const el = query();
      if (el) {
        clearTimeout(timeoutId);
        observer?.disconnect();
        resolve(el);
      }
    });

    const startObservingDOM = () => {
      observer.observe(document.body, { childList: true, subtree: true });
    };

    if (!document.body) {
      window.addEventListener('DOMContentLoaded', startObservingDOM, {
        once: true,
      });
    } else startObservingDOM();
  });
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

  const shouldIgnore = (event: MouseEvent) =>
    ignore.some((item) => {
      if (typeof item === 'string') {
        return Array.from(document.querySelectorAll(item)).some(
          (el) => el === event.target || event.composedPath().includes(el)
        );
      } else {
        return (
          item && (item === event.target || event.composedPath().includes(item))
        );
      }
    });

  const listener = (event: MouseEvent) => {
    if (
      event.target &&
      !target.contains(event.target as Node) &&
      !shouldIgnore(event)
    ) {
      handler(event);
    }
  };

  document.addEventListener('click', listener);

  // Return stop function
  return () => document.removeEventListener('click', listener);
};

export const watchRemove = (el: Element, callback: (el: Element) => void) => {
  if (!el || !el.parentNode) return;

  let parent = el.parentNode;
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const removedNode of mutation.removedNodes) {
        if (removedNode === el || (removedNode.contains?.(el) ?? false)) {
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

  observer.observe(parent, { childList: true, subtree: true });

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
  const interval = 50;
  const maxTries = timeout / interval;
  let tries = 0;
  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      tries++;
      if (
        win[globalVar] &&
        (typeof win[globalVar] === 'object' ||
          typeof win[globalVar] === 'function')
      ) {
        clearInterval(timer);
        resolve(win[globalVar]);
      } else if (tries >= maxTries) {
        clearInterval(timer);
        reject(new Error(`${globalVar} not found within timeout`));
      }
    }, interval);
  });
};

export const waitForJQuery = (timeout = 5000) => {
  return waitForLibrary('jQuery', timeout);
};

export const waitForAngular = (timeout = 5000) => {
  return waitForLibrary('angular', timeout);
};

export const addHref = async (
  querySelector: string,
  href: string,
  className: string | string[]
) => {
  const el = await waitForElement(querySelector).catch(() => null);
  if (el) {
    const hrefEl = createElement('a', 'mk-custom-link', className);
    hrefEl.setAttribute('ng-href', href);

    el.parentNode?.insertBefore(hrefEl, el);
    hrefEl.append(el);
  }
};
