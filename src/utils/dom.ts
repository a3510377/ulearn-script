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

export const createStyle = (code: string, node?: Element): HTMLStyleElement => {
  if (node === undefined) node = document.head;
  const css = document.createElement('style');
  css.classList.add('mk-style');
  css.textContent = code;
  node.appendChild(css);

  return css;
};
