import { createStyle } from '@/utils/dom';

export const setupSettingsMenuStyle = () => {
  const settingsMenuStyle = createStyle(`$css
    .mk-settings-menu {
      position: relative;
      z-index: 99999;
      font-family: Arial, sans-serif;
      user-select: none;
    }

    .mk-hide {
      display: none !important;
    }

    .mk-settings-fab {
      position: fixed;
      top: 50%;
      left: 0;
      opacity: 0.4;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 10px;
      height: 10rem;
      background-color: #a8d0ff;
      box-shadow: 0px 0px 8px 2px #000;
      border-radius: 0 8px 8px 0;
      color: white;
      cursor: pointer;
      transform: translateY(var(--drag-offset, -50%));
      transition: all 0.3s;
      touch-action: none;
      will-change: transform, left, top, right, width, height, border-radius,
        opacity;
    }

    .mk-settings-fab.right {
      border-radius: 8px 0 0 8px;
    }

    .mk-settings-fab.dragging {
      opacity: 0.6;
      border-radius: 50%;
      width: 1.5rem !important;
      height: 1.5rem;
      transition: width 0.2s, height 0.2s, background-color 0.2s, border-radius 0.2s,
        opacity 0.2s, box-shadow 0.2s, transform 0.2s;
    }

    .mk-settings-fab::before {
      content: '';
      width: 3px;
      height: 1.2rem;
      border-radius: 1.5px;
      background-color: white;
      display: block;
      box-shadow: 0 -0.4rem white, 0 0.4rem white;
      transition: height 0.3s;
    }

    .mk-settings-fab.dragging::before {
      height: 0;
    }

    .mk-settings-fab:hover,
    .mk-settings-fab.dragging,
    .mk-settings-menu-panel:not(.mk-hide) ~ .mk-settings-fab {
      opacity: 0.6;
      width: 1rem;
      background-color: #6fc3c3;
      box-shadow: 0px 0px 12px 4px #000;
    }
  `);

  const settingsPanelStyle = createStyle(`$css
    .mk-settings-menu-panel {
      z-index: 99999;
      position: fixed;
      width: 30rem;
      top: 0;
      left: 0;
      width: 80%;
      max-width: 40rem;
      padding: 1rem;
      box-shadow: 0 4px 20px #0000004d;
      border-radius: 1rem;
      background-color: #9bdad6;
      opacity: 0;
      transform: scale(0.95);
      transition: opacity 0.2s ease, transform 0.2s ease;
      pointer-events: none;
      transform-origin: left center;
    }

    .mk-settings-menu-panel:not(.mk-hide) {
      opacity: 1;
      transform: scale(1);
      pointer-events: auto;
    }

    .mk-settings-menu-panel.right {
      transform-origin: right center;
    }

    .mk-settings-menu-panel .mk-settings-title {
      font-size: 1.7rem;
      text-align: center;
      font-weight: bold;
      margin-bottom: 1rem;
    }

    .mk-settings-menu-panel .mk-settings-tabs {
      display: flex;
      justify-content: space-between;
      gap: 1.5rem;
      padding: 0 0.5rem;
      margin-bottom: 1rem;
    }

    .mk-settings-menu-panel .mk-settings-tab {
      flex: 1 1 0;
      padding: 0.5rem 0.75rem;
      border: none;
      border-radius: 0.5rem;
      background-color: #f5f5f5;
      color: #333;
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease,
        transform 0.2s ease;
    }

    .mk-settings-menu-panel .mk-settings-tab:hover {
      background-color: #e8e8e8;
    }

    .mk-settings-menu-panel .mk-settings-tab.active {
      color: #fff;
      background-color: #4a90e2;
      box-shadow: inset 0 0 0 1px #00000026;
    }

    .mk-settings-menu-panel .mk-settings-content {
      min-height: 20rem;
      max-height: 20rem;
      overflow-y: auto;
      padding-right: 1rem;
      scrollbar-gutter: stable;
      scrollbar-width: auto;
      overscroll-behavior-y: contain;

      scrollbar-width: thin;
      scrollbar-color: #00000073 #00000014;
    }

    .mk-settings-menu-panel .mk-settings-content::-webkit-scrollbar {
      width: 0.6rem;
    }

    .mk-settings-menu-panel .mk-settings-content::-webkit-scrollbar-track {
      background: #00000014;
      border-radius: 0.5rem;
    }

    .mk-settings-menu-panel .mk-settings-content::-webkit-scrollbar-thumb {
      background-color: #00000059;
      border-radius: 0.5rem;
      border: 2px solid transparent;
      background-clip: content-box;
    }

    .mk-settings-menu-panel .mk-settings-content:hover::-webkit-scrollbar-thumb {
      background-color: #00000080;
    }

    .mk-settings-menu-panel .mk-settings-content:active::-webkit-scrollbar-thumb,
    .mk-settings-menu-panel .mk-settings-content::-webkit-scrollbar-thumb:active {
      background-color: #00000099;
    }

    .mk-settings-menu-panel .mk-settings-tab-pane {
      display: none;
    }

    .mk-settings-menu-panel .mk-settings-tab-pane.active {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .mk-settings-menu-panel .mk-settings-field {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .mk-settings-menu-panel .mk-settings-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.25rem 0;
    }

    .mk-settings-menu-panel .mk-settings-row.mk-field-split {
      align-items: unset;
      flex-direction: column;
    }

    .mk-settings-menu-panel .mk-settings-row.mk-field-split .mk-settings-field {
      justify-content: flex-end;
    }

    .mk-settings-menu-panel .mk-settings-label {
      font-size: 1.2rem;
      font-weight: 600;
      color: #1a1a1a;
    }

    .mk-settings-menu-panel .mk-settings-desc {
      margin-top: 0.25rem;
      font-size: 0.95rem;
      color: #3a3a3a;
      opacity: 0.9;
    }

    .mk-settings-menu-panel .mk-input[type='number'],
    .mk-settings-menu-panel .mk-select {
      height: 2rem;
      padding: 0 0.5rem;
      border-radius: 0.375rem;
      border: 1px solid #0000002b;
      background-color: #fff;
      color: #111;
    }

    .mk-settings-menu-panel .mk-input[type='number']:focus,
    .mk-settings-menu-panel .mk-select:focus {
      outline: none;
      border-color: #5eb3ff;
      box-shadow: 0 0 0 3px #5eb3ff40;
    }

    .mk-settings-menu-panel .mk-input[type='range'] {
      width: 12rem;
    }

    .mk-settings-menu-panel .mk-checkbox {
      width: 1.2rem;
      height: 1.2rem;
      accent-color: #4a9fff;
    }

    .mk-settings-menu-panel .mk-kv {
      margin-left: 0.5rem;
      font-size: 1rem;
      min-width: 2.5rem;
      color: #2a2a2a;
      opacity: 0.9;
      text-align: end;
    }
  `);

  return () => {
    settingsMenuStyle.remove();
    settingsPanelStyle.remove();
  };
};
