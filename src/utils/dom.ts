import { MK_CUSTOM_COMPONENT } from '@/constants';

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
    // TODO: add alert
  });
};

export const createStyle = (
  code: string,
  node: Element = document.head
): HTMLStyleElement => {
  const css = document.createElement('style');
  css.classList.add('mk-style', MK_CUSTOM_COMPONENT);
  css.textContent = code;
  node.appendChild(css);

  return css;
};

export const createSvgFromString = (
  svgString: string,
  node: Element = document.body
): SVGSVGElement => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgElement = doc.documentElement as unknown as SVGSVGElement;

  svgElement.classList.add('mk-svg', MK_CUSTOM_COMPONENT);
  node.appendChild(svgElement);

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
