import { bound, hook, win } from './utils';

import { skipHookFunc } from '..';

export type URLMatcher = string | RegExp | ((url: string) => boolean);
export type TransformFn = (text: string) => string | null;

export interface RequestHookItem {
  urlMatcher: URLMatcher;
  transform: TransformFn;
  enabled: boolean;
}

export interface HookController {
  enable: () => void;
  disable: () => void;
  isEnabled: () => boolean;
}

const requestHookRegistry: RequestHookItem[] = [];

export const registerRequestHook = (
  urlMatcher: URLMatcher,
  transform: TransformFn
): HookController => {
  const item: RequestHookItem = {
    urlMatcher,
    transform,
    enabled: true,
  };

  requestHookRegistry.push(item);

  return {
    enable: () => (item.enabled = true),
    disable: () => (item.enabled = false),
    isEnabled: () => item.enabled,
  };
};

const matchUrl = (url: string, matcher: URLMatcher) => {
  if (typeof matcher === 'string') return url === matcher;
  if (matcher instanceof RegExp) {
    let urlObj: URL;

    if (
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('//')
    ) {
      urlObj = new URL(url);
      if (urlObj.origin !== win.location.origin) return false;
    } else urlObj = new URL(url, win.location.origin);

    return matcher.test(urlObj.pathname);
  }
  if (typeof matcher === 'function') return matcher(url);
  return false;
};

export const runRequestHooks = (url: string, text: string) => {
  let newText = text;

  for (const h of requestHookRegistry) {
    if (!h.enabled) continue;

    try {
      if (matchUrl(url, h.urlMatcher)) {
        const result = h.transform(newText);
        if (result !== null && result !== newText) {
          newText = result;
        }
      }
    } catch (e) {
      console.error('[RequestHook] hook error', e);
    }
  }

  return newText;
};

const overrideXHR = () => {
  const XHR: typeof XMLHttpRequest | undefined = win.XMLHttpRequest;
  if (!XHR) {
    console.error('XMLHttpRequest not found, not installing hook');
    return;
  }

  hook(XHR.prototype, 'open', function (original, ...args) {
    const [_method, url] = args;
    (this as any).__xhr_url = url;

    return bound.Reflect.apply(original, this, args);
  });

  hook(XHR.prototype, 'send', function (original, ...args) {
    const xhr = this as XMLHttpRequest & { __xhr_url?: string };

    let patched = false;
    const patchResponse = (rawText: string) => {
      if (patched) return;

      patched = true;
      const newText = runRequestHooks(xhr.__xhr_url ?? '', rawText);
      if (newText === rawText) return;

      Object.defineProperty(xhr, 'responseText', {
        configurable: true,
        enumerable: true,
        get: () => newText,
      });

      let parseCached: any;
      let hasCached = false;
      Object.defineProperty(xhr, 'response', {
        configurable: true,
        enumerable: true,
        get: () => {
          if (!hasCached) {
            try {
              parseCached = JSON.parse(newText);
            } catch {
              parseCached = newText;
            }
            hasCached = true;
          }

          return parseCached;
        },
      });
    };

    const onReady = skipHookFunc(() => {
      try {
        const raw = xhr.responseText;
        if (typeof raw === 'string' && raw.length > 0) {
          patchResponse(raw);
        }
      } catch (e) {
        console.error('[RequestHook] XHR onReady error', e);
      }
    });

    xhr.addEventListener(
      'readystatechange',
      skipHookFunc(() => xhr.readyState >= 3 && onReady())
    );
    xhr.addEventListener('load', onReady);

    return bound.Reflect.apply(original, this, args);
  });
};

const overrideFetch = () => {
  hook(window, 'fetch', async function (original, ...args) {
    const [input] = args;
    const response = await bound.Reflect.apply(original, this, args);

    try {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof Request
          ? input.url
          : input.toString();

      const clone = response.clone();
      const rawText = await clone.text();
      const newText = runRequestHooks(url, rawText);
      if (newText !== rawText) {
        const modifiedResponse = new Response(newText, {
          status: clone.status,
          statusText: clone.statusText,
          headers: clone.headers,
        });
        return modifiedResponse;
      }
    } catch (e) {
      console.error('[RequestHook] fetch hook error', e);
    }
    return response;
  });
};

export const createRequestHookGroup = (
  hooks: {
    urlMatcher: URLMatcher;
    transform: TransformFn;
  }[],
  enabled: boolean = true
) => {
  const controllers: HookController[] = [];

  for (const h of hooks) {
    const c = registerRequestHook(h.urlMatcher, h.transform);
    if (!enabled) c.disable();
    controllers.push(c);
  }

  return {
    hooks: controllers,
    enable: () => controllers.forEach((h) => h.enable()),
    disable: () => controllers.forEach((h) => h.disable()),
  };
};

export const overrideRequest = () => {
  overrideXHR();
  overrideFetch();
};

overrideRequest();
