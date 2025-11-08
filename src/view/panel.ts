import { featureManager } from '@/feature';
import { getI18nForLang } from '@/utils/utils';

import i18n from './_i18n.json';
import { buildContentUI } from './contentBuild';

import { createElement } from '#/dom';

export const buildSettingsPanel = (panel: HTMLElement, onClose: () => void) => {
  // Title
  const title = createElement('div', 'mk-settings-title');
  title.textContent = getI18nForLang(i18n).settings?.title ?? 'Settings';
  panel.append(title);

  // Tabs
  const tabs = createElement('div', 'mk-settings-tabs');
  const tabContents: Record<string, HTMLElement> = {};

  const content = createElement('div', 'mk-settings-content');
  for (const [index, [id, module]] of Array.from(
    featureManager.get() // Map<string, FeatureModule<any>>
  ).entries()) {
    const moduleInfo = module.getI18N()?.module;
    const moduleContentEl = buildContentUI(id, module);
    const label = moduleInfo?.name ?? id;
    const description = moduleInfo?.description ?? '';
    tabContents[id] = moduleContentEl;

    const btn = createElement('button', 'mk-settings-tab');
    btn.textContent = `${label}`;
    btn.dataset.tab = id;

    // TODO global tooltip util
    if (description) {
      const tooltip = createElement('div', 'mk-settings-tab-tooltip');
      tooltip.textContent = description;

      btn.title = description;
      btn.append(tooltip);
    }

    if (index === 0) {
      moduleContentEl.classList.add('active');
      btn.classList.add('active');
    }

    tabs.append(btn);
    content.append(moduleContentEl);
  }

  panel.append(tabs, content);

  // Tab switching logic
  tabs.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest(
      '.mk-settings-tab'
    ) as HTMLButtonElement;
    if (!btn) return;

    const targetTab = btn.dataset.tab;

    // Update active tab button
    tabs
      .querySelectorAll('.mk-settings-tab.active')
      .forEach((tab) => tab.classList.remove('active'));
    btn.classList.add('active');

    content
      .querySelectorAll('.mk-settings-module.active')
      .forEach((module) => module.classList.remove('active'));

    content
      .querySelector(`[data-module="${targetTab}"]`)
      ?.classList.add('active');
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
