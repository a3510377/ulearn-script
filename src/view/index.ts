import { createElement, onClickOutside } from '@/utils/dom';

import { buildPanel } from './panel';
import { setupSettingsMenuStyle } from './styles';

const DRAG_THRESHOLD = 5;
const DRAG_DELAY = 150;
const BOUNDARY_PADDING = 16;

export const initSettingsMenu = () => {
  // Avoid duplicate initialization
  const existing = document.querySelector('.mk-settings-menu');
  if (existing) return;

  const settingsMenuEl = createElement('div', 'mk-settings-menu');
  const menuPanelEl = createElement('div', 'mk-settings-menu-panel', 'mk-hide');
  // create floating action button (FAB)
  const fabButtonEl = createElement('div', 'mk-settings-fab');

  const cleanupSettingsMenuStyle = setupSettingsMenuStyle();

  const updateMenuPanelPosition = () => {
    const fabRect = fabButtonEl.getBoundingClientRect();
    const isRight = fabButtonEl.classList.contains('right');

    if (isRight) {
      menuPanelEl.style.right = `${fabRect.width + 8}px`;
      menuPanelEl.style.left = 'unset';
    } else {
      menuPanelEl.style.left = `${fabRect.width + 8}px`;
      menuPanelEl.style.right = 'unset';
    }

    // Align panel vertically with FAB
    menuPanelEl.style.top = `${fabRect.top}px`;
  };

  let suppressNextClick = false;
  fabButtonEl.addEventListener('click', () => {
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }

    if (menuPanelEl.classList.contains('mk-hide')) {
      updateMenuPanelPosition();
    }
    menuPanelEl.classList.toggle('mk-hide');
  });

  let rafId = 0;
  let startX = 0;
  let startY = 0;
  let isDragging = false;
  let isPointerDown = false;
  let timeoutID: number | undefined;
  let nextPos: Position | null = null;

  const setDraggingState = (dragging: boolean) => {
    fabButtonEl.classList.toggle('dragging', dragging);
    document.body.style.userSelect = dragging ? 'none' : '';
  };

  const onPointerDown = (e: PointerEvent) => {
    isPointerDown = true;
    startX = e.clientX;
    startY = e.clientY;
    suppressNextClick = false;

    // Prepare for dragging if held
    clearTimeout(timeoutID);
    timeoutID = window.setTimeout(() => {
      if (isPointerDown) {
        isDragging = true;
        suppressNextClick = true;
        setDraggingState(true);

        const updateTransform = () => {
          fabButtonEl.style.transform = `translateY(${
            e.clientY - fabButtonEl.getBoundingClientRect().top
          }px)`;
        };

        updateTransform();
        fabButtonEl.addEventListener('transitionrun', updateTransform);
        fabButtonEl.addEventListener(
          'transitionend',
          () =>
            fabButtonEl.removeEventListener('transitionrun', updateTransform),
          { once: true }
        );
        fabButtonEl.setPointerCapture(e.pointerId);
      }
    }, DRAG_DELAY);
  };

  const applyNextPos = () => {
    rafId = 0;
    if (!nextPos) return;
    const { x, y } = nextPos;
    nextPos = null;

    // Boundaries
    const { offsetWidth: width, offsetHeight: height } = fabButtonEl;
    const maxLeft = window.innerWidth - width;
    const maxTop = window.innerHeight - height - BOUNDARY_PADDING;

    const clampedX = Math.max(
      BOUNDARY_PADDING,
      Math.min(maxLeft, x - width / 2)
    );
    const clampedY = Math.max(
      BOUNDARY_PADDING,
      Math.min(maxTop, y - height / 2)
    );

    const isLeft = clampedX + width / 2 < window.innerWidth / 2;
    if (isLeft) {
      fabButtonEl.style.left = `${clampedX}px`;
      fabButtonEl.style.right = 'unset';
    } else {
      fabButtonEl.style.left = 'unset';
      fabButtonEl.style.right = `${window.innerWidth - clampedX - width}px`;
    }
    fabButtonEl.style.top = `${clampedY}px`;
    fabButtonEl.style.transform = 'translateY(0)';
  };

  const onPointerMove = (e: PointerEvent) => {
    const moved =
      Math.abs(e.clientX - startX) > DRAG_THRESHOLD ||
      Math.abs(e.clientY - startY) > DRAG_THRESHOLD;

    if (moved && isPointerDown && !isDragging) {
      fabButtonEl.classList.remove('right');
      isDragging = true;
      suppressNextClick = true;
      clearTimeout(timeoutID);
      setDraggingState(true);
    }

    if (isDragging) {
      nextPos = { x: e.clientX, y: e.clientY };

      if (!rafId) rafId = requestAnimationFrame(applyNextPos);
    }
  };

  const snapToEdge = () => {
    const rect = fabButtonEl.getBoundingClientRect();
    const isLeft = rect.left + rect.width / 2 < window.innerWidth / 2;

    if (isLeft) {
      fabButtonEl.style.left = '0px';
      fabButtonEl.style.right = 'unset';
    } else {
      fabButtonEl.style.left = 'unset';
      fabButtonEl.style.right = '0px';
    }

    fabButtonEl.classList.toggle('right', !isLeft);
    fabButtonEl.style.transform = 'translateY(0)';

    // Update panel position if visible
    if (!menuPanelEl.classList.contains('mk-hide')) {
      updateMenuPanelPosition();
    }
  };

  const onPointerUp = () => {
    isPointerDown = false;
    clearTimeout(timeoutID);

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }

    if (isDragging) {
      isDragging = false;
      setDraggingState(false);
      snapToEdge();
    } else {
      // If release without dragging, reset transform
      fabButtonEl.style.transform = '';
    }
  };

  const panelCleanup = buildPanel(menuPanelEl, () => {
    menuPanelEl.classList.add('mk-hide');
  });

  settingsMenuEl.append(menuPanelEl, fabButtonEl);
  document.body.appendChild(settingsMenuEl);

  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointermove', onPointerMove);
  fabButtonEl.addEventListener('pointerdown', onPointerDown);

  const cleanupClickOutside = onClickOutside(menuPanelEl, (e) => {
    if (e.target === fabButtonEl) return;

    menuPanelEl.classList.add('mk-hide');
  });

  return () => {
    panelCleanup();
    cleanupSettingsMenuStyle();
    fabButtonEl.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    cleanupClickOutside();
  };
};

export interface Position {
  x: number;
  y: number;
}
