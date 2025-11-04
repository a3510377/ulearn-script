import settingsStore from '@/store/settings';

import { buildRow, buildToggle } from './formElements';

import { createElement } from '#/dom';

export const buildFeaturesPane = () => {
  const pane = createElement('div');

  pane.appendChild(
    buildRow({
      label: '移除頁腳',
      desc: '隱藏頁面底部的頁腳區域',
      field: () => buildToggle('removeFooter', settingsStore),
      kv: () => (settingsStore.get('removeFooter') ? '開啟' : '關閉'),
    })
  );

  pane.appendChild(
    buildRow({
      label: '阻擋頁面切換檢測',
      desc: '繞過全螢幕/視窗切換的檢測',
      field: () => buildToggle('blockEvents', settingsStore),
      kv: () => (settingsStore.get('blockEvents') ? '開啟' : '關閉'),
    })
  );

  pane.appendChild(
    buildRow({
      label: '啟用文字選取',
      desc: '允許複製與選取頁面文字',
      field: () => buildToggle('enableUserSelect', settingsStore),
      kv: () => (settingsStore.get('enableUserSelect') ? '開啟' : '關閉'),
    })
  );

  pane.appendChild(
    buildRow({
      label: 'RWD/樣式優化',
      desc: '響應式設計與介面優化',
      field: () => buildToggle('fixStyle', settingsStore),
      kv: () => (settingsStore.get('fixStyle') ? '開啟' : '關閉'),
    })
  );

  pane.appendChild(
    buildRow({
      label: '強制允許下載',
      desc: '繞過影片下載限制',
      field: () => buildToggle('allowDownload', settingsStore),
      kv: () => (settingsStore.get('allowDownload') ? '開啟' : '關閉'),
    })
  );

  return pane;
};
