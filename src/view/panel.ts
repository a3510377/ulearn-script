import { buildFeaturesPane } from './components/featuresPane';
import { buildManagePane } from './components/managePane';
import { buildVideoPane } from './components/videoPane';

import { createElement } from '#/dom';

export const buildPanel = (panel: HTMLElement, onClose: () => void) => {
  // Title
  const title = createElement('div', 'mk-settings-title');
  title.textContent = '腳本設定';
  panel.appendChild(title);

  // Tabs
  const tabs = createElement('div', 'mk-settings-tabs');
  const tabButtons = [
    { id: 'features', label: '功能開關', icon: '⚙️' },
    { id: 'video', label: '影片設定', icon: '🎬' },
    { id: 'interface', label: '介面設定', icon: '🎨' },
    { id: 'manage', label: '管理', icon: '🛠️' },
  ];

  const tabContents: Record<string, HTMLElement> = {};

  tabButtons.forEach(({ id, label, icon }, index) => {
    const btn = createElement('button', 'mk-settings-tab');
    btn.textContent = `${icon} ${label}`;
    btn.dataset.tab = id;
    if (index === 0) btn.classList.add('active');
    tabs.appendChild(btn);
  });

  panel.appendChild(tabs);

  // Content container
  const content = createElement('div', 'mk-settings-content');

  // Build tab panes
  tabContents['features'] = buildFeaturesPane();
  tabContents['video'] = buildVideoPane();
  tabContents['manage'] = buildManagePane();

  Object.entries(tabContents).forEach(([id, pane], index) => {
    pane.classList.add('mk-settings-tab-pane');
    pane.dataset.pane = id;

    if (index === 0) pane.classList.add('active');
    content.appendChild(pane);
  });

  panel.appendChild(content);

  // Tab switching logic
  tabs.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest(
      '.mk-settings-tab'
    ) as HTMLButtonElement;
    if (!btn) return;

    const targetTab = btn.dataset.tab;

    // Update active tab button
    tabs
      .querySelectorAll('.mk-settings-tab')
      .forEach((tab) => tab.classList.remove('active'));
    btn.classList.add('active');

    // Update active pane
    content
      .querySelectorAll('.mk-settings-tab-pane')
      .forEach((pane) => pane.classList.remove('active'));

    const targetPane = content.querySelector(`[data-pane="${targetTab}"]`);
    if (targetPane) targetPane.classList.add('active');
  });

  // Close on Escape key
  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') onClose();
  };
  document.addEventListener('keydown', onKeyDown);

  return () => {
    document.removeEventListener('keydown', onKeyDown);
  };
};
