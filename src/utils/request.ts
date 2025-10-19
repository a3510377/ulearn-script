class HttpRequestInterceptor {
  private hooks: Hook[] = [];
  private toast: Toast;

  constructor(toast?: Toast) {
    this.toast = toast || {
      show: (msg: string, opt?: unknown) => {
        console.log('[toast]', msg, opt || '');
      },
    };
    this.initXHR();
    this.initFetch();
  }

  public registerHook(urlMatcher: URLMatcher, transform: TransformFn) {
    const hook = { urlMatcher, transform };
    this.hooks.push(hook);

    // Return unregister function
    return () => {
      const index = this.hooks.indexOf(hook);
      if (index > -1) {
        this.hooks.splice(index, 1);
      }
    };
  }

  private runHooks(url: string, text: string): string {
    let newText = text;
    for (const { urlMatcher, transform } of this.hooks) {
      try {
        if (urlMatcher(url)) {
          const result = transform(newText);
          if (result !== null && result !== newText) {
            newText = result;
          }
        }
      } catch (e) {
        console.error('[XHRFetchHookManager] hook error', e);
      }
    }
    return newText;
  }

  private initXHR() {
    const root: Window =
      typeof window !== 'undefined'
        ? window
        : (globalThis as unknown as Window);

    // @ts-ignore
    const XHR: typeof XMLHttpRequest | undefined = root.XMLHttpRequest;
    if (!XHR) {
      console.error('XMLHttpRequest not found, not installing hook');
      return;
    }

    const origOpen = XHR.prototype.open;
    const origSend = XHR.prototype.send;

    XHR.prototype.open = function (
      this: XMLHttpRequest,
      method: string,
      url: string,
      async?: boolean,
      username?: string | null,
      password?: string | null
    ) {
      (this as unknown as { __xhr_url?: string }).__xhr_url = url;
      return origOpen.apply(this, [
        method,
        url,
        async ?? true,
        username ?? null,
        password ?? null,
      ]);
    };

    XHR.prototype.send = function (
      this: XMLHttpRequest,
      body?: Document | BodyInit | null
    ) {
      const xhr = this as XMLHttpRequest & { __xhr_url?: string };

      const tryOverrideResponse = (rawText: string) => {
        const newText = requestHook.runHooks(xhr.__xhr_url ?? '', rawText);
        if (newText === rawText) return false;

        Object.defineProperty(xhr, 'responseText', {
          configurable: true,
          enumerable: true,
          get: () => newText,
        });

        Object.defineProperty(xhr, 'response', {
          configurable: true,
          enumerable: true,
          get: () => {
            try {
              return JSON.parse(newText);
            } catch {
              return newText;
            }
          },
        });

        return true;
      };

      const onReady = () => {
        try {
          const raw = xhr.responseText;
          if (typeof raw === 'string' && raw.length > 0) {
            tryOverrideResponse(raw);
          }
        } catch (e) {
          console.error('[XHRFetchHookManager] onReady error', e);
        }
      };

      xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState >= 3) onReady();
      });
      xhr.addEventListener('load', onReady);

      return origSend.apply(this, [
        body instanceof ReadableStream ? null : body,
      ]);
    };
  }

  private initFetch() {
    const root: Window =
      typeof window !== 'undefined'
        ? window
        : (globalThis as unknown as Window);

    const origFetch = root.fetch.bind(root);
    root.fetch = async (
      input: RequestInfo,
      init?: RequestInit
    ): Promise<Response> => {
      const requestUrl = typeof input === 'string' ? input : input.url;
      const response = await origFetch(input, init);
      const contentType = response.headers.get('content-type') || '';

      // Only handle JSON responses for now
      if (contentType.includes('application/json')) {
        const clone = response.clone();
        const text = await clone.text();
        const newText = this.runHooks(requestUrl, text);

        if (newText !== text) {
          this.toast.show('Response modified by hook');
          return new Response(newText, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        }
      }

      return response;
    };
  }
}

export const requestHook = new HttpRequestInterceptor();

export type URLMatcher = (url: string) => boolean;
export type TransformFn = (responseText: string) => string | null;

export interface Hook {
  urlMatcher: URLMatcher;
  transform: TransformFn;
}

export interface Toast {
  show(msg: string, opt?: unknown): void;
}
