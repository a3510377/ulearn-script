import { createElement, onClickOutside } from '@/utils/dom';

import { buildSettingsPanel } from './panel';
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

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 12; // Gap between FAB and panel

    // Temporarily show panel to get accurate dimensions
    const wasHidden = menuPanelEl.classList.contains('mk-hide');
    if (wasHidden) {
      menuPanelEl.style.visibility = 'hidden';
      menuPanelEl.classList.remove('mk-hide');
    }

    const panelRect = menuPanelEl.getBoundingClientRect();
    const panelWidth = panelRect.width;
    const panelHeight = panelRect.height;

    if (wasHidden) {
      menuPanelEl.classList.add('mk-hide');
      menuPanelEl.style.visibility = '';
    }

    // Determine horizontal position
    let left: number;
    let right: number | null = null;

    if (isRight) {
      // FAB is on right side, try to show panel on left
      const rightPos = viewportWidth - fabRect.left + gap;
      const leftEdge = viewportWidth - rightPos - panelWidth;

      // Check if panel would overflow on left
      if (leftEdge < BOUNDARY_PADDING) {
        // Not enough space on left, calculate best position
        const spaceOnLeft = fabRect.left - gap - BOUNDARY_PADDING;
        const spaceOnRight =
          viewportWidth - fabRect.right - gap - BOUNDARY_PADDING;

        if (spaceOnLeft >= panelWidth) {
          // Can fit on left
          right = viewportWidth - fabRect.left + gap;
        } else if (spaceOnRight >= panelWidth) {
          // Better fit on right (inside)
          right = viewportWidth - fabRect.right - gap;
        } else if (spaceOnLeft > spaceOnRight) {
          // Neither side fits perfectly, use side with more space
          right = BOUNDARY_PADDING;
        } else {
          right = viewportWidth - fabRect.right - gap;
        }
      } else {
        right = rightPos;
      }

      menuPanelEl.style.right = `${right}px`;
      menuPanelEl.style.left = 'unset';
    } else {
      // FAB is on left side, try to show panel on right
      left = fabRect.right + gap;

      // Check if panel would overflow on right
      if (left + panelWidth > viewportWidth - BOUNDARY_PADDING) {
        // Not enough space on right, calculate best position
        const spaceOnRight =
          viewportWidth - fabRect.right - gap - BOUNDARY_PADDING;
        const spaceOnLeft = fabRect.left - gap - BOUNDARY_PADDING;

        if (spaceOnRight >= panelWidth) {
          // Can fit on right
          left = fabRect.right + gap;
        } else if (spaceOnLeft >= panelWidth) {
          // Better fit on left (inside)
          left = Math.max(BOUNDARY_PADDING, fabRect.left - panelWidth - gap);
        } else if (spaceOnRight > spaceOnLeft) {
          // Neither side fits perfectly, use side with more space
          left = fabRect.right + gap;
        } else {
          left = Math.max(
            BOUNDARY_PADDING,
            viewportWidth - panelWidth - BOUNDARY_PADDING
          );
        }
      }

      menuPanelEl.style.left = `${left}px`;
      menuPanelEl.style.right = 'unset';
    }

    // Determine vertical position
    // Try to align with FAB center first
    let top = fabRect.top + fabRect.height / 2 - panelHeight / 2;

    // Clamp to viewport boundaries
    const minTop = BOUNDARY_PADDING;
    const maxTop = viewportHeight - panelHeight - BOUNDARY_PADDING;

    top = Math.max(minTop, Math.min(maxTop, top));

    const topPercentage = (top / viewportHeight) * 100;
    menuPanelEl.style.top = `${topPercentage}%`;
    menuPanelEl.classList.toggle('right', isRight);
  };

  let suppressNextClick = false;
  fabButtonEl.addEventListener('click', () => {
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }

    const isCurrentlyHidden = menuPanelEl.classList.contains('mk-hide');
    if (isCurrentlyHidden) {
      // Before showing, update position
      updateMenuPanelPosition();

      // Small delay to ensure position is set before animation
      requestAnimationFrame(() => {
        menuPanelEl.classList.remove('mk-hide');
      });
    } else {
      menuPanelEl.classList.add('mk-hide');
    }
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

    if (dragging) {
      menuPanelEl.classList.add('mk-hide');
    }
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
          () => {
            fabButtonEl.removeEventListener('transitionrun', updateTransform);
          },
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
    const viewportHeight = window.innerHeight;
    const maxTop = viewportHeight - height - BOUNDARY_PADDING;
    const clampedY = Math.max(
      BOUNDARY_PADDING,
      Math.min(maxTop, y - height / 2)
    );
    const clampedX = Math.min(window.innerWidth - width, x - width / 2);

    const isLeft = clampedX + width / 2 < window.innerWidth / 2;
    if (isLeft) {
      fabButtonEl.style.left = `${clampedX}px`;
      fabButtonEl.style.right = 'unset';
    } else {
      fabButtonEl.style.left = 'unset';
      fabButtonEl.style.right = `${window.innerWidth - clampedX - width}px`;
    }

    fabButtonEl.style.top = `${Math.round((clampedY / viewportHeight) * 100)}%`;
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

  const panelCleanup = buildSettingsPanel(menuPanelEl, () => {
    menuPanelEl.classList.add('mk-hide');
  });

  settingsMenuEl.append(menuPanelEl, fabButtonEl);
  document.body.append(settingsMenuEl);

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
