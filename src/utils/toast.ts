import { SVG_CLOSE, SVG_INFO, SVG_SUCCESS, SVG_WARN } from '@/assets/svg';
import { createElement, createStyle, createSvgFromString } from './dom';

export const TOAST_ICONS = {
  warn: SVG_WARN,
  info: SVG_INFO,
  success: SVG_SUCCESS,
  error: SVG_WARN,
};

class ToastManager {
  private viewport: HTMLDivElement;
  private activeToasts: Set<HTMLDivElement>;

  constructor() {
    this.activeToasts = new Set();
    this.viewport = createElement('div', 'mk-toast-viewport');
    this.viewport.tabIndex = 0;
    document.body.appendChild(this.viewport);

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const last = Array.from(this.activeToasts).pop();
        if (last) this.close(last, true);
      }
    });

    createStyle(`$css
      .mk-toast-viewport {
        position: fixed;
        bottom: 16px;
        right: 16px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        z-index: 9999;
        outline: none;
      }

      .mk-toast {
        display: flex;
        align-items: center;
        min-width: 200px;
        max-width: 320px;
        padding: 12px 2em 12px 1em;
        border-radius: 8px;
        background: #333;
        color: #fff;
        font-size: 1.3rem;
        box-shadow: 0 4px 10px #00000033;
        opacity: 1;
        transform: translateX(0);
        transition: opacity 0.25s ease, transform 0.25s ease;
        user-select: none;
        touch-action: none;
        gap: 8px;
        position: relative;
      }

      .mk-toast.hidden {
        opacity: 0;
        transform: translateX(calc(100% * attr(direction, 1)));
      }

      .mk-toast-icon {
        width: 2.2rem;
        height: 2.2rem;
      }

      .mk-toast-close {
        position: absolute;
        top: 5px;
        right: 5px;
        width: 1.8rem;
        height: 1.8rem;
        padding: 6px;
        cursor: pointer;
        border-radius: 50%;
      }

      .mk-toast-close:hover {
        background: #ffffff26 !important;
      }
    `);
  }

  show(
    message: string,
    {
      duration = 5000,
      type = 'success',
    }: { duration?: number; type?: keyof typeof TOAST_ICONS } = {}
  ) {
    const toastEl = this.createToastElement(message, type);
    this.viewport.appendChild(toastEl);
    this.activeToasts.add(toastEl);

    let timer: number | null = null;
    let startTime = Date.now();
    let remaining = duration < 0 ? Infinity : duration;

    const startTimer = () => {
      if (remaining === Infinity) return;
      timer = window.setTimeout(() => this.close(toastEl), remaining);
      startTime = Date.now();
    };

    const pauseTimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        remaining -= Date.now() - startTime;
      }
    };

    if (remaining > 0 && remaining !== Infinity) {
      startTimer();
    }

    toastEl.addEventListener('mouseenter', pauseTimer);
    toastEl.addEventListener('mouseleave', startTimer);

    let pointerStart: { x: number; y: number } | null = null;
    let deltaX = 0;

    toastEl.addEventListener('pointerdown', (e: PointerEvent) => {
      pointerStart = { x: e.clientX, y: e.clientY };
    });

    toastEl.addEventListener('pointermove', (e: PointerEvent) => {
      if (!pointerStart) return;
      deltaX = e.clientX - pointerStart.x;
      if (Math.abs(deltaX) > 10) {
        toastEl.style.transform = `translateX(${deltaX}px)`;
      }
    });

    const tryClose = () => {
      if (Math.abs(deltaX) > 80) {
        toastEl.dataset.direction = deltaX > 0 ? '-1' : '1';
        this.close(toastEl);
      } else toastEl.style.transform = '';

      deltaX = 0;
      pointerStart = null;
    };

    toastEl.addEventListener('pointerup', tryClose);
    toastEl.addEventListener('pointercancel', tryClose);
    toastEl.addEventListener('pointerleave', tryClose);

    return { close: () => this.close(toastEl) };
  }

  close(toast: HTMLDivElement, byEsc = false) {
    if (!this.activeToasts.has(toast)) return;

    // remove event listeners
    toast.replaceWith(toast.cloneNode(true));

    toast.classList.add('hidden');
    setTimeout(() => {
      this.activeToasts.delete(toast);
      toast.remove();

      if (byEsc) this.viewport.focus();
    }, 250);
  }

  private createToastElement(message: string, type: keyof typeof TOAST_ICONS) {
    const toastEl = createElement('div', `mk-toast mk-toast-${type}`);
    const toastTextEl = createElement('div', 'mk-toast-text');
    const toastIconEl = createSvgFromString(
      TOAST_ICONS[type] || TOAST_ICONS.info,
      'mk-toast-icon'
    );
    const toastCloseIconEl = createSvgFromString(SVG_CLOSE, 'mk-toast-close');

    toastTextEl.textContent = message;
    toastCloseIconEl.addEventListener('click', () => this.close(toastEl));

    toastEl.append(toastIconEl, toastTextEl, toastCloseIconEl);
    return toastEl;
  }
}

const toastManager = new ToastManager();

export const useToast = () => toastManager;
