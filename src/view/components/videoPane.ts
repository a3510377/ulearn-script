import videoSettingsStore from '@/store/videoSettings';

import { buildRow, buildToggle, makeRange } from './formElements';

import { createElement } from '#/dom';

export const buildVideoPane = () => {
  const pane = createElement('div');

  pane.appendChild(
    buildRow({
      label: '自動下一個',
      desc: '影片結束自動播放下一個',
      field: () => buildToggle('autoNext', videoSettingsStore),
      kv: () => (videoSettingsStore.get('autoNext') ? '開啟' : '關閉'),
    })
  );

  pane.appendChild(
    buildRow({
      label: '播放速度',
      desc: '倍速播放設定',
      field: () => {
        const selectEl = createElement('select', 'mk-select');
        const rates = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5];
        const current = videoSettingsStore.get('playbackRate');

        rates.forEach((r) => {
          const opt = document.createElement('option');
          opt.value = String(r);
          opt.textContent = `${r}x`;

          if (r === current) opt.selected = true;

          selectEl.appendChild(opt);
        });

        selectEl.addEventListener('change', () => {
          videoSettingsStore.set('playbackRate', parseFloat(selectEl.value));
        });

        videoSettingsStore.subscribe(
          'playbackRate',
          ({ value }) => {
            if (parseFloat(selectEl.value) !== value) {
              selectEl.value = String(value);
            }
          },
          false
        );

        return selectEl;
      },
      kv: () => `${videoSettingsStore.get('playbackRate')}x`,
    })
  );

  pane.appendChild(
    buildRow({
      label: '自動下一個觸發比例',
      desc: '達到比例後視為完成 (0.5~0.99)',
      field: () => {
        return makeRange(
          videoSettingsStore.get('autoNextThreshold'),
          0.5,
          0.99,
          0.01,
          (v) => videoSettingsStore.set('autoNextThreshold', v)
        );
      },
      kv: () => String(videoSettingsStore.get('autoNextThreshold').toFixed(2)),
    })
  );

  pane.appendChild(
    buildRow({
      label: '觸發比例隨機偏移',
      desc: '每次播放時±偏移，避免固定',
      field: () => {
        return makeRange(
          videoSettingsStore.get('autoNextThresholdVariance'),
          0,
          0.2,
          0.01,
          (v) => videoSettingsStore.set('autoNextThresholdVariance', v)
        );
      },
      kv: () =>
        String(videoSettingsStore.get('autoNextThresholdVariance').toFixed(2)),
    })
  );

  return pane;
};
