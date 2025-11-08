import type { Feature, FeatureModule } from '@/feature';
import { createElement } from '@/utils/dom';
import type { BaseStateType } from '@/utils/state';

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
    title.addEventListener('click', () => title.classList.toggle('collapsed'));
    groupWrapper.append(title);

    const list = createElement('div', 'mk-settings-group-content');
    for (const feature of features) {
      const featureBox = createElement('div', 'mk-settings-feature');

      const desc = feature.description;
      let descEl: HTMLHeadingElement | undefined;
      if (desc) {
        descEl = createElement('h4', 'mk-settings-feature-description');
        descEl.textContent = desc ?? '';
      }

      if (
        'toggle' in feature.options ||
        'enable' in feature.options ||
        'disable' in feature.options
      ) {
        const labelEl = createElement('label', 'mk-settings-feature-label');
        const labelText = createElement('h3');
        labelText.textContent = feature.name;

        const inputEl = createElement('input', 'mk-settings-feature-input');
        inputEl.name = feature.options.id;
        inputEl.type = 'checkbox';
        inputEl.checked = !!feature.get();
        inputEl.addEventListener('change', () => feature.click());

        feature.on((_, newValue) => (inputEl.checked = !!newValue));

        const wrapper = createElement(
          'div',
          'mk-settings-feature-base-wrapper'
        );

        wrapper.append(labelText, inputEl);
        labelEl.append(wrapper);
        descEl && labelEl.append(descEl);

        featureBox.append(labelEl);
      }

      if ('click' in feature.options) {
        const btn = createElement('button', 'mk-button');
        btn.textContent = feature.name;
        btn.addEventListener('click', () => feature.click());
        featureBox.append(btn);

        descEl && featureBox.append(descEl);
      }

      list.append(featureBox);
    }

    groupWrapper.append(list);
    container.append(groupWrapper);
  }

  return container;
};
