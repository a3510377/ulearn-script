import { MK_CUSTOM_COMPONENT } from '@/constants';

export const parseClass = (className?: string | string[]): string[] => {
  return Array.isArray(className)
    ? className
    : className?.trim().split(/\s+/) || [];
};

export const createElement = <K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  className?: string | string[]
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tagName);
  element.classList.add(...parseClass(className), MK_CUSTOM_COMPONENT);
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

    observer.observe(document.body, { childList: true, subtree: true });
  });
};

export const createStyle = (
  code: string,
  node: Element = document.head
): HTMLStyleElement => {
  const css = createElement('style', 'mk-style');
  css.textContent = code;
  node.appendChild(css);

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
  const parent = el.parentNode;
  if (!parent) return;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const removedNode of mutation.removedNodes) {
        if (removedNode === el) {
          callback(el);
          observer.disconnect();
          return;
        }
      }
    }
  });

  observer.observe(parent, { childList: true });

  return observer.disconnect.bind(observer);
};

export const waitForAngular = (
  timeout = 5000
): Promise<angular.IAngularStatic> => {
  const interval = 50;
  const maxTries = timeout / interval;
  let tries = 0;

  return new Promise((resolve, reject) => {
    const timer = setInterval(() => {
      tries++;
      if (unsafeWindow.angular) {
        clearInterval(timer);
        resolve(unsafeWindow.angular);
      } else if (tries >= maxTries) {
        clearInterval(timer);
        reject(new Error('Angular not found within timeout'));
      }
    }, interval);
  });
};
