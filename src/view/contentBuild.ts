import type { Feature, FeatureModule } from '@/feature';
import { getI18nForLang, skipHookFunc } from '@/utils';
import { createElement } from '@/utils/dom';
import type { BaseStateType } from '@/utils/state';

import i18n from './_i18n.json';
import { createTooltip } from './floating';

export const buildContentUI = <T extends BaseStateType>(
  id: string,
  module: FeatureModule<T>
) => {
  const container = createElement('div', 'mk-settings-module');
  container.dataset.module = id;

  for (const [groupID, features] of Object.entries(module.groups) as [
    string,
    Feature<T>[]
  ][]) {
    if (!features?.length) continue;

    const groupWrapper = createElement('div', 'mk-settings-group');
    groupWrapper.dataset.group = groupID;

    const title = createElement('h2', 'mk-settings-group-title');
    title.textContent = module.getI18N()?.groups?.[groupID] || groupID;
    title.addEventListener(
      'click',
      skipHookFunc(() => title.classList.toggle('collapsed'))
    );
    groupWrapper.append(title);

    const list = createElement('div', 'mk-settings-group-content');
    for (const feature of features) {
      const featureBox = createElement('div', 'mk-settings-feature');

      const desc = feature.description;
      let descEl: HTMLHeadingElement | undefined;
      if (desc) {
        descEl = createElement('h4', 'mk-settings-feature-description');
        descEl.textContent = desc;
      }

      const labelEl = createElement('label', 'mk-settings-feature-label');
      const labelText = createElement('h3');
      labelText.textContent = feature.name;

      const wrapper = createElement('div', 'mk-settings-feature-base-wrapper');
      wrapper.append(labelText);

      if (feature.options.liveReload === false) {
        const liveReloadTag = createElement('span', 'mk-livereload-tag');
        liveReloadTag.textContent = '⚠️';
        createTooltip(
          liveReloadTag,
          getI18nForLang(i18n).needLiveReloadTooltip
        );

        labelText.append(liveReloadTag);
      }

      if (
        'toggle' in feature.options ||
        'enable' in feature.options ||
        'disable' in feature.options
      ) {
        const inputEl = createElement('input', 'mk-settings-feature-input');
        inputEl.name = feature.options.id;
        inputEl.type = 'checkbox';
        inputEl.checked = !!feature.get();
        inputEl.addEventListener(
          'change',
          skipHookFunc(() => feature.click())
        );

        feature.on((_, newValue) => (inputEl.checked = !!newValue));

        wrapper.append(inputEl);
      }

      labelEl.append(wrapper);
      featureBox.append(labelEl);
      descEl && labelEl.append(descEl);

      // if ('click' in feature.options) {
      //   const btn = createElement('button', 'mk-button');
      //   btn.textContent = feature.name;
      //   btn.addEventListener('click', () => feature.click());
      //   featureBox.append(btn);

      //   descEl && featureBox.append(descEl);
      // }

      list.append(featureBox);
    }

    groupWrapper.append(list);
    container.append(groupWrapper);
  }

  return container;
};
